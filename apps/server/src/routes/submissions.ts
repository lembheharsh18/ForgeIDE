// ── Submissions Routes ───────────────────────────

import { Router, type Request, type Response } from 'express';

import { prisma } from '../config/db';
import { requireAuth } from '../middleware/requireAuth';

const router = Router();

// ── GET /api/submissions/me ──────────────────────

router.get('/me', requireAuth, async (req: Request, res: Response) => {
  try {
    const { page = '1', limit = '20', verdict, language } = req.query;

    const pageNum = Math.max(1, parseInt(page as string, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit as string, 10) || 20));
    const skip = (pageNum - 1) * limitNum;

    const where: Record<string, unknown> = {
      userId: req.user!.userId,
    };

    if (verdict && verdict !== 'ALL') {
      where.verdict = verdict;
    }

    if (language && language !== 'ALL') {
      where.language = language;
    }

    const [submissions, total] = await Promise.all([
      prisma.submission.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limitNum,
        include: {
          problem: { select: { title: true, platform: true } },
        },
      }),
      prisma.submission.count({ where }),
    ]);

    res.json({
      submissions,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (err) {
    console.error('[Submissions] /me error:', err);
    res.status(500).json({ error: 'Failed to fetch your submissions' });
  }
});

// ── GET /api/submissions/recent ──────────────────

router.get('/recent', requireAuth, async (_req: Request, res: Response) => {
  try {
    const submissions = await prisma.submission.findMany({
      take: 20,
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { username: true, avatarUrl: true } },
        problem: { select: { title: true } },
      },
    });

    // We only want to return lightweight data for the activity feed
    const feed = submissions.map((sub: (typeof submissions)[number]) => ({
      id: sub.id,
      username: sub.user.username,
      avatarUrl: sub.user.avatarUrl,
      problemTitle: sub.problem.title,
      verdict: sub.verdict,
      createdAt: sub.createdAt,
    }));

    res.json(feed);
  } catch (err) {
    console.error('[Submissions] /recent error:', err);
    res.status(500).json({ error: 'Failed to fetch recent submissions' });
  }
});

export default router;
