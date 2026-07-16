// ── Contest Routes ───────────────────────────────

import { Router, type Request, type Response } from 'express';
import { z } from 'zod';

import { prisma } from '../config/db';
import { requireAuth } from '../middleware/requireAuth';

const router = Router();

// ── Schemas ──────────────────────────────────────

const createContestSchema = z.object({
  name: z.string().min(1).max(200),
  type: z.enum(['NORMAL', 'REVERSE_CODING']).optional(),
  platform: z.enum(['CODEFORCES', 'ATCODER', 'LEETCODE', 'CUSTOM']),
  startTime: z.string().transform((s) => new Date(s)),
  endTime: z.string().transform((s) => new Date(s)),
  link: z.string().url().optional().or(z.literal('')),
  description: z.string().max(1000).optional(),
  problemIds: z.array(z.string()).optional(),
});

// ── GET /api/contests ────────────────────────────

router.get('/', requireAuth, async (_req: Request, res: Response) => {
  try {
    const contests = await prisma.contest.findMany({
      orderBy: { startTime: 'asc' },
      include: {
        _count: { select: { participants: true } },
        createdBy: { select: { username: true } },
      },
    });

    const now = new Date();
    const upcoming = contests
      .filter((c: (typeof contests)[number]) => c.endTime > now)
      .map((c: (typeof contests)[number]) => ({ ...c, participantCount: c._count.participants }));
    const past = contests
      .filter((c: (typeof contests)[number]) => c.endTime <= now)
      .reverse()
      .map((c: (typeof contests)[number]) => ({ ...c, participantCount: c._count.participants }));

    res.json({ upcoming, past });
  } catch (err) {
    console.error('[Contests] List error:', err);
    res.status(500).json({ error: 'Failed to fetch contests' });
  }
});

// ── GET /api/contests/live ───────────────────────

router.get('/live', requireAuth, async (_req: Request, res: Response) => {
  try {
    const now = new Date();

    // Find a contest that is currently running
    const liveContest = await prisma.contest.findFirst({
      where: {
        startTime: { lte: now },
        endTime: { gt: now },
      },
      include: {
        problems: {
          select: { id: true, title: true, difficulty: true, platform: true },
        },
      },
    });

    if (liveContest) {
      res.json({ isLive: true, contest: liveContest });
      return;
    }

    // If no live contest, find the next upcoming one
    const nextContest = await prisma.contest.findFirst({
      where: {
        startTime: { gt: now },
      },
      orderBy: { startTime: 'asc' },
    });

    res.json({
      isLive: false,
      nextContest: nextContest
        ? { id: nextContest.id, startTime: nextContest.startTime, name: nextContest.name }
        : null,
    });
  } catch (err) {
    console.error('[Contests] Live check error:', err);
    res.status(500).json({ error: 'Failed to check live contest' });
  }
});

// ── GET /api/contests/:id ────────────────────────

router.get('/:id', requireAuth, async (req: Request, res: Response) => {
  try {
    const contest = await prisma.contest.findUnique({
      where: { id: req.params.id },
      include: {
        problems: {
          select: {
            id: true,
            title: true,
            difficulty: true,
            platform: true,
            tags: true,
            referenceLang: true,
            statement: true,
            inputSpec: true,
            outputSpec: true,
            noteSection: true,
            timeLimit: true,
            memoryLimit: true,
            testCases: true,
          },
        },
        _count: { select: { participants: true } },
        createdBy: { select: { username: true } },
      },
    });

    if (!contest) {
      res.status(404).json({ error: 'Contest not found' });
      return;
    }

    res.json({ ...contest, participantCount: contest._count.participants });
  } catch (err) {
    console.error('[Contests] Get error:', err);
    res.status(500).json({ error: 'Failed to fetch contest' });
  }
});

// ── GET /api/contests/:id/leaderboard ────────────

