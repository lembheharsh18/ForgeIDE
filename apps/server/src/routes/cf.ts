// ── Codeforces Problem + Submit Routes ───────────

import crypto from 'crypto';

import { Router } from 'express';
import type { Request, Response } from 'express';
import { z } from 'zod';

import { CF_LANGUAGE_MAP } from '../config/languages';
import { requireAuth } from '../middleware/requireAuth';
import { CFError, scrapeCFProblem } from '../services/cfScraper';

const router = Router();

// ── GET /api/cf/problem?contestId=&index= ────────

router.get('/problem', async (req: Request, res: Response) => {
  try {
    const { contestId, index } = req.query;

    if (!contestId || !index) {
      res.status(400).json({
        error: 'Missing parameters',
        message: 'Both contestId and index are required',
      });
      return;
    }

    const data = await scrapeCFProblem(contestId as string, (index as string).toUpperCase());

    res.json(data);
  } catch (err) {
    if (err instanceof CFError) {
      const statusMap: Record<string, number> = {
        CF_NOT_FOUND: 404,
        CF_RATE_LIMITED: 429,
        CF_FETCH_FAILED: 500,
      };

      res.status(statusMap[err.code] || 500).json({
        error: err.code,
        message: err.message,
      });
      return;
    }

    console.error('[CF] Error:', err);
    res.status(500).json({
      error: 'Failed to fetch problem',
      message: (err as Error).message,
    });
  }
});

// ── POST /api/cf/submit ──────────────────────────

const cfSubmitSchema = z.object({
  contestId: z.string().min(1),
  problemIndex: z.string().min(1),
  language: z.string().min(1),
  code: z.string().min(1),
  cfHandle: z.string().min(1),
  cfApiKey: z.string().min(1),
  cfApiSecret: z.string().min(1),
});

router.post('/submit', requireAuth, async (req: Request, res: Response) => {
  try {
    const body = cfSubmitSchema.parse(req.body);

    const cfLangId = CF_LANGUAGE_MAP[body.language];
    if (!cfLangId) {
      res.status(400).json({
        error: 'Unsupported language',
        message: `Language "${body.language}" is not supported for CF submission`,
      });
      return;
    }

    // ── Generate CF API Signature ──────────────────
    const time = Math.floor(Date.now() / 1000);
    const rand = Math.random().toString(36).substring(2, 8);

    // CF API requires params sorted alphabetically
    const params: Record<string, string> = {
      apiKey: body.cfApiKey,
      contestId: body.contestId,
      programTypeId: cfLangId,
      sourceCode: body.code,
      problemIndex: body.problemIndex.toUpperCase(),
      time: time.toString(),
    };

    // Build sorted query string for signature
    const sortedKeys = Object.keys(params).sort();
    const paramString = sortedKeys.map((k) => `${k}=${params[k]}`).join('&');

    const sigPayload = `${rand}/contest.submit?${paramString}#${body.cfApiSecret}`;
    const hash = crypto.createHash('sha512').update(sigPayload).digest('hex');
    const apiSig = `${rand}${hash}`;

    // ── Submit to CF API ──────────────────────────
    const formData = new URLSearchParams();
    formData.append('apiKey', body.cfApiKey);
    formData.append('time', time.toString());
    formData.append('apiSig', apiSig);
    formData.append('contestId', body.contestId);
    formData.append('problemIndex', body.problemIndex.toUpperCase());
    formData.append('programTypeId', cfLangId);
    formData.append('sourceCode', body.code);

    const cfResponse = await fetch('https://codeforces.com/api/contest.submit', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': 'ForgeIDE/1.0',
      },
      body: formData.toString(),
    });

    const cfData = (await cfResponse.json()) as {
      status: string;
      comment?: string;
      result?: number;
    };

    if (cfData.status !== 'OK') {
      res.status(400).json({
        error: 'CF_SUBMIT_FAILED',
        message: cfData.comment || 'Codeforces rejected the submission',
      });
      return;
    }

    res.json({
      submissionId: cfData.result,
      contestId: body.contestId,
      problemIndex: body.problemIndex.toUpperCase(),
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      res.status(400).json({
        error: 'Validation error',
        details: err.errors,
      });
      return;
    }

    console.error('[CF Submit] Error:', err);
    res.status(500).json({
      error: 'CF_SUBMIT_FAILED',
      message: (err as Error).message,
    });
  }
});

