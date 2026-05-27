// ── RC Interactor Socket Handlers ────────────────
// Turn-based interactive problem simulator.
// Each turn accumulates all stdin and reruns via Piston,
// diffing output to show only new lines.

import crypto from 'crypto';

import type { Socket } from 'socket.io';

import { LANGUAGES, type Language } from '../config/languages';
import { redis } from '../config/redis';
import { executeCode } from '../services/piston';

// ── Session Schema ───────────────────────────────

interface RCSession {
  sessionId: string;
  userId: string;
  code: string;
  language: string;
  stdinLines: string[];
  outputHistory: string;
  turnCount: number;
  status: 'idle' | 'running' | 'waiting' | 'ended';
  startedAt: number;
  exitCode: number | null;
}

const SESSION_TTL = 30 * 60; // 30 minutes

function sessionKey(sessionId: string): string {
  return `rc:session:${sessionId}`;
}

async function getSession(sessionId: string): Promise<RCSession | null> {
  try {
    const data = await redis.get(sessionKey(sessionId));
    return data ? (JSON.parse(data) as RCSession) : null;
  } catch {
    return null;
  }
}

async function saveSession(session: RCSession): Promise<void> {
  try {
    await redis.setex(sessionKey(session.sessionId), SESSION_TTL, JSON.stringify(session));
  } catch {
    // Redis unavailable — continue without persistence
  }
}

async function deleteSession(sessionId: string): Promise<void> {
  try {
    await redis.del(sessionKey(sessionId));
  } catch {
    // ignore
  }
}

// ── Register Handlers ────────────────────────────

