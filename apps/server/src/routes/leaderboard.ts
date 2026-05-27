// ── Leaderboard Route ────────────────────────────

import { Router, type Request, type Response } from 'express';

import { prisma } from '../config/db';
import { redis } from '../config/redis';

const router = Router();

// ── GET /api/leaderboard ─────────────────────────

router.get('/', async (_req: Request, res: Response) => {
  try {
    const cacheKey = 'leaderboard:full';

    // Check Redis cache first
    try {
      const cached = await redis.get(cacheKey);
      if (cached) {
        res.json(JSON.parse(cached));
        return;
      }
    } catch {
      // Redis unavailable
    }

    // Fetch from DB
    const entries = await prisma.leaderboardEntry.findMany({
      orderBy: { score: 'desc' },
      include: {
        user: {
          select: {
            username: true,
            avatarUrl: true,
            codeforcesHandle: true,
          },
        },
      },
    });

    const leaderboard = entries.map((entry: (typeof entries)[number], index: number) => ({
      rank: index + 1,
      userId: entry.userId,
      username: entry.user.username,
      avatarUrl: entry.user.avatarUrl,
      codeforcesHandle: entry.user.codeforcesHandle,
      score: entry.score,
      solvedCount: entry.solvedCount,
      updatedAt: entry.updatedAt,
    }));

    // Update ranks in DB in background
    const updates = leaderboard.map((entry: (typeof leaderboard)[number]) =>
      prisma.leaderboardEntry
        .update({
          where: { userId: entry.userId },
          data: { rank: entry.rank },
        })
        .catch(console.error),
    );
    Promise.all(updates).catch(console.error);

    // Cache in Redis for 60 seconds
    try {
      await redis.setex(cacheKey, 60, JSON.stringify(leaderboard));
    } catch {
      // Redis unavailable
    }

    res.json(leaderboard);
  } catch (err) {
    console.error('[Leaderboard] Get error:', err);
    res.status(500).json({ error: 'Failed to fetch leaderboard' });
  }
});

export default router;
