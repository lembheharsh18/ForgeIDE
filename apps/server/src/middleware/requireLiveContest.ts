import type { Request, Response, NextFunction } from 'express';

import { prisma } from '../config/db';

// ── requireLiveContest Middleware ────────────────
// Ensures that code execution is only allowed during a live contest.

export async function requireLiveContest(_req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const now = new Date();
    const liveContest = await prisma.contest.findFirst({
      where: {
        startTime: { lte: now },
        endTime: { gt: now },
      },
    });

    if (!liveContest) {
      res.status(403).json({
        error: 'Forbidden',
        message: 'No live contest running',
      });
      return;
    }

    next();
  } catch (err) {
    console.error('[LiveContestMiddleware] Error:', err);
    res.status(500).json({ error: 'Failed to check contest status' });
  }
}