export function registerRCHandlers(socket: Socket): void {
  const userId = socket.data.userId as string;
  const sessionId = crypto.randomUUID();

  // Create initial session in Redis
  const initialSession: RCSession = {
    sessionId,
    userId,
    code: '',
    language: 'cpp',
    stdinLines: [],
    outputHistory: '',
    turnCount: 0,
    status: 'idle',
    startedAt: Date.now(),
    exitCode: null,
  };

  saveSession(initialSession);

  // Emit connection event
  socket.emit('rc:connected', { sessionId });
  console.warn(`[RC] Session created: ${sessionId} for user ${userId}`);

  // ── rc:start ─────────────────────────────────

  socket.on('rc:start', async (data: { code: string; language: string }) => {
    try {
      const { code, language } = data;

      // Validate
      if (!code || !code.trim()) {
        socket.emit('rc:output', {
          data: 'Error: No code provided',
          type: 'error',
          turn: 0,
        });
        return;
      }

      if (!LANGUAGES[language as Language]) {
        socket.emit('rc:output', {
          data: `Error: Unsupported language "${language}"`,
          type: 'error',
          turn: 0,
        });
        return;
      }

      const lang = LANGUAGES[language as Language];

      // Update session
      const session = await getSession(sessionId);
      if (!session) return;

      session.code = code;
      session.language = language;
      session.stdinLines = [];
      session.outputHistory = '';
      session.turnCount = 0;
      session.status = 'running';
      session.startedAt = Date.now();
      session.exitCode = null;
      await saveSession(session);

      socket.emit('rc:status', { status: 'compiling' });

      // Run first turn (empty stdin)
      const result = await executeCode({
        language: lang.pistonLanguage,
        version: lang.pistonVersion,
        files: [{ name: `main${lang.fileExtension}`, content: code }],
        stdin: '',
        run_timeout: 5000,
        compile_timeout: 10000,
      });

      // Check compile error
      if (result.compile && result.compile.code !== 0) {
        socket.emit('rc:output', {
          data: result.compile.stderr || 'Compilation failed',
          type: 'error',
          turn: 0,
        });
        session.status = 'ended';
        session.exitCode = 1;
        await saveSession(session);
        socket.emit('rc:ended', { exitCode: 1, reason: 'compile_error' });
        return;
      }

      // Store output from initial run
      session.outputHistory = result.run.stdout;

      // Check if program produced output
      if (result.run.stdout) {
        socket.emit('rc:output', {
          data: result.run.stdout,
          type: 'stdout',
          turn: 0,
        });
      }

      // Check if program already exited (ran and done without needing input)
      // Piston always returns a code, so we check if the program produced
      // output AND exited cleanly — meaning it didn't need input
      if (result.run.stdout && result.run.code === 0 && !result.run.signal) {
        // Program ran to completion without needing input
        session.status = 'ended';
        session.exitCode = result.run.code;
        await saveSession(session);
        socket.emit('rc:ended', { exitCode: result.run.code, reason: 'completed' });
        return;
      }

      // If there's an error exit code (non-zero), the program likely
      // needs input (EOF causes non-zero exit in many languages)
      // OR it actually crashed. We treat it as "waiting for input"
      // since interactive programs typically fail on empty stdin.
      session.status = 'waiting';
      await saveSession(session);
      socket.emit('rc:status', { status: 'waiting' });
    } catch (err) {
      console.error('[RC] Start error:', err);
      socket.emit('rc:output', {
        data: `Execution error: ${(err as Error).message}`,
        type: 'error',
        turn: 0,
      });
      socket.emit('rc:ended', { exitCode: -1, reason: 'error' });
    }
  });

  // ── rc:input ─────────────────────────────────

  socket.on('rc:input', async (data: { line: string }) => {
    try {
      const session = await getSession(sessionId);
      if (!session || session.status === 'ended') {
        socket.emit('rc:output', {
          data: 'Session ended. Start a new session to continue.',
          type: 'system',
          turn: 0,
        });
        return;
      }

      const { line } = data;

      // Update session
      session.stdinLines.push(line);
      session.turnCount++;
      session.status = 'running';
      await saveSession(session);

      const turn = session.turnCount;

      socket.emit('rc:status', { status: 'running' });

      // Echo input back to terminal
      socket.emit('rc:output', {
        data: line,
        type: 'stdin',
        turn,
      });

      // Build full accumulated stdin
      const fullStdin = session.stdinLines.join('\n') + '\n';

      const lang = LANGUAGES[session.language as Language];
      if (!lang) return;

      // Run program with all accumulated stdin
      const result = await executeCode({
        language: lang.pistonLanguage,
        version: lang.pistonVersion,
        files: [{ name: `main${lang.fileExtension}`, content: session.code }],
        stdin: fullStdin,
        run_timeout: 5000,
        compile_timeout: 10000,
      });

      // Diff: find new output since last run
      const previousOutput = session.outputHistory;
      const currentOutput = result.run.stdout;

      // Simple diff: new output starts where previous ended
      let newOutput = '';
      if (currentOutput.length > previousOutput.length) {
        newOutput = currentOutput.slice(previousOutput.length);
      } else if (currentOutput !== previousOutput) {
        // Output changed entirely (unusual) — show full output
        newOutput = currentOutput;
      }

      // Update stored output history
      session.outputHistory = currentOutput;

      // Emit new output
      if (newOutput) {
        socket.emit('rc:output', {
          data: newOutput,
          type: 'stdout',
          turn,
        });
      }

      // Emit stderr if any
      if (result.run.stderr) {
        socket.emit('rc:output', {
          data: result.run.stderr,
          type: 'error',
          turn,
        });
      }

      // Check if program finished
      // In the turn-based model, if the program consumed all stdin
      // and produced output and exited with code 0, it's done.
      // If it exited with non-zero and stderr is empty, it likely
      // needs more input (EOF → non-zero exit).
      const programDone =
        result.run.code === 0 || (result.run.code !== 0 && result.run.stderr.trim().length > 0);

      if (programDone && result.run.code === 0) {
        session.status = 'ended';
        session.exitCode = result.run.code;
        await saveSession(session);
        socket.emit('rc:ended', { exitCode: result.run.code, reason: 'completed' });
      } else if (programDone && result.run.code !== 0 && result.run.stderr.trim()) {
        // Real error (has stderr)
        session.status = 'ended';
        session.exitCode = result.run.code;
        await saveSession(session);
        socket.emit('rc:ended', { exitCode: result.run.code, reason: 'runtime_error' });
      } else {
        // Program needs more input
        session.status = 'waiting';
        await saveSession(session);
        socket.emit('rc:status', { status: 'waiting' });
      }
    } catch (err) {
      console.error('[RC] Input error:', err);
      socket.emit('rc:output', {
        data: `Execution error: ${(err as Error).message}`,
        type: 'error',
        turn: 0,
      });
    }
  });

  // ── rc:kill ──────────────────────────────────

  socket.on('rc:kill', async () => {
    try {
      const session = await getSession(sessionId);
      if (session) {
        session.status = 'ended';
        session.exitCode = -1;
        await saveSession(session);
      }
      socket.emit('rc:ended', { exitCode: -1, reason: 'killed' });
    } catch (err) {
      console.error('[RC] Kill error:', err);
    }
  });

  // ── Disconnect ───────────────────────────────

  socket.on('disconnect', () => {
    console.warn(`[RC] Client disconnected: ${socket.id} (session: ${sessionId})`);
    deleteSession(sessionId);
  });
}