router.get('/:id/leaderboard', requireAuth, async (req: Request, res: Response) => {
  try {
    const contest = await prisma.contest.findUnique({
      where: { id: req.params.id },
      include: {
        problems: { select: { id: true, title: true } },
      },
    });

    if (!contest) {
      res.status(404).json({ error: 'Contest not found' });
      return;
    }

    const problemIds = contest.problems.map((p) => p.id);

    // Fetch all ACCEPTED submissions for this contest's problems
    const submissions = await prisma.submission.findMany({
      where: {
        problemId: { in: problemIds },
        verdict: 'ACCEPTED',
        contestId: contest.id,
      },
      orderBy: { createdAt: 'asc' },
      include: {
        user: { select: { id: true, username: true, avatarUrl: true } },
      },
    });

    // Build per-user standings
    const userMap = new Map<
      string,
      {
        userId: string;
        username: string;
        avatarUrl: string | null;
        solved: Set<string>;
        totalPenalty: number;
        problemTimes: Record<string, number>;
      }
    >();

    for (const sub of submissions) {
      if (!userMap.has(sub.userId)) {
        userMap.set(sub.userId, {
          userId: sub.userId,
          username: sub.user.username,
          avatarUrl: sub.user.avatarUrl,
          solved: new Set(),
          totalPenalty: 0,
          problemTimes: {},
        });
      }

      const entry = userMap.get(sub.userId)!;
      if (!entry.solved.has(sub.problemId)) {
        entry.solved.add(sub.problemId);
        const timeSinceStart = Math.floor(
          (sub.createdAt.getTime() - contest.startTime.getTime()) / 60000,
        );
        entry.totalPenalty += Math.max(0, timeSinceStart);
        entry.problemTimes[sub.problemId] = timeSinceStart;
      }
    }

    // Sort: most solved first, then lowest penalty
    const standings = Array.from(userMap.values())
      .map((entry) => ({
        userId: entry.userId,
        username: entry.username,
        avatarUrl: entry.avatarUrl,
        solvedCount: entry.solved.size,
        totalPenalty: entry.totalPenalty,
        problemStatuses: problemIds.map((pid) => ({
          problemId: pid,
          solved: entry.solved.has(pid),
          timeMinutes: entry.problemTimes[pid] ?? null,
        })),
      }))
      .sort((a, b) => {
        if (b.solvedCount !== a.solvedCount) return b.solvedCount - a.solvedCount;
        return a.totalPenalty - b.totalPenalty;
      })
      .map((entry, i) => ({ ...entry, rank: i + 1 }));

    res.json({
      contestId: contest.id,
      contestName: contest.name,
      problems: contest.problems,
      standings,
    });
  } catch (err) {
    console.error('[Contests] Leaderboard error:', err);
    res.status(500).json({ error: 'Failed to fetch contest leaderboard' });
  }
});

// ── POST /api/contests ───────────────────────────
// Any authenticated user can create a contest

router.post('/', requireAuth, async (req: Request, res: Response) => {
  try {
    const body = createContestSchema.parse(req.body);

    const contest = await prisma.contest.create({
      data: {
        name: body.name,
        type: body.type || 'NORMAL',
        platform: body.platform,
        startTime: body.startTime,
        endTime: body.endTime,
        link: body.link || null,
        description: body.description || null,
        createdById: req.user!.userId,
        ...(body.problemIds && body.problemIds.length > 0
          ? {
              problems: {
                connect: body.problemIds.map((id) => ({ id })),
              },
            }
          : {}),
      },
      include: {
        problems: { select: { id: true, title: true } },
      },
    });

    res.status(201).json(contest);
  } catch (err) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ error: 'Validation error', details: err.errors });
      return;
    }
    console.error('[Contests] Create error:', err);
    res.status(500).json({ error: 'Failed to create contest' });
  }
});

// ── PUT /api/contests/:id ────────────────────────

router.put('/:id', requireAuth, async (req: Request, res: Response) => {
  try {
    const existing = await prisma.contest.findUnique({ where: { id: req.params.id } });
    if (!existing) {
      res.status(404).json({ error: 'Contest not found' });
      return;
    }

    const body = createContestSchema.partial().parse(req.body);

    const contest = await prisma.contest.update({
      where: { id: req.params.id },
      data: {
        ...(body.name !== undefined && { name: body.name }),
        ...(body.type !== undefined && { type: body.type }),
        ...(body.platform !== undefined && { platform: body.platform }),
        ...(body.startTime !== undefined && { startTime: body.startTime }),
        ...(body.endTime !== undefined && { endTime: body.endTime }),
        ...(body.link !== undefined && { link: body.link || null }),
        ...(body.description !== undefined && { description: body.description }),
      },
    });

    res.json(contest);
  } catch (err) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ error: 'Validation error', details: err.errors });
      return;
    }
    console.error('[Contests] Update error:', err);
    res.status(500).json({ error: 'Failed to update contest' });
  }
});

// ── POST /api/contests/:id/join ──────────────────

router.post('/:id/join', requireAuth, async (req: Request, res: Response) => {
  try {
    const contest = await prisma.contest.update({
      where: { id: req.params.id },
      data: {
        participants: {
          connect: { id: req.user!.userId },
        },
      },
      include: {
        _count: { select: { participants: true } },
      },
    });

    res.json({ message: 'Joined contest', participantCount: contest._count.participants });
  } catch (err) {
    console.error('[Contests] Join error:', err);
    res.status(500).json({ error: 'Failed to join contest' });
  }
});

// ── POST /api/contests/:id/problems ──────────────

router.post('/:id/problems', requireAuth, async (req: Request, res: Response) => {
  try {
    const { problemIds } = z.object({ problemIds: z.array(z.string()).min(1) }).parse(req.body);

    const contest = await prisma.contest.update({
      where: { id: req.params.id },
      data: {
        problems: {
          connect: problemIds.map((id) => ({ id })),
        },
      },
      include: {
        problems: { select: { id: true, title: true } },
      },
    });

    res.json(contest);
  } catch (err) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ error: 'Validation error', details: err.errors });
      return;
    }
    console.error('[Contests] Add problems error:', err);
    res.status(500).json({ error: 'Failed to add problems to contest' });
  }
});

export default router;
