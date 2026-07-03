// ── Leaderboard Recalculation Service ────────────

import { prisma } from '../config/db';
import { redis } from '../config/redis';

export interface LeaderboardListEntry {
  rank: number;
  userId: string;
  username: string;
  avatarUrl: string | null;
  codeforcesHandle: string | null;
  score: number;
  solvedCount: number;
  updatedAt: Date;
}

export type LeaderboardSortKey = 'rank' | 'rating' | 'solved';
export type LeaderboardPlatformFilter = 'ALL' | 'CODEFORCES' | 'LEETCODE' | 'CODECHEF' | 'GFG';

export interface LeaderboardQueryOptions {
  limit?: number;
  sort?: LeaderboardSortKey;
  platform?: LeaderboardPlatformFilter;
}

export async function getLeaderboardEntries(
  options: LeaderboardQueryOptions = {},
): Promise<LeaderboardListEntry[]> {
  const { limit, sort = 'rating', platform = 'ALL' } = options;
  const orderBy =
    sort === 'solved'
      ? [{ solvedCount: 'desc' as const }, { score: 'desc' as const }]
      : sort === 'rank'
        ? [{ rank: 'asc' as const }, { score: 'desc' as const }]
        : [{ score: 'desc' as const }, { solvedCount: 'desc' as const }];

  const entries = await prisma.leaderboardEntry.findMany({
    orderBy,
    where:
      platform === 'CODEFORCES'
        ? {
            user: {
              codeforcesHandle: { not: null },
            },
          }
        : undefined,
    ...(limit ? { take: limit } : {}),
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

  const filteredEntries = platform === 'ALL' || platform === 'CODEFORCES' ? entries : [];

  return filteredEntries.map((entry: (typeof filteredEntries)[number], index: number) => ({
    rank: index + 1,
    userId: entry.userId,
    username: entry.user.username,
    avatarUrl: entry.user.avatarUrl,
    codeforcesHandle: entry.user.codeforcesHandle,
    score: entry.score,
    solvedCount: entry.solvedCount,
    updatedAt: entry.updatedAt,
  }));
}

// ── Score Calculation ────────────────────────────

function calculateProblemScore(platform: string, difficulty: string): number {
  const d = difficulty.toLowerCase();
  const n = parseInt(difficulty);

  // CF problems: score based on rating bracket
  if (platform === 'CODEFORCES' && !isNaN(n)) {
    return Math.max(1, Math.round(n / 400));
  }

  // DSA problems: easy/medium/hard
  if (d === 'easy') return 1;
  if (d === 'medium') return 2;
  if (d === 'hard') return 4;

  // Default: numeric difficulty / 400 or 1 point
  if (!isNaN(n)) return Math.max(1, Math.round(n / 400));
  return 1;
}

// ── Recalculate Single User ──────────────────────

export async function recalculateUserScore(userId: string): Promise<void> {
  // Fetch all problems the user has solved
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      solvedProblems: {
        select: { platform: true, difficulty: true },
      },
    },
  });

  if (!user) return;

  let totalScore = 0;
  for (const problem of user.solvedProblems) {
    totalScore += calculateProblemScore(problem.platform, problem.difficulty);
  }

  // Upsert the leaderboard entry
  await prisma.leaderboardEntry.upsert({
    where: { userId },
    update: {
      score: totalScore,
      solvedCount: user.solvedProblems.length,
    },
    create: {
      userId,
      score: totalScore,
      solvedCount: user.solvedProblems.length,
      rank: 0,
    },
  });
}

// ── Recalculate All Ranks ────────────────────────

export async function recalculateAllRanks(): Promise<void> {
  // Fetch all entries sorted by score descending
  const entries = await prisma.leaderboardEntry.findMany({
    orderBy: { score: 'desc' },
    include: {
      user: {
        select: { username: true },
      },
    },
  });

  // Update ranks (1-indexed)
  const updates = entries.map((entry: (typeof entries)[number], index: number) =>
    prisma.leaderboardEntry.update({
      where: { id: entry.id },
      data: { rank: index + 1 },
    }),
  );

  await prisma.$transaction(updates);

  // Cache the full leaderboard in Redis (60 seconds)
  const leaderboardData = entries.map((entry: (typeof entries)[number], index: number) => ({
    rank: index + 1,
    userId: entry.userId,
    username: entry.user.username,
    score: entry.score,
    solvedCount: entry.solvedCount,
  }));

  try {
    await redis.setex('leaderboard:full', 60, JSON.stringify(leaderboardData));
  } catch {
    // Redis unavailable — skip caching
  }
}

// ── Process AC Submission ────────────────────────
// Called after every successful submission

export async function processAcceptedSubmission(userId: string, problemId: string): Promise<void> {
  // Add the problem to user's solved list (if not already)
  await prisma.user.update({
    where: { id: userId },
    data: {
      solvedProblems: {
        connect: { id: problemId },
      },
    },
  });

  // Recalculate user's score and all ranks
  await recalculateUserScore(userId);
  await recalculateAllRanks();
}
