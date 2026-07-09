// ── Reverse Coding Routes ────────────────────────

import { Router, type Request, type Response } from 'express';
import { z } from 'zod';

import { prisma } from '../config/db';
import { LANGUAGES, type Language } from '../config/languages';
import { executeLimiter } from '../middleware/rateLimiter';
import { requireAuth } from '../middleware/requireAuth';
import { requireLiveContest } from '../middleware/requireLiveContest';
import { executeCode, computeVerdict } from '../services/piston';

const router = Router();

// ── Schemas ──────────────────────────────────────

const tryInputSchema = z.object({
  problemId: z.string().min(1),
  input: z.string().max(10000),
});

const RUN_TIMEOUT_MS = 3000;
const COMPILE_TIMEOUT_MS = 10000;

// ── POST /api/reverse-code/try-input ─────────────

router.post('/try-input', requireAuth, requireLiveContest, executeLimiter, async (req: Request, res: Response) => {
  try {
    const body = tryInputSchema.parse(req.body);

    const problem = await prisma.problem.findUnique({
      where: { id: body.problemId },
    });

    if (!problem) {
      res.status(404).json({ error: 'Problem not found' });
      return;
    }

    if (!problem.referenceSolution || !problem.referenceLang) {
      res.status(400).json({ error: 'This problem is not a reverse-coding problem or is missing a reference solution' });
      return;
    }

    const userId = req.user!.userId;

    // Check query cap (e.g., max 25 queries per user per problem)
    const MAX_QUERIES = 25;
    const queryCount = await prisma.reverseQueryLog.count({
      where: { userId, problemId: body.problemId },
    });

    if (queryCount >= MAX_QUERIES) {
      res.status(403).json({ error: 'Forbidden', message: `Query limit reached (${MAX_QUERIES} queries max per problem)` });
      return;
    }

    // Execute reference solution with the provided input
    const langConfig = LANGUAGES[problem.referenceLang as Language];
    if (!langConfig) {
      res.status(500).json({ error: 'Invalid reference language configuration' });
      return;
    }

    const result = await executeCode({
      language: langConfig.pistonLanguage,
      version: langConfig.pistonVersion,
      files: [{ name: `main${langConfig.fileExtension}`, content: problem.referenceSolution }],
      stdin: body.input,
      run_timeout: RUN_TIMEOUT_MS,
      compile_timeout: COMPILE_TIMEOUT_MS,
    });

    const verdict = computeVerdict(result);

    // Save query log
    await prisma.reverseQueryLog.create({
      data: {
        userId,
        problemId: body.problemId,
        input: body.input,
        output: result.run.stdout, // Only log standard output, errors aren't strictly part of the answer logic usually
      },
    });

    if (verdict !== 'SUCCESS') {
      res.json({
        output: 'Error executing reference solution. Check constraints and try again.',
        queriesRemaining: MAX_QUERIES - (queryCount + 1),
      });
      return;
    }

    res.json({
      output: result.run.stdout,
      queriesRemaining: MAX_QUERIES - (queryCount + 1),
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ error: 'Validation error', details: err.errors });
      return;
    }
    console.error('[ReverseCode] Try Input error:', err);
    res.status(500).json({ error: 'Execution failed', message: 'Internal server error' });
  }
});

export default router;
