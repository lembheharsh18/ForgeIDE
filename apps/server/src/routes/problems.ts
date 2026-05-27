// ── Problem Routes ───────────────────────────────

import crypto from 'crypto';

import { Router, type Request, type Response } from 'express';
import { z } from 'zod';

import { prisma } from '../config/db';
import { redis } from '../config/redis';
import { requireAdmin } from '../middleware/requireAdmin';
import { requireAuth } from '../middleware/requireAuth';
import { scrapeCFProblem, CFError } from '../services/cfScraper';

const router = Router();

// ── Helpers ──────────────────────────────────────

function cacheKey(params: Record<string, unknown>): string {
  const hash = crypto.createHash('md5').update(JSON.stringify(params)).digest('hex');
  return `problems:list:${hash}`;
}

async function invalidateProblemsCache(): Promise<void> {
  try {
    const keys = await redis.keys('problems:list:*');
    if (keys.length > 0) {
      await redis.del(...keys);
    }
  } catch {
    // Redis unavailable
  }
}

// ── Schemas ──────────────────────────────────────

const createProblemSchema = z.object({
  title: z.string().min(1).max(200),
  platform: z.enum(['CODEFORCES', 'ATCODER', 'LEETCODE', 'CUSTOM']),
  difficulty: z.string().min(1).max(20),
  tags: z.array(z.string()).default([]),
  link: z.string().url().optional().or(z.literal('')),
  cfContestId: z.string().optional(),
  cfIndex: z.string().optional(),
  timeLimit: z.number().int().positive().optional(),
  memoryLimit: z.number().int().positive().optional(),
  statement: z.string().optional(),
  inputSpec: z.string().optional(),
  outputSpec: z.string().optional(),
  noteSection: z.string().optional(),
  testCases: z
    .array(
      z.object({
        input: z.string(),
        output: z.string(),
      }),
    )
    .optional(),
});

// ── GET /api/problems ────────────────────────────

router.get('/', requireAuth, async (req: Request, res: Response) => {
  try {
    const {
      platform,
      difficulty,
      tags,
      status,
      search,
      page = '1',
      limit = '25',
      sort = 'createdAt',
    } = req.query;

    const pageNum = Math.max(1, parseInt(page as string, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit as string, 10) || 25));
    const skip = (pageNum - 1) * limitNum;

    // Build cache key
    const queryParams = {
      platform,
      difficulty,
      tags,
      status,
      search,
      page: pageNum,
      limit: limitNum,
      sort,
      userId: req.user?.userId,
    };
    const key = cacheKey(queryParams);

    // Check cache
    try {
      const cached = await redis.get(key);
      if (cached) {
        res.json(JSON.parse(cached));
        return;
      }
    } catch {
      // Redis unavailable
    }

    // Build Prisma where clause
    const where: Record<string, unknown> = {};

    if (platform && platform !== 'ALL') {
      where.platform = platform;
    }

    if (difficulty) {
      where.difficulty = difficulty;
    }

    if (tags) {
      const tagList = (tags as string)
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean);
      if (tagList.length > 0) {
        where.tags = { hasSome: tagList };
      }
    }

    if (search) {
      where.title = { contains: search as string, mode: 'insensitive' };
    }

    // Build order clause
    let orderBy: Record<string, string> = { createdAt: 'desc' };
    if (sort === 'difficulty') {
      orderBy = { difficulty: 'asc' };
    }

    // Fetch problems
    const [problems, total] = await Promise.all([
      prisma.problem.findMany({
        where,
        orderBy,
        skip,
        take: limitNum,
        include: {
          solvedBy: { select: { id: true } },
          _count: { select: { solvedBy: true } },
        },
      }),
      prisma.problem.count({ where }),
    ]);

    // Map results
    const userId = req.user?.userId;
    const mapped = problems.map((p: (typeof problems)[number]) => ({
      id: p.id,
      title: p.title,
      platform: p.platform,
      difficulty: p.difficulty,
      tags: p.tags,
      link: p.link,
      cfContestId: p.cfContestId,
      cfIndex: p.cfIndex,
      timeLimit: p.timeLimit,
      memoryLimit: p.memoryLimit,
      createdAt: p.createdAt,
      solvedCount: p._count.solvedBy,
      isSolved: userId
        ? p.solvedBy.some((u: (typeof p.solvedBy)[number]) => u.id === userId)
        : false,
    }));

    // Filter by solved status if requested
    let result = mapped;
    if (status === 'solved') {
      result = mapped.filter((p: (typeof mapped)[number]) => p.isSolved);
    } else if (status === 'unsolved') {
      result = mapped.filter((p: (typeof mapped)[number]) => !p.isSolved);
    }

    // Sort by solvedCount if requested (post-fetch)
    if (sort === 'solvedCount') {
      result.sort(
        (a: (typeof mapped)[number], b: (typeof mapped)[number]) => b.solvedCount - a.solvedCount,
      );
    }

    const response = {
      problems: result,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
    };

    // Cache for 60s
    try {
      await redis.setex(key, 60, JSON.stringify(response));
    } catch {
      // Redis unavailable
    }

    res.json(response);
  } catch (err) {
    console.error('[Problems] List error:', err);
    res.status(500).json({ error: 'Failed to fetch problems' });
  }
});

