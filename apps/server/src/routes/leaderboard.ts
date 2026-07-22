// ── Leaderboard Route ────────────────────────────

import { Router, type Request, type Response } from 'express';

import { prisma } from '../config/db';
import { redis } from '../config/redis';
import {
  getLeaderboardEntries,
  type LeaderboardPlatformFilter,
  type LeaderboardSortKey,
} from '../services/leaderboard';

const router = Router();

// ── GET /api/leaderboard ─────────────────────────

const VALID_SORTS = new Set(['rank', 'rating', 'solved']);
const VALID_PLATFORMS = new Set(['ALL', 'CODEFORCES', 'LEETCODE', 'CODECHEF', 'GFG']);

router.get('/', async (req: Request, res: Response) => {
  try {
    const sort = VALID_SORTS.has(String(req.query.sort))
      ? (String(req.query.sort) as LeaderboardSortKey)
      : 'rating';
    const platform = VALID_PLATFORMS.has(String(req.query.platform))
      ? (String(req.query.platform) as LeaderboardPlatformFilter)
      : 'ALL';
    const limit = req.query.limit
      ? Math.min(Math.max(parseInt(String(req.query.limit), 10) || 0, 1), 100)
      : undefined;
    const cacheKey = `leaderboard:full:${sort}:${platform}:${limit ?? 'all'}`;

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

    const leaderboard = await getLeaderboardEntries({ sort, platform, limit });
    const responsePayload = {
      source: 'LIVE_LEADERBOARD',
      message: platform === 'ALL' ? 'Aggregated Forge Score' : `${platform} Rankings`,
      sort,
      platform,
      entries: leaderboard,
    };

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
      await redis.setex(cacheKey, 60, JSON.stringify(responsePayload));
    } catch {
      // Redis unavailable
    }

    res.json(responsePayload);
  } catch (err) {
    console.error('[Leaderboard] Get error:', err);
    res.status(500).json({ error: 'Failed to fetch leaderboard' });
  }
});

export default router;
