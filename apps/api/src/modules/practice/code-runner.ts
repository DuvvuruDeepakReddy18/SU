import { Injectable, Logger } from '@nestjs/common';
import { Judge0Client, type Judge0Result } from './judge0.client';
import { LocalRunner, type RunResult } from './local-runner';
import type { SUPPORTED_LANGUAGES } from '@skillverify/shared';

type Lang = (typeof SUPPORTED_LANGUAGES)[number];

/**
 * Picks the right execution backend per environment:
 *   - In production (Linux + working Judge0), Judge0 is used.
 *   - Locally (esp. Windows Docker where Judge0's isolate sandbox often fails
 *     with "/box/script.py" errors), we run via child_process for languages
 *     whose interpreter is on PATH (python, node). C++/Java still go to Judge0.
 *
 * The backend can be forced with CODE_RUNNER_BACKEND=judge0 | local | auto.
 */
@Injectable()
export class CodeRunner {
  private readonly log = new Logger(CodeRunner.name);

  constructor(
    private readonly judge0: Judge0Client,
    private readonly local: LocalRunner,
  ) {}

  async run(language: Lang, code: string, stdin: string): Promise<NormalizedResult> {
    const backend = (process.env.CODE_RUNNER_BACKEND ?? 'auto').toLowerCase();
    const canLocal = language === 'python' || language === 'javascript';

    if (backend === 'judge0') return this.viaJudge0(language, code, stdin);
    if (backend === 'local')
      return canLocal
        ? this.viaLocal(language, code, stdin)
        : this.viaJudge0(language, code, stdin);

    // auto: for python/js prefer local (faster, no sandbox quirks),
    // fall back to Judge0 if local fails. For cpp/java, Judge0 is the only option.
    if (canLocal) {
      try {
        return await this.viaLocal(language, code, stdin);
      } catch (e) {
        this.log.warn(
          `Local runner failed for ${language}, falling back to Judge0: ${(e as Error).message}`,
        );
        return this.viaJudge0(language, code, stdin);
      }
    }
    return this.viaJudge0(language, code, stdin);
  }

  private async viaLocal(language: Lang, code: string, stdin: string): Promise<NormalizedResult> {
    const r: RunResult = await this.local.run(language as 'python' | 'javascript', code, stdin);
    const verdict: Verdict = r.timedOut ? 'TLE' : r.exitCode === 0 ? 'AC' : 'RE';
    return {
      verdict,
      stdout: r.stdout,
      stderr: r.stderr,
      compileOutput: r.compileOutput,
      timeMs: r.timeMs,
      memoryKb: 0,
      statusDescription: r.status.description,
      backend: 'local',
    };
  }

  private async viaJudge0(language: Lang, code: string, stdin: string): Promise<NormalizedResult> {
    const r: Judge0Result = await this.judge0.run(language, code, stdin);
    const verdict = this.judge0.verdictFromStatus(r.status.id);
    return {
      verdict,
      stdout: r.stdout ?? '',
      stderr: r.stderr ?? '',
      compileOutput: r.compile_output ?? null,
      timeMs: Math.round(parseFloat(r.time ?? '0') * 1000),
      memoryKb: r.memory ?? 0,
      statusDescription: r.status.description,
      backend: 'judge0',
    };
  }
}

export type Verdict = 'AC' | 'WA' | 'TLE' | 'CE' | 'RE';

export type NormalizedResult = {
  verdict: Verdict;
  stdout: string;
  stderr: string;
  compileOutput: string | null;
  timeMs: number;
  memoryKb: number;
  statusDescription: string;
  backend: 'local' | 'judge0';
};