// ── GET /api/cf/verdict/:submissionId ────────────

const CF_VERDICT_MAP: Record<string, string> = {
  OK: 'AC',
  WRONG_ANSWER: 'WA',
  TIME_LIMIT_EXCEEDED: 'TLE',
  MEMORY_LIMIT_EXCEEDED: 'MLE',
  RUNTIME_ERROR: 'RE',
  COMPILATION_ERROR: 'CE',
  TESTING: 'PENDING',
  REJECTED: 'RE',
  CHALLENGED: 'WA',
  SKIPPED: 'RE',
  PARTIAL: 'WA',
};

router.get('/verdict/:submissionId', requireAuth, async (req: Request, res: Response) => {
  try {
    const { submissionId } = req.params;
    const { cfHandle, cfApiKey, cfApiSecret } = req.query;

    if (!cfHandle || !cfApiKey || !cfApiSecret) {
      res.status(400).json({
        error: 'Missing CF credentials',
        message: 'cfHandle, cfApiKey, and cfApiSecret are required',
      });
      return;
    }

    // ── Generate CF API Signature for user.status ──
    const time = Math.floor(Date.now() / 1000);
    const rand = Math.random().toString(36).substring(2, 8);

    const params: Record<string, string> = {
      apiKey: cfApiKey as string,
      count: '20',
      from: '1',
      handle: cfHandle as string,
      time: time.toString(),
    };

    const sortedKeys = Object.keys(params).sort();
    const paramString = sortedKeys.map((k) => `${k}=${params[k]}`).join('&');
    const sigPayload = `${rand}/user.status?${paramString}#${cfApiSecret}`;
    const hash = crypto.createHash('sha512').update(sigPayload).digest('hex');
    const apiSig = `${rand}${hash}`;

    // ── Call CF API ────────────────────────────────
    const queryStr = `${paramString}&apiSig=${apiSig}`;
    const cfResponse = await fetch(`https://codeforces.com/api/user.status?${queryStr}`, {
      headers: { 'User-Agent': 'ForgeIDE/1.0' },
    });

    const cfData = (await cfResponse.json()) as {
      status: string;
      comment?: string;
      result: Array<{
        id: number;
        verdict?: string;
        passedTestCount?: number;
        timeConsumedMillis?: number;
        memoryConsumedBytes?: number;
      }>;
    };

    if (cfData.status !== 'OK') {
      res.status(400).json({
        error: 'CF_API_ERROR',
        message: cfData.comment || 'Failed to fetch verdict from CF',
      });
      return;
    }

    // ── Find matching submission ───────────────────
    const targetId = parseInt(submissionId, 10);
    const submission = cfData.result.find((s: { id: number }) => s.id === targetId);

    if (!submission) {
      // Submission might not be visible yet — tell frontend to retry
      res.json({
        verdict: 'PENDING',
        cfVerdict: 'NOT_FOUND',
        passedTestCount: 0,
        timeMs: 0,
      });
      return;
    }

    const cfVerdict = submission.verdict || 'TESTING';
    const forgeVerdict = CF_VERDICT_MAP[cfVerdict] || 'PENDING';

    res.json({
      verdict: forgeVerdict,
      cfVerdict,
      passedTestCount: submission.passedTestCount || 0,
      timeMs: submission.timeConsumedMillis || 0,
      memoryBytes: submission.memoryConsumedBytes || 0,
    });
  } catch (err) {
    console.error('[CF Verdict] Error:', err);
    res.status(500).json({
      error: 'CF_VERDICT_FAILED',
      message: (err as Error).message,
    });
  }
});

export default router;