// ── GET /api/problems/:id ────────────────────────

router.get('/:id', requireAuth, async (req: Request, res: Response) => {
  try {
    const problem = await prisma.problem.findUnique({
      where: { id: req.params.id },
      include: {
        _count: { select: { solvedBy: true, submissions: true } },
      },
    });

    if (!problem) {
      res.status(404).json({ error: 'Problem not found' });
      return;
    }

    res.json({
      ...problem,
      solvedCount: problem._count.solvedBy,
      submissionCount: problem._count.submissions,
    });
  } catch (err) {
    console.error('[Problems] Get error:', err);
    res.status(500).json({ error: 'Failed to fetch problem' });
  }
});

// ── POST /api/problems ───────────────────────────

router.post('/', requireAdmin, async (req: Request, res: Response) => {
  try {
    const body = createProblemSchema.parse(req.body);

    // If CF problem, try to scrape data
    let cfData: Partial<typeof body> = {};
    if (body.cfContestId && body.cfIndex) {
      try {
        const scraped = await scrapeCFProblem(body.cfContestId, body.cfIndex);
        cfData = {
          title: body.title || scraped.title,
          statement: scraped.statement,
          inputSpec: scraped.inputSpec,
          outputSpec: scraped.outputSpec,
          noteSection: scraped.noteSection,
          timeLimit: scraped.timeLimit,
          memoryLimit: scraped.memoryLimit,
          testCases: scraped.testCases,
        };
      } catch (cfErr) {
        if (cfErr instanceof CFError) {
          console.warn('[Problems] CF scrape failed:', cfErr.message);
        }
      }
    }

    const problem = await prisma.problem.create({
      data: {
        title: cfData.title || body.title,
        platform: body.platform,
        difficulty: body.difficulty,
        tags: body.tags,
        link: body.link || null,
        cfContestId: body.cfContestId || null,
        cfIndex: body.cfIndex || null,
        timeLimit: cfData.timeLimit ?? body.timeLimit ?? null,
        memoryLimit: cfData.memoryLimit ?? body.memoryLimit ?? null,
        statement: cfData.statement ?? body.statement ?? null,
        inputSpec: cfData.inputSpec ?? body.inputSpec ?? null,
        outputSpec: cfData.outputSpec ?? body.outputSpec ?? null,
        noteSection: cfData.noteSection ?? body.noteSection ?? null,
        testCases: (cfData.testCases ?? body.testCases ?? null) as unknown as undefined,
        addedById: req.user!.userId,
      },
    });

    await invalidateProblemsCache();

    res.status(201).json(problem);
  } catch (err) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ error: 'Validation error', details: err.errors });
      return;
    }
    console.error('[Problems] Create error:', err);
    res.status(500).json({ error: 'Failed to create problem' });
  }
});

// ── PUT /api/problems/:id ────────────────────────

router.put('/:id', requireAdmin, async (req: Request, res: Response) => {
  try {
    const existing = await prisma.problem.findUnique({ where: { id: req.params.id } });
    if (!existing) {
      res.status(404).json({ error: 'Problem not found' });
      return;
    }

    const body = createProblemSchema.partial().parse(req.body);

    const problem = await prisma.problem.update({
      where: { id: req.params.id },
      data: {
        ...(body.title !== undefined && { title: body.title }),
        ...(body.platform !== undefined && { platform: body.platform }),
        ...(body.difficulty !== undefined && { difficulty: body.difficulty }),
        ...(body.tags !== undefined && { tags: body.tags }),
        ...(body.link !== undefined && { link: body.link || null }),
        ...(body.timeLimit !== undefined && { timeLimit: body.timeLimit }),
        ...(body.memoryLimit !== undefined && { memoryLimit: body.memoryLimit }),
        ...(body.statement !== undefined && { statement: body.statement }),
        ...(body.inputSpec !== undefined && { inputSpec: body.inputSpec }),
        ...(body.outputSpec !== undefined && { outputSpec: body.outputSpec }),
        ...(body.noteSection !== undefined && { noteSection: body.noteSection }),
        ...(body.testCases !== undefined && { testCases: body.testCases as unknown as undefined }),
      },
    });

    await invalidateProblemsCache();

    res.json(problem);
  } catch (err) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ error: 'Validation error', details: err.errors });
      return;
    }
    console.error('[Problems] Update error:', err);
    res.status(500).json({ error: 'Failed to update problem' });
  }
});

// ── DELETE /api/problems/:id ─────────────────────

router.delete('/:id', requireAdmin, async (req: Request, res: Response) => {
  try {
    await prisma.problem.delete({ where: { id: req.params.id } });
    await invalidateProblemsCache();
    res.json({ message: 'Problem deleted' });
  } catch (err) {
    console.error('[Problems] Delete error:', err);
    res.status(500).json({ error: 'Failed to delete problem' });
  }
});

export default router;
