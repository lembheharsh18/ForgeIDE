import type { Prisma } from '@prisma/client';
import type { Request, Response } from 'express';
import { Router } from 'express';
import { z } from 'zod';

import { COOKIE_OPTIONS } from '../config/constants';
import { prisma } from '../config/db';
import { authLimiter } from '../middleware/rateLimiter';
import { requireAuth } from '../middleware/requireAuth';
import type { TokenPayload } from '../utils/jwt';
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from '../utils/jwt';
import { hashPassword, comparePassword } from '../utils/password';

const router = Router();

// ── Zod Schemas ──────────────────────────────────

const registerSchema = z.object({
  username: z
    .string()
    .min(3, 'Username must be at least 3 characters')
    .max(20, 'Username must be at most 20 characters')
    .regex(/^[a-zA-Z0-9_]+$/, 'Username must be alphanumeric (underscores allowed)'),
  email: z.string().email('Invalid email address'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least 1 uppercase letter')
    .regex(/[0-9]/, 'Password must contain at least 1 number'),
});

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

// ── POST /api/auth/register ──────────────────────

router.post('/register', authLimiter, async (req: Request, res: Response) => {
  try {
    const validation = registerSchema.safeParse(req.body);

    if (!validation.success) {
      res.status(400).json({
        error: 'Validation failed',
        details: validation.error.flatten().fieldErrors,
      });
      return;
    }

    const { username, email, password } = validation.data;

    // Check uniqueness
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [{ username }, { email }],
      },
    });

    if (existingUser) {
      const field = existingUser.username === username ? 'username' : 'email';
      res.status(409).json({
        error: 'Conflict',
        message: `A user with this ${field} already exists`,
      });
      return;
    }

    // Hash password
    const passwordHash = await hashPassword(password);

    // Create user + leaderboard entry in transaction
    const user = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const newUser = await tx.user.create({
        data: {
          username,
          email,
          passwordHash,
        },
      });

      await tx.leaderboardEntry.create({
        data: {
          userId: newUser.id,
          score: 0,
          solvedCount: 0,
          rank: 0,
        },
      });

      return newUser;
    });

    // Generate tokens
    const payload: TokenPayload = {
      userId: user.id,
      email: user.email,
      role: user.role,
    };

    const accessToken = generateAccessToken(payload);
    const refreshToken = generateRefreshToken(payload);

    // Set refresh token as httpOnly cookie
    res.cookie('refreshToken', refreshToken, COOKIE_OPTIONS);

    res.status(201).json({
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
      },
      accessToken,
    });
  } catch (error) {
    console.error('[Auth] Register error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to register user',
    });
  }
});

// ── POST /api/auth/login ─────────────────────────

router.post('/login', authLimiter, async (req: Request, res: Response) => {
  try {
    const validation = loginSchema.safeParse(req.body);

    if (!validation.success) {
      res.status(400).json({
        error: 'Validation failed',
        details: validation.error.flatten().fieldErrors,
      });
      return;
    }

    const { email, password } = validation.data;

    // Find user
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user || !user.passwordHash) {
      res.status(401).json({
        error: 'Authentication failed',
        message: 'Invalid email or password',
      });
      return;
    }

    // Compare password
    const isValid = await comparePassword(password, user.passwordHash);

    if (!isValid) {
      res.status(401).json({
        error: 'Authentication failed',
        message: 'Invalid email or password',
      });
      return;
    }

    // Generate tokens
    const payload: TokenPayload = {
      userId: user.id,
      email: user.email,
      role: user.role,
    };

    const accessToken = generateAccessToken(payload);
    const refreshToken = generateRefreshToken(payload);

    // Set refresh token as httpOnly cookie
    res.cookie('refreshToken', refreshToken, COOKIE_OPTIONS);

    res.json({
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
      },
      accessToken,
    });
  } catch (error) {
    console.error('[Auth] Login error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to login',
    });
  }
});

// ── POST /api/auth/refresh ───────────────────────

router.post('/refresh', async (req: Request, res: Response) => {
  try {
    const refreshToken = req.cookies?.refreshToken;

    if (!refreshToken) {
      res.status(401).json({
        error: 'Authentication required',
        message: 'No refresh token found',
      });
      return;
    }

    const payload = verifyRefreshToken(refreshToken);

    if (!payload) {
      res.status(401).json({
        error: 'Authentication failed',
        message: 'Invalid or expired refresh token',
      });
      return;
    }

    // Verify user still exists
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
    });

    if (!user) {
      res.status(401).json({
        error: 'Authentication failed',
        message: 'User not found',
      });
      return;
    }

    // Generate new access token with current user data
    const newPayload: TokenPayload = {
      userId: user.id,
      email: user.email,
      role: user.role,
    };

    const accessToken = generateAccessToken(newPayload);

    res.json({ accessToken });
  } catch (error) {
    console.error('[Auth] Refresh error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to refresh token',
    });
  }
});

// ── POST /api/auth/logout ────────────────────────

router.post('/logout', (_req: Request, res: Response) => {
  res.clearCookie('refreshToken', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
  });

  res.json({ message: 'Logged out' });
});

// ── GET /api/auth/me ─────────────────────────────

router.get('/me', requireAuth, async (req: Request, res: Response) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.userId },
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        codeforcesHandle: true,
        avatarUrl: true,
        createdAt: true,
        updatedAt: true,
        leaderboard: {
          select: {
            score: true,
            solvedCount: true,
            rank: true,
          },
        },
      },
    });

    if (!user) {
      res.status(404).json({
        error: 'Not found',
        message: 'User not found',
      });
      return;
    }

    res.json({ user });
  } catch (error) {
    console.error('[Auth] Me error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to fetch user data',
    });
  }
});

export default router;
