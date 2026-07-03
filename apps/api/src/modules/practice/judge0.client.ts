import { Injectable, Logger } from '@nestjs/common';
import { JUDGE0_LANG_ID, type SUPPORTED_LANGUAGES } from '@skillverify/shared';

type Lang = (typeof SUPPORTED_LANGUAGES)[number];

export type Judge0Result = {
  stdout: string | null;
  stderr: string | null;
  compile_output: string | null;
  status: { id: number; description: string };
  time: string | null;
  memory: number | null;
};

@Injectable()
export class Judge0Client {
  private readonly log = new Logger(Judge0Client.name);
  private readonly base = process.env.JUDGE0_URL ?? 'http://localhost:2358';
  private readonly key = process.env.JUDGE0_KEY ?? '';

  async run(language: Lang, code: string, stdin: string): Promise<Judge0Result> {
    let res: Response;
    try {
      res = await fetch(`${this.base}/submissions?base64_encoded=false&wait=true`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(this.key ? { 'X-Auth-Token': this.key } : {}),
        },
        body: JSON.stringify({
          language_id: JUDGE0_LANG_ID[language],
          source_code: code,
          stdin,
          cpu_time_limit: 2,
          memory_limit: 256_000,
        }),
        // `wait=true` blocks until the run finishes; bound it so a hung or slow
        // Judge0 can't stall a submission indefinitely. 15s comfortably covers a
        // 2s CPU-limited run plus queue + network.
        signal: AbortSignal.timeout(15_000),
      });
    } catch (e) {
      const timedOut = (e as Error)?.name === 'TimeoutError';
      this.log.error(
        `Judge0 ${timedOut ? 'timed out' : 'request failed'}: ${(e as Error).message}`,
      );
      throw new Error(
        timedOut ? 'Code runner timed out. Please try again.' : 'Code runner unavailable.',
        { cause: e },
      );
    }
    if (!res.ok) {
      const text = await res.text();
      this.log.error(`Judge0 error ${res.status}: ${text}`);
      throw new Error(`Judge0 ${res.status}`);
    }
    return (await res.json()) as Judge0Result;
  }

  // Status mapping per Judge0 docs:
  //   1=In Queue, 2=Processing, 3=Accepted, 4=WA, 5=TLE,
  //   6=Compilation Error, 7-12=Various Runtime Errors, 13+ Internal Error
  verdictFromStatus(statusId: number): 'AC' | 'WA' | 'TLE' | 'CE' | 'RE' {
    if (statusId === 3) return 'AC';
    if (statusId === 4) return 'WA';
    if (statusId === 5) return 'TLE';
    if (statusId === 6) return 'CE';
    return 'RE';
  }
}
