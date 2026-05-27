// ── Contest Routes ───────────────────────────────

import { Router, type Request, type Response } from 'express';
import { z } from 'zod';

import { prisma } from '../config/db';
import { requireAdmin } from '../middleware/requireAdmin';
import { requireAuth } from '../middleware/requireAuth';

const router = Router();

// ── Schemas ──────────────────────────────────────

const createContestSchema = z.object({
  name: z.string().min(1).max(200),
  platform: z.enum(['CODEFORCES', 'ATCODER', 'LEETCODE', 'CUSTOM']),
  startTime: z.string().transform((s) => new Date(s)),
  endTime: z.string().transform((s) => new Date(s)),
  link: z.string().url(),
  description: z.string().max(1000).optional(),
});

// ── GET /api/contests ────────────────────────────

router.get('/', requireAuth, async (_req: Request, res: Response) => {
  try {
    const contests = await prisma.contest.findMany({
      orderBy: { startTime: 'asc' },
      include: {
        _count: { select: { participants: true } },
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

// ── POST /api/contests ───────────────────────────

router.post('/', requireAdmin, async (req: Request, res: Response) => {
  try {
    const body = createContestSchema.parse(req.body);

    const contest = await prisma.contest.create({
      data: {
        name: body.name,
        platform: body.platform,
        startTime: body.startTime,
        endTime: body.endTime,
        link: body.link,
        description: body.description || null,
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

router.put('/:id', requireAdmin, async (req: Request, res: Response) => {
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
        ...(body.platform !== undefined && { platform: body.platform }),
        ...(body.startTime !== undefined && { startTime: body.startTime }),
        ...(body.endTime !== undefined && { endTime: body.endTime }),
        ...(body.link !== undefined && { link: body.link }),
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

export default router;
