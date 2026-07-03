import { Router, type Request, type Response } from 'express';

import { prisma } from '../config/db';
import { requireAuth } from '../middleware/requireAuth';
import { getLeaderboardEntries } from '../services/leaderboard';

const router = Router();

interface TopSolver {
  userId: string;
  username: string;
  avatarUrl: string | null;
  solveCount: number;
  lastSolvedAt: Date;
}

function startOfToday() {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  return now;
}

async function getTodayTopSolvers(): Promise<TopSolver[]> {
  const since = startOfToday();
  const submissions = await prisma.submission.findMany({
    where: {
      verdict: 'ACCEPTED',
      createdAt: { gte: since },
    },
    orderBy: { createdAt: 'desc' },
    include: {
      user: {
        select: {
          username: true,
          avatarUrl: true,
        },
      },
    },
  });

  const byUser = new Map<string, TopSolver>();
  for (const submission of submissions) {
    const existing = byUser.get(submission.userId);
    if (existing) {
      existing.solveCount += 1;
      if (submission.createdAt > existing.lastSolvedAt) {
        existing.lastSolvedAt = submission.createdAt;
      }
      continue;
    }

    byUser.set(submission.userId, {
      userId: submission.userId,
      username: submission.user.username,
      avatarUrl: submission.user.avatarUrl,
      solveCount: 1,
      lastSolvedAt: submission.createdAt,
    });
  }

  const solvers = Array.from(byUser.values()).sort((a, b) => {
    if (b.solveCount !== a.solveCount) return b.solveCount - a.solveCount;
    return b.lastSolvedAt.getTime() - a.lastSolvedAt.getTime();
  });
  const topCount = solvers[0]?.solveCount ?? 0;

  return solvers.filter((solver) => solver.solveCount === topCount);
}

router.get('/home', requireAuth, async (req: Request, res: Response) => {
  try {
    const leaderboardLimit = Math.min(Math.max(Number(req.query.leaderboardLimit) || 5, 1), 20);
    const remindersDays = Math.min(Math.max(Number(req.query.remindersDays) || 14, 1), 60);
    const since = startOfToday();

    const [topSolvers, leaderboardPreview] = await Promise.all([
      getTodayTopSolvers(),
      getLeaderboardEntries({ limit: leaderboardLimit }),
    ]);

    res.json({
      generatedAt: new Date().toISOString(),
      dailyQuestions: {
        source: 'UNBACKED',
        message: 'DailyQuestion model and refresh job are not built yet.',
        items: [],
      },
      contestReminders: {
        source: 'UNBACKED',
        message: 'ExternalContestReminder model and refresh job are not built yet.',
        windowDays: remindersDays,
        items: [],
      },
      todayTopSolvers: {
        source: 'LOCAL_ACCEPTED_SUBMISSIONS',
        message:
          'Computed from Forge local accepted submissions only; external platform submissions are not connected yet.',
        since: since.toISOString(),
        solvers: topSolvers,
      },
      leaderboardPreview: {
        source: 'LOCAL_LEADERBOARD_FALLBACK',
        message:
          'Using the existing Forge leaderboard until PlatformProfileSnapshot aggregation is built.',
        entries: leaderboardPreview,
      },
    });
  } catch (err) {
    console.error('[ClubHome] Get error:', err);
    res.status(500).json({ error: 'Failed to fetch club home data' });
  }
});

export default router;
