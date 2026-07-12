import { Router } from 'express';
import type { Request, Response } from 'express';

import { requireAuth } from '../middleware/requireAuth';

const router = Router();

// GET /api/reminders/contests
router.get('/contests', requireAuth, async (req: Request, res: Response) => {
  try {
    const cfResponse = await fetch('https://codeforces.com/api/contest.list');
    const cfData = (await cfResponse.json()) as {
      status: string;
      result: Array<{
        id: number;
        name: string;
        type: string;
        phase: string;
        frozen: boolean;
        durationSeconds: number;
        startTimeSeconds: number;
        relativeTimeSeconds: number;
      }>;
    };

    if (cfData.status !== 'OK') {
      res
        .status(400)
        .json({ error: 'CF_API_ERROR', message: 'Failed to fetch contests from Codeforces' });
      return;
    }

    const contests = cfData.result;

    // Sort by start time ascending for upcoming, descending for previous
    const upcoming = contests
      .filter((c) => c.phase === 'BEFORE')
      .sort((a, b) => a.startTimeSeconds - b.startTimeSeconds)
      .slice(0, 5);

    const previous = contests
      .filter((c) => c.phase === 'FINISHED')
      .sort((a, b) => b.startTimeSeconds - a.startTimeSeconds)
      .slice(0, 5);

    res.json({
      upcoming,
      previous,
    });
  } catch (err) {
    console.error('[Reminders] Error:', err);
    res.status(500).json({ error: 'Failed to fetch reminders', message: (err as Error).message });
  }
});

export default router;
