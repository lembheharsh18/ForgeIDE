// ── Piston Code Execution Service ────────────────

const PISTON_URL = process.env.PISTON_URL || 'https://emkc.org/api/v2/piston';

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
    throw err;
  } finally {
    clearTimeout(timeout);
  }
}

// ── Compute Verdict ──────────────────────────────

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
