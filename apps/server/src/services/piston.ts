// ── Piston Code Execution Service ────────────────

import { spawn } from 'child_process';
import { randomUUID } from 'crypto';
import { mkdtemp, rm, writeFile } from 'fs/promises';
import { tmpdir } from 'os';
import path from 'path';

const PISTON_URL = process.env.PISTON_URL || 'https://emkc.org/api/v2/piston';
const EXECUTION_BACKEND = process.env.CODE_EXECUTION_BACKEND || 'piston';
const LOCAL_EXECUTION_FALLBACK = process.env.LOCAL_EXECUTION_FALLBACK === 'true';

// ── Types ────────────────────────────────────────

export interface PistonRequest {
  language: string;
  version: string;
  files: Array<{ name: string; content: string }>;
  stdin?: string;
  run_timeout?: number;
  compile_timeout?: number;
}

export interface PistonRunResult {
  stdout: string;
  stderr: string;
  code: number;
  signal: string | null;
  output: string;
}

export interface PistonResponse {
  run: PistonRunResult;
  compile?: PistonRunResult;
  language: string;
  version: string;
}

export type Verdict =
  | 'ACCEPTED'
  | 'WRONG_ANSWER'
  | 'TIME_LIMIT_EXCEEDED'
  | 'RUNTIME_ERROR'
  | 'COMPILATION_ERROR'
  | 'SUCCESS'
  | 'PENDING';

// ── Execute Code via Piston ──────────────────────

export async function executeCode(params: PistonRequest): Promise<PistonResponse> {
  if (EXECUTION_BACKEND === 'local') {
    return executeCodeLocal(params);
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);

  try {
    const response = await fetch(`${PISTON_URL}/execute`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        language: params.language,
        version: params.version,
        files: params.files,
        stdin: params.stdin || '',
        run_timeout: params.run_timeout ?? 5000,
        compile_timeout: params.compile_timeout ?? 10000,
      }),
      signal: controller.signal,
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Piston API error (${response.status}): ${text}`);
    }

    return (await response.json()) as PistonResponse;
  } catch (err: unknown) {
    if (err instanceof Error && err.name === 'AbortError') {
      throw new Error('Code execution timed out (15s limit)');
    }
    if (LOCAL_EXECUTION_FALLBACK) {
      return executeCodeLocal(params);
    }
    throw err;
  } finally {
    clearTimeout(timeout);
  }
}

// ── Compute Verdict ──────────────────────────────

interface LocalCommand {
  command: string;
  args: string[];
}

interface LocalPlan {
  sourceName: string;
  compile?: LocalCommand;
  run: LocalCommand;
}

function getLocalPlan(language: string, dir: string): LocalPlan {
  const executable = process.platform === 'win32' ? 'main.exe' : 'main';

  switch (language) {
    case 'javascript':
      return {
        sourceName: 'main.js',
        run: { command: process.execPath, args: [path.join(dir, 'main.js')] },
      };
    case 'python':
      return {
        sourceName: 'main.py',
        run: { command: 'python', args: [path.join(dir, 'main.py')] },
      };
    case 'c++':
      return {
        sourceName: 'main.cpp',
        compile: {
          command: 'g++',
          args: [
            path.join(dir, 'main.cpp'),
            '-std=c++17',
            '-O2',
            '-pipe',
            '-o',
            path.join(dir, executable),
          ],
        },
        run: { command: path.join(dir, executable), args: [] },
      };
    case 'java':
      return {
        sourceName: 'Main.java',
        compile: { command: 'javac', args: [path.join(dir, 'Main.java')] },
        run: { command: 'java', args: ['-cp', dir, 'Main'] },
      };
    case 'go':
      return {
        sourceName: 'main.go',
        run: { command: 'go', args: ['run', path.join(dir, 'main.go')] },
      };
    default:
      throw new Error(`Local execution is not configured for language: ${language}`);
  }
}

async function executeCodeLocal(params: PistonRequest): Promise<PistonResponse> {
  const dir = await mkdtemp(path.join(tmpdir(), `forge-${randomUUID()}-`));
  const plan = getLocalPlan(params.language, dir);
  const source = params.files[0]?.content ?? '';
  const sourcePath = path.join(dir, plan.sourceName);

  try {
    await writeFile(sourcePath, source, 'utf8');

    const compile = plan.compile
      ? await runLocalProcess(plan.compile, '', params.compile_timeout ?? 10000, dir)
      : undefined;

    if (compile && (compile.code !== 0 || compile.signal)) {
      return {
        compile,
        run: emptyRunResult(),
        language: params.language,
        version: params.version,
      };
    }

    const run = await runLocalProcess(
      plan.run,
      params.stdin || '',
      params.run_timeout ?? 3000,
      dir,
    );

    return {
      ...(compile ? { compile } : {}),
      run,
      language: params.language,
      version: params.version,
    };
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
}

function emptyRunResult(): PistonRunResult {
  return {
    stdout: '',
    stderr: '',
    code: 0,
    signal: null,
    output: '',
  };
}

function runLocalProcess(
  command: LocalCommand,
  stdin: string,
  timeoutMs: number,
  cwd: string,
): Promise<PistonRunResult> {
  return new Promise((resolve) => {
    let stdout = '';
    let stderr = '';
    let timedOut = false;

    const child = spawn(command.command, command.args, {
      cwd,
      windowsHide: true,
    });

    const timer = setTimeout(() => {
      timedOut = true;
      child.kill();
    }, timeoutMs);

    child.stdout.on('data', (chunk: Buffer) => {
      stdout += chunk.toString();
    });

    child.stderr.on('data', (chunk: Buffer) => {
      stderr += chunk.toString();
    });

    child.on('error', (error) => {
      clearTimeout(timer);
      resolve({
        stdout,
        stderr: stderr || error.message,
        code: 1,
        signal: null,
        output: `${stdout}${stderr || error.message}`,
      });
    });

    child.on('close', (code, signal) => {
      clearTimeout(timer);
      const finalSignal = timedOut ? 'SIGKILL' : signal;
      resolve({
        stdout,
        stderr,
        code: code ?? (timedOut ? -1 : 1),
        signal: finalSignal,
        output: `${stdout}${stderr}`,
      });
    });

    child.stdin.end(stdin);
  });
}

export function computeVerdict(response: PistonResponse): Verdict {
  // Check compile errors first
  if (response.compile && response.compile.code !== 0) {
    return 'COMPILATION_ERROR';
  }

  // Check for TLE (SIGKILL = killed by timeout)
  if (response.run.signal === 'SIGKILL') {
    return 'TIME_LIMIT_EXCEEDED';
  }

  // Check for runtime error
  if (response.run.code !== 0) {
    return 'RUNTIME_ERROR';
  }

  return 'SUCCESS';
}

// ── Compare Outputs ──────────────────────────────
// Trims trailing whitespace per line, trims leading/trailing
// blank lines, then compares line by line.

export function compareOutputs(actual: string, expected: string): boolean {
  const normalize = (s: string): string[] => {
    // Split into lines, trim trailing whitespace per line
    const lines = s.split('\n').map((l) => l.trimEnd());

    // Remove leading blank lines
    while (lines.length > 0 && lines[0] === '') {
      lines.shift();
    }

    // Remove trailing blank lines
    while (lines.length > 0 && lines[lines.length - 1] === '') {
      lines.pop();
    }

    return lines;
  };

  const actualLines = normalize(actual);
  const expectedLines = normalize(expected);

  if (actualLines.length !== expectedLines.length) {
    return false;
  }

  return actualLines.every((line, i) => line === expectedLines[i]);
}
