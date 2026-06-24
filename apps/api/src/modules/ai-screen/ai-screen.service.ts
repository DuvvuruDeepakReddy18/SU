import {
  BadRequestException,
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { PrismaService } from '../../infra/prisma/prisma.service';
import { OpenRouterClient } from '../../infra/openrouter/openrouter.client';

// Free models that handle structured chat well (same chain as resume/chat).
const MODELS = [
  process.env.OPENROUTER_CHAT_MODEL_PRIMARY ?? 'openai/gpt-oss-120b:free',
  process.env.OPENROUTER_CHAT_MODEL_FALLBACK ?? 'openai/gpt-oss-20b:free',
  'meta-llama/llama-3.3-70b-instruct:free',
];

const MAX_QUESTIONS = 5;
const PASS_THRESHOLD = 80; // initial bar (Ch.7); per-skill dynamic later.

type Turn = { q: string; a: string | null };
type Area = { area: string; score: number; note: string };

@Injectable()
export class AiScreenService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly openrouter: OpenRouterClient,
  ) {}

  /** Begin a mock interview: resolve the skill/topic, ask the first question. */
  async start(userId: string, input: { skillId?: string; topic?: string }) {
    if (!process.env.OPENROUTER_API_KEY) {
      throw new ServiceUnavailableException('AI is not configured on this server.');
    }
    let skillName = input.topic?.trim() || null;
    if (input.skillId) {
      const skill = await this.prisma.skillCatalog.findUnique({
        where: { id: input.skillId },
        select: { name: true },
      });
      skillName = skill?.name ?? skillName;
    }
    if (!skillName) throw new BadRequestException('Pick a skill or enter a topic.');

    const question = await this.nextQuestion(skillName, []);
    const attempt = await this.prisma.aiScreenAttempt.create({
      data: {
        userId,
        skillId: input.skillId ?? null,
        skillName,
        status: 'in_progress',
        transcript: [{ q: question, a: null }] as unknown as Prisma.InputJsonValue,
        questionCount: 1,
      },
    });
    return {
      attemptId: attempt.id,
      skillName,
      question,
      questionNumber: 1,
      totalQuestions: MAX_QUESTIONS,
    };
  }

  /** Record the answer, then return the next adaptive question or the result. */
  async answer(userId: string, attemptId: string, answer: string) {
    const attempt = await this.prisma.aiScreenAttempt.findUnique({ where: { id: attemptId } });
    if (!attempt || attempt.userId !== userId) throw new NotFoundException('Interview not found.');
    if (attempt.status !== 'in_progress') {
      throw new BadRequestException('This interview is already complete.');
    }
    const transcript = (attempt.transcript as unknown as Turn[]) ?? [];
    if (transcript.length > 0) transcript[transcript.length - 1].a = answer;

    const skillName = attempt.skillName ?? 'the skill';

    // Last question answered → grade and finish.
    if (attempt.questionCount >= MAX_QUESTIONS) {
      const result = await this.score(skillName, transcript);
      await this.prisma.aiScreenAttempt.update({
        where: { id: attemptId },
        data: {
          transcript: transcript as unknown as Prisma.InputJsonValue,
          status: 'completed',
          score: result.score,
          passed: result.score >= PASS_THRESHOLD,
          areaBreakdown: result.areas as unknown as Prisma.InputJsonValue,
          feedback: result.feedback,
          completedAt: new Date(),
        },
      });
      return {
        completed: true,
        result: {
          score: result.score,
          passed: result.score >= PASS_THRESHOLD,
          areas: result.areas,
          feedback: result.feedback,
        },
      };
    }

    // Otherwise ask the next, adaptive question.
    const question = await this.nextQuestion(skillName, transcript);
    transcript.push({ q: question, a: null });
    await this.prisma.aiScreenAttempt.update({
      where: { id: attemptId },
      data: {
        transcript: transcript as unknown as Prisma.InputJsonValue,
        questionCount: { increment: 1 },
      },
    });
    return {
      completed: false,
      question,
      questionNumber: attempt.questionCount + 1,
      totalQuestions: MAX_QUESTIONS,
    };
  }

  /** A single attempt (owner only). */
  async get(userId: string, attemptId: string) {
    const a = await this.prisma.aiScreenAttempt.findUnique({ where: { id: attemptId } });
    if (!a || a.userId !== userId) throw new NotFoundException('Interview not found.');
    return a;
  }

  /** The student's past attempts (most recent first). */
  async listMine(userId: string) {
    return this.prisma.aiScreenAttempt.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 30,
      select: {
        id: true,
        skillName: true,
        status: true,
        score: true,
        passed: true,
        createdAt: true,
      },
    });
  }

  // ---- LLM helpers ----

  private async nextQuestion(skill: string, transcript: Turn[]): Promise<string> {
    const history = transcript
      .map((t, i) => `Q${i + 1}: ${t.q}\nA${i + 1}: ${t.a ?? ''}`)
      .join('\n\n');
    const system = `You are a strict but fair interviewer assessing a candidate's real depth in "${skill}". Ask ONE focused interview question. If prior Q&A exists, make it an ADAPTIVE follow-up that probes deeper or moves to a new sub-area based on how well the candidate answered. Keep it to 1-2 sentences, no preamble. Return JSON: {"question": "..."}.`;
    const user = history
      ? `Conversation so far:\n${history}\n\nAsk the next question.`
      : 'Ask the first question.';
    try {
      const out = (await this.openrouter.chatJson(MODELS, system, user, 300)) as {
        question?: string;
      };
      return (out.question ?? '').trim() || 'Tell me about your hands-on experience with this.';
    } catch {
      return 'Walk me through a real problem you solved with this skill and how you approached it.';
    }
  }

  private async score(
    skill: string,
    transcript: Turn[],
  ): Promise<{ score: number; areas: Area[]; feedback: string }> {
    const body = transcript
      .map((t, i) => `Q${i + 1}: ${t.q}\nA${i + 1}: ${t.a ?? '(no answer)'}`)
      .join('\n\n');
    const system = `You are scoring a mock interview for "${skill}". Be strict but fair — reward depth and correctness, penalise vagueness. Rate the candidate 0-100 overall. Return JSON: {"score": number, "areas": [{"area": string, "score": number, "note": string}], "feedback": string}. Give 3-4 areas and 2-3 sentences of constructive feedback.`;
    try {
      const out = (await this.openrouter.chatJson(MODELS, system, body, 1200)) as {
        score?: number;
        areas?: Area[];
        feedback?: string;
      };
      const score = Math.max(0, Math.min(100, Math.round(Number(out.score ?? 0))));
      const areas = Array.isArray(out.areas)
        ? out.areas.slice(0, 6).map((a) => ({
            area: String(a.area ?? '').slice(0, 60),
            score: Math.max(0, Math.min(100, Math.round(Number(a.score ?? 0)))),
            note: String(a.note ?? '').slice(0, 300),
          }))
        : [];
      return { score, areas, feedback: String(out.feedback ?? '').slice(0, 1200) };
    } catch {
      return {
        score: 0,
        areas: [],
        feedback: 'We could not score this attempt automatically. Please try again.',
      };
    }
  }
}
