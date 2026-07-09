// ── Users Routes ─────────────────────────────────

import { Router, type Request, type Response } from 'express';

import { prisma } from '../config/db';

const router = Router();

// ── GET /api/users/:username ─────────────────────

router.get('/:username', async (req: Request, res: Response) => {
  try {
    const user = await prisma.user.findUnique({
      where: { username: req.params.username },
      select: {
        id: true,
        username: true,
        avatarUrl: true,
        codeforcesHandle: true,
        codechefHandle: true,
        leetcodeUsername: true,
        createdAt: true,
        leaderboard: {
          select: {
            score: true,
            solvedCount: true,
            rank: true,
          },
        },
        solvedProblems: {
          select: {
            id: true,
            title: true,
            platform: true,
            difficulty: true,
          },
        },
        submissions: {
          take: 10,
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            problem: { select: { title: true } },
            verdict: true,
            language: true,
            timeMs: true,
            memoryKb: true,
            createdAt: true,
          },
        },
      },
    });

    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    res.json(user);
  } catch (err) {
    console.error('[Users] Get profile error:', err);
    res.status(500).json({ error: 'Failed to fetch user profile' });
  }
});

// ── GET /api/users/:username/activity ────────────

router.get('/:username/activity', async (req: Request, res: Response) => {
  try {
    const user = await prisma.user.findUnique({
      where: { username: req.params.username },
      select: { id: true },
    });

    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    // Get submission counts grouped by date (YYYY-MM-DD)
    // We use a raw query here for efficient grouping by date
    // Note: This query is Postgres-specific.
    const activityRaw = await prisma.$queryRaw<Array<{ date: string; count: bigint }>>`
      SELECT 
        TO_CHAR("createdAt", 'YYYY-MM-DD') as date,
        COUNT(*) as count
      FROM "Submission"
      WHERE "userId" = ${user.id}
      GROUP BY TO_CHAR("createdAt", 'YYYY-MM-DD')
      ORDER BY date ASC;
    `;

    const activity = activityRaw.map((row: { date: string; count: bigint }) => ({
      date: row.date,
      count: Number(row.count),
    }));

    res.json(activity);
  } catch (err) {
    console.error('[Users] Get activity error:', err);
    res.status(500).json({ error: 'Failed to fetch user activity' });
  }
});

// ── GET /api/users/:username/platform-profiles ───

import { fetchAllStats } from '../services/cpStats';

router.get('/:username/platform-profiles', async (req: Request, res: Response) => {
  try {
    const user = await prisma.user.findUnique({
      where: { username: req.params.username },
      select: {
        id: true,
        codeforcesHandle: true,
        codechefHandle: true,
        leetcodeUsername: true,
        platformProfile: true,
      },
    });

    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    const CACHE_HOURS = 4;
    const now = new Date();

    // If cache exists and is fresh, return it
    if (
      user.platformProfile &&
      (now.getTime() - user.platformProfile.updatedAt.getTime()) / (1000 * 60 * 60) < CACHE_HOURS
    ) {
      res.json(user.platformProfile);
      return;
    }

    // Otherwise, fetch new stats
    const stats = await fetchAllStats(user.codeforcesHandle, user.leetcodeUsername, user.codechefHandle);

    // Upsert into cache
    const updatedProfile = await prisma.platformProfileCache.upsert({
      where: { userId: user.id },
      update: {
        cfRating: stats.cfRating,
        cfRank: stats.cfRank,
        lcRating: stats.lcRating,
        ccRating: stats.ccRating,
        ccStars: stats.ccStars,
      },
      create: {
        userId: user.id,
        cfRating: stats.cfRating,
        cfRank: stats.cfRank,
        lcRating: stats.lcRating,
        ccRating: stats.ccRating,
        ccStars: stats.ccStars,
      },
    });

    res.json(updatedProfile);
  } catch (err) {
    console.error('[Users] Get platform profiles error:', err);
    res.status(500).json({ error: 'Failed to fetch platform profiles' });
  }
});

export default router;
