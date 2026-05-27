// ── Codeforces Problem Routes ────────────────────

import { Router, type Request, type Response } from 'express';

import { scrapeCFProblem, CFError } from '../services/cfScraper';

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

export default router;
