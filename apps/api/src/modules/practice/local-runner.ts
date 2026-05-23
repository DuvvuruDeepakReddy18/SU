import { Injectable, Logger } from '@nestjs/common';
import { spawn } from 'node:child_process';
import { writeFile, mkdir, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { randomUUID } from 'node:crypto';

export type RunResult = {
  stdout: string;
  stderr: string;
  compileOutput: string | null;
  exitCode: number | null;
  signal: NodeJS.Signals | null;
  timeMs: number;
  timedOut: boolean;
  status: { id: number; description: string };
};

type Language = 'python' | 'javascript' | 'cpp' | 'java';

/**
 * Runs user code on the host machine via child_process.
 * Trade-off: NOT sandboxed — fine for local dev, NOT acceptable in production.
 * Use Judge0 (real isolate sandbox) in production.
 *
 * Supports python and javascript (interpreters typically installed). C++/Java
 * fall back to a "not available" message — install g++/javac to enable.
 */
@Injectable()
export class LocalRunner {
  private readonly log = new Logger(LocalRunner.name);
  private readonly defaultTimeoutMs = 5_000;

  async available(language: Language): Promise<boolean> {
    const cmd = this.binFor(language);
    if (!cmd) return false;
    try {
      await this.runCommand(cmd, ['--version'], '', 3_000);
      return true;
    } catch {
      return false;
    }
  }

  async run(
    language: Language,
    code: string,
    stdin: string,
    timeoutMs?: number,
  ): Promise<RunResult> {
    const limit = timeoutMs ?? this.defaultTimeoutMs;
    const work = join(tmpdir(), 'skillverify-runs', randomUUID());
    await mkdir(work, { recursive: true });

    try {
      if (language === 'python') {
        return await this.runInterpreted(work, 'main.py', code, stdin, limit, 'python');
      }
      if (language === 'javascript') {
        return await this.runInterpreted(work, 'main.js', code, stdin, limit, 'node');
      }
      return this.notAvailable(language);
    } finally {
      // best-effort cleanup
      rm(work, { recursive: true, force: true }).catch(() => {});
    }
  }

  private notAvailable(language: Language): RunResult {
    return {
      stdout: '',
      stderr: '',
      compileOutput: `${language} execution not enabled in local runner. Use Judge0 for C++ / Java.`,
      exitCode: null,
      signal: null,
      timeMs: 0,
      timedOut: false,
      status: { id: 6, description: 'Compilation Error' },
    };
  }

  private async runInterpreted(
    work: string,
    filename: string,
    code: string,
    stdin: string,
    timeoutMs: number,
    bin: string,
  ): Promise<RunResult> {
    const path = join(work, filename);
    await writeFile(path, code, 'utf8');
    return this.runCommand(bin, [path], stdin, timeoutMs);
  }

  private runCommand(
    bin: string,
    args: string[],
    stdin: string,
    timeoutMs: number,
  ): Promise<RunResult> {
    return new Promise((resolve) => {
      const started = Date.now();
      let stdout = '';
      let stderr = '';
      let timedOut = false;
      let resolved = false;

      const child = spawn(bin, args, {
        stdio: ['pipe', 'pipe', 'pipe'],
        shell: false,
        // Inherit minimal env. Could whitelist if needed.
        env: { PATH: process.env.PATH ?? '', PYTHONIOENCODING: 'utf-8' },
      });

      const killer = setTimeout(() => {
        timedOut = true;
        child.kill('SIGKILL');
      }, timeoutMs);

      child.stdout.on('data', (d) => {
        stdout += d.toString();
      });
      child.stderr.on('data', (d) => {
        stderr += d.toString();
      });

      child.on('error', (err) => {
        clearTimeout(killer);
        if (resolved) return;
        resolved = true;
        resolve({
          stdout,
          stderr: err.message,
          compileOutput: null,
          exitCode: null,
          signal: null,
          timeMs: Date.now() - started,
          timedOut: false,
          status: { id: 7, description: 'Runtime Error: ' + err.message.slice(0, 100) },
        });
      });

      child.on('close', (code, signal) => {
        clearTimeout(killer);
        if (resolved) return;
        resolved = true;
        const id = timedOut ? 5 : code === 0 ? 3 : 7;
        const desc = timedOut
          ? 'Time Limit Exceeded'
          : code === 0
            ? 'Accepted'
            : `Runtime Error (exit ${code})`;
        resolve({
          stdout,
          stderr,
          compileOutput: null,
          exitCode: code,
          signal,
          timeMs: Date.now() - started,
          timedOut,
          status: { id, description: desc },
        });
      });

      try {
        child.stdin.write(stdin);
        child.stdin.end();
      } catch {
        // If stdin write fails the child likely crashed; close handler will fire.
      }
    });
  }

  private binFor(language: Language): string | null {
    if (language === 'python') return process.platform === 'win32' ? 'python' : 'python3';
    if (language === 'javascript') return 'node';
    return null;
  }
}
