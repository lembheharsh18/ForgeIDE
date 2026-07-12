// ── Forum (Doubt Forum) Routes ───────────────────

import { Router, type Request, type Response } from 'express';
import { z } from 'zod';

import { prisma } from '../config/db';
import { requireAuth } from '../middleware/requireAuth';

const router = Router();

// ── Schemas ──────────────────────────────────────

const createPostSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200),
  content: z.string().min(1, 'Content is required').max(10000),
  tags: z.array(z.string()).max(5).default([]),
});

const createReplySchema = z.object({
  content: z.string().min(1, 'Reply content is required').max(5000),
});

// ── GET /api/forum ───────────────────────────────
// List all forum posts with pagination and filtering

router.get('/', requireAuth, async (req: Request, res: Response) => {
  try {
    const { page = '1', limit = '20', filter, tag, search } = req.query;

    const pageNum = Math.max(1, parseInt(page as string, 10) || 1);
    const limitNum = Math.min(50, Math.max(1, parseInt(limit as string, 10) || 20));
    const skip = (pageNum - 1) * limitNum;

    const where: Record<string, unknown> = {};

    if (filter === 'resolved') {
      where.resolved = true;
    } else if (filter === 'unresolved') {
      where.resolved = false;
    }

    if (tag) {
      where.tags = { has: tag as string };
    }

    if (search) {
      where.title = { contains: search as string, mode: 'insensitive' };
    }

    const [posts, total] = await Promise.all([
      prisma.forumPost.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limitNum,
        include: {
          user: { select: { username: true, avatarUrl: true } },
          _count: { select: { replies: true } },
        },
      }),
      prisma.forumPost.count({ where }),
    ]);

    res.json({
      posts: posts.map((p: (typeof posts)[number]) => ({
        ...p,
        replyCount: p._count.replies,
      })),
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (err) {
    console.error('[Forum] List error:', err);
    res.status(500).json({ error: 'Failed to fetch forum posts' });
  }
});

// ── GET /api/forum/:id ───────────────────────────
// Get a single post with all replies

router.get('/:id', requireAuth, async (req: Request, res: Response) => {
  try {
    const post = await prisma.forumPost.findUnique({
      where: { id: req.params.id },
      include: {
        user: { select: { id: true, username: true, avatarUrl: true } },
        replies: {
          orderBy: { createdAt: 'asc' },
          include: {
            user: { select: { id: true, username: true, avatarUrl: true } },
          },
        },
      },
    });

    if (!post) {
      res.status(404).json({ error: 'Post not found' });
      return;
    }

    res.json(post);
  } catch (err) {
    console.error('[Forum] Get error:', err);
    res.status(500).json({ error: 'Failed to fetch post' });
  }
});

// ── POST /api/forum ──────────────────────────────
// Create a new forum post

router.post('/', requireAuth, async (req: Request, res: Response) => {
  try {
    const body = createPostSchema.parse(req.body);

    const post = await prisma.forumPost.create({
      data: {
        title: body.title,
        content: body.content,
        tags: body.tags,
        userId: req.user!.userId,
      },
      include: {
        user: { select: { username: true, avatarUrl: true } },
      },
    });

    res.status(201).json(post);
  } catch (err) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ error: 'Validation error', details: err.errors });
      return;
    }
    console.error('[Forum] Create error:', err);
    res.status(500).json({ error: 'Failed to create post' });
  }
});

// ── POST /api/forum/:id/reply ────────────────────
// Add a reply to a post

router.post('/:id/reply', requireAuth, async (req: Request, res: Response) => {
  try {
    const body = createReplySchema.parse(req.body);

    const post = await prisma.forumPost.findUnique({ where: { id: req.params.id } });
    if (!post) {
      res.status(404).json({ error: 'Post not found' });
      return;
    }

    const reply = await prisma.forumReply.create({
      data: {
        content: body.content,
        userId: req.user!.userId,
        postId: req.params.id,
      },
      include: {
        user: { select: { id: true, username: true, avatarUrl: true } },
      },
    });

    res.status(201).json(reply);
  } catch (err) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ error: 'Validation error', details: err.errors });
      return;
    }
    console.error('[Forum] Reply error:', err);
    res.status(500).json({ error: 'Failed to add reply' });
  }
});

// ── PATCH /api/forum/:id/resolve ─────────────────
// Mark post as resolved (post author only)

router.patch('/:id/resolve', requireAuth, async (req: Request, res: Response) => {
  try {
    const post = await prisma.forumPost.findUnique({ where: { id: req.params.id } });
    if (!post) {
      res.status(404).json({ error: 'Post not found' });
      return;
    }

    if (post.userId !== req.user!.userId) {
      res.status(403).json({ error: 'Only the post author can mark as resolved' });
      return;
    }

    const updated = await prisma.forumPost.update({
      where: { id: req.params.id },
      data: { resolved: !post.resolved },
    });

    res.json(updated);
  } catch (err) {
    console.error('[Forum] Resolve error:', err);
    res.status(500).json({ error: 'Failed to update post' });
  }
});

// ── PATCH /api/forum/replies/:id/answer ──────────
// Mark reply as accepted answer (post author only)

router.patch('/replies/:id/answer', requireAuth, async (req: Request, res: Response) => {
  try {
    const reply = await prisma.forumReply.findUnique({
      where: { id: req.params.id },
      include: { post: { select: { userId: true } } },
    });

    if (!reply) {
      res.status(404).json({ error: 'Reply not found' });
      return;
    }

    if (reply.post.userId !== req.user!.userId) {
      res.status(403).json({ error: 'Only the post author can mark an accepted answer' });
      return;
    }

    const updated = await prisma.forumReply.update({
      where: { id: req.params.id },
      data: { isAnswer: !reply.isAnswer },
    });

    res.json(updated);
  } catch (err) {
    console.error('[Forum] Answer error:', err);
    res.status(500).json({ error: 'Failed to update reply' });
  }
});

export default router;
