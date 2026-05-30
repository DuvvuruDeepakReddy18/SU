import { Injectable, NotFoundException } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { PrismaService } from '../../infra/prisma/prisma.service';
import { CodeRunner } from './code-runner';
import { AiReviewer } from './ai-reviewer';
import type { ProblemsQueryDto, SubmissionCreateDto } from './dto';

@Injectable()
export class PracticeService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly runner: CodeRunner,
    private readonly ai: AiReviewer,
  ) {}

  async listProblems(query: ProblemsQueryDto) {
    const where: Prisma.ProblemWhereInput = {
      ...(query.difficulty ? { difficulty: query.difficulty } : {}),
      ...(query.topic ? { topics: { has: query.topic } } : {}),
      ...(query.q ? { title: { contains: query.q, mode: 'insensitive' } } : {}),
    };
    const [items, total] = await Promise.all([
      this.prisma.problem.findMany({
        where,
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
        orderBy: { title: 'asc' },
        select: {
          id: true,
          title: true,
          slug: true,
          difficulty: true,
          topics: true,
          points: true,
        },
      }),
      this.prisma.problem.count({ where }),
    ]);
    return { items, total, page: query.page, pageSize: query.pageSize };
  }

  async getProblem(slug: string) {
    const problem = await this.prisma.problem.findUnique({
      where: { slug },
      include: { testCases: { where: { isHidden: false } } },
    });
    if (!problem) throw new NotFoundException('Problem not found');
    return problem;
  }

  async submit(userId: string, dto: SubmissionCreateDto) {
    const problem = await this.prisma.problem.findUnique({
      where: { id: dto.problemId },
      include: { testCases: true },
    });
    if (!problem) throw new NotFoundException('Problem not found');

    const submission = await this.prisma.submission.create({
      data: {
        userId,
        problemId: problem.id,
        language: dto.language,
        code: dto.code,
        verdict: 'PENDING',
      },
    });

    void this.judgeAndStore(submission.id, problem, dto);
    return submission;
  }

  async getSubmission(userId: string, id: string) {
    const sub = await this.prisma.submission.findUnique({
      where: { id },
      include: { problem: { select: { title: true, slug: true } } },
    });
    if (!sub || sub.userId !== userId) throw new NotFoundException('Submission not found');
    return sub;
  }

  async listSubmissions(userId: string) {
    return this.prisma.submission.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 50,
      include: { problem: { select: { title: true, slug: true, difficulty: true } } },
    });
  }

  private async judgeAndStore(
    submissionId: string,
    problem: { id: string; title: string; testCases: { input: string; output: string }[] },
    dto: SubmissionCreateDto,
  ) {
    let verdict: 'AC' | 'WA' | 'TLE' | 'CE' | 'RE' = 'AC';
    let totalRuntime = 0;
    let totalMemory = 0;
    let testsPassed = 0;
    const totalTests = problem.testCases.length;
    let failedTest: Prisma.InputJsonValue | undefined;

    try {
      for (const tc of problem.testCases) {
        const result = await this.runner.run(dto.language, dto.code, tc.input);
        totalRuntime += result.timeMs;
        totalMemory = Math.max(totalMemory, result.memoryKb);
        const got = result.stdout.trim();
        const want = tc.output.trim();

        if (result.verdict !== 'AC') {
          verdict = result.verdict;
          failedTest = {
            input: tc.input,
            expectedOutput: tc.output,
            gotStdout: got,
            stderr: result.stderr || null,
            compileOutput: result.compileOutput,
            status: result.statusDescription,
            backend: result.backend,
          };
          break;
        }
        if (got !== want) {
          verdict = 'WA';
          failedTest = {
            input: tc.input,
            expectedOutput: tc.output,
            gotStdout: got,
            stderr: result.stderr || null,
            compileOutput: result.compileOutput,
            status: 'Wrong Answer',
            backend: result.backend,
          };
          break;
        }
        testsPassed += 1;
      }
    } catch (e) {
      verdict = 'RE';
      failedTest = {
        input: problem.testCases[testsPassed]?.input ?? '',
        expectedOutput: problem.testCases[testsPassed]?.output ?? '',
        gotStdout: '',
        stderr: (e as Error).message,
        compileOutput: null,
        status: 'Runner unreachable',
      };
    }

    const updated = await this.prisma.submission.update({
      where: { id: submissionId },
      data: {
        verdict,
        runtimeMs: totalRuntime,
        memoryKb: totalMemory,
        testsPassed,
        testsTotal: totalTests,
        failedTest,
      },
    });

    // Run AI review for EVERY verdict (not just AC) so the student gets
    // actionable feedback on WA/RE/TLE/CE too.
    try {
      const feedback = await this.ai.review(problem.title, dto.language, dto.code, verdict);
      await this.prisma.submission.update({
        where: { id: submissionId },
        data: { aiFeedback: feedback },
      });
    } catch {
      // best-effort; verdict already stored
    }
    return updated;
  }

  /**
   * Returns the set of problem slugs this user has AC'd at least once.
   * Used by the UI to render checkmarks + progress bars.
   */
  async mySolvedSlugs(userId: string): Promise<string[]> {
    const rows = await this.prisma.submission.findMany({
      where: { userId, verdict: 'AC' },
      distinct: ['problemId'],
      select: { problem: { select: { slug: true } } },
    });
    return rows.map((r) => r.problem.slug);
  }

  /**
   * Per-domain progress: total problems, count solved by this user, and
   * a few next-suggested unsolved slugs.
   */
  async myProgress(userId: string) {
    const [domains, solved] = await Promise.all([
      this.prisma.practiceDomain.findMany({
        orderBy: { sortOrder: 'asc' },
        include: {
          problems: { select: { id: true, slug: true, difficulty: true } },
        },
      }),
      this.prisma.submission.findMany({
        where: { userId, verdict: 'AC' },
        distinct: ['problemId'],
        select: { problemId: true },
      }),
    ]);
    const solvedSet = new Set(solved.map((s) => s.problemId));

    return domains.map((d) => {
      const total = d.problems.length;
      const solvedCount = d.problems.filter((p) => solvedSet.has(p.id)).length;
      const nextUnsolved = d.problems
        .filter((p) => !solvedSet.has(p.id))
        .slice(0, 3)
        .map((p) => p.slug);
      return {
        slug: d.slug,
        name: d.name,
        icon: d.icon,
        total,
        solved: solvedCount,
        nextUnsolved,
      };
    });
  }

  // --- AI helpers usable from the problem page (no submission required) ---

  async problemHint(slug: string) {
    const problem = await this.prisma.problem.findUnique({ where: { slug } });
    if (!problem) throw new NotFoundException('Problem not found');
    return this.ai.hint(problem.title, problem.description);
  }

  async problemExplain(slug: string) {
    const problem = await this.prisma.problem.findUnique({ where: { slug } });
    if (!problem) throw new NotFoundException('Problem not found');
    return this.ai.explain(problem.title, problem.description, problem.constraints);
  }

  async reviewDraft(slug: string, language: string, code: string) {
    const problem = await this.prisma.problem.findUnique({ where: { slug } });
    if (!problem) throw new NotFoundException('Problem not found');
    return this.ai.reviewDraft(problem.title, problem.description, language, code);
  }
}
