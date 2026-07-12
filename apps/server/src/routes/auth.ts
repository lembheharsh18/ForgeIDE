import type { Prisma } from '@prisma/client';
import type { Request, Response } from 'express';
import { Router } from 'express';
import { OAuth2Client } from 'google-auth-library';
import { z } from 'zod';

import { COOKIE_OPTIONS } from '../config/constants';
import { prisma } from '../config/db';
import { authLimiter } from '../middleware/rateLimiter';
import { requireAuth } from '../middleware/requireAuth';
import { fetchCFRating, fetchLCRating, fetchCCRating } from '../services/cpStats';
import type { TokenPayload } from '../utils/jwt';
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from '../utils/jwt';
import { hashPassword, comparePassword } from '../utils/password';

const router = Router();
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

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
  codeforcesHandle: z.string().min(1, 'Codeforces handle is required'),
  codechefHandle: z.string().min(1, 'CodeChef handle is required'),
  leetcodeUsername: z.string().min(1, 'LeetCode username is required'),
});

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

// ── Handle Verification ──────────────────────────

async function verifyHandles(
  cfHandle: string,
  ccHandle: string,
  lcUsername: string,
): Promise<{ valid: boolean; errors: string[] }> {
  const errors: string[] = [];

  const [cfResult, lcResult, ccResult] = await Promise.allSettled([
    fetchCFRating(cfHandle),
    fetchLCRating(lcUsername),
    fetchCCRating(ccHandle),
  ]);

  // CF: if the API returns null rating AND null rank, the handle likely doesn't exist
  if (cfResult.status === 'fulfilled') {
    const { rating, rank } = cfResult.value;
    if (rating === null && rank === null) {
      errors.push(`Codeforces handle "${cfHandle}" not found`);
    }
  } else {
    errors.push('Failed to verify Codeforces handle');
  }

  // LC: we're more lenient — null rating is OK for unrated users
  // only reject on network failure
  if (lcResult.status === 'rejected') {
    errors.push('Failed to verify LeetCode username');
  }

  // CC: similar — null rating is OK for new users
  if (ccResult.status === 'rejected') {
    errors.push('Failed to verify CodeChef handle');
  }

  return { valid: errors.length === 0, errors };
}

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

    const { username, email, password, codeforcesHandle, codechefHandle, leetcodeUsername } =
      validation.data;

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

    // Verify coding handles
    const handleCheck = await verifyHandles(codeforcesHandle, codechefHandle, leetcodeUsername);
    if (!handleCheck.valid) {
      res.status(400).json({
        error: 'Handle verification failed',
        message: handleCheck.errors.join('; '),
        details: { handleErrors: handleCheck.errors },
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
          codeforcesHandle,
          codechefHandle,
          leetcodeUsername,
          handlesVerified: true,
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

      // Create platform profile cache
      await tx.platformProfileCache.create({
        data: {
          userId: newUser.id,
        },
      });

      return newUser;
    });

    // Generate tokens
    const payload: TokenPayload = {
      userId: user.id,
      email: user.email,
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
        codeforcesHandle: user.codeforcesHandle,
        codechefHandle: user.codechefHandle,
        leetcodeUsername: user.leetcodeUsername,
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
        codeforcesHandle: user.codeforcesHandle,
        codechefHandle: user.codechefHandle,
        leetcodeUsername: user.leetcodeUsername,
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
        codeforcesHandle: true,
        codechefHandle: true,
        leetcodeUsername: true,
        handlesVerified: true,
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

// ── PUT /api/auth/profile ────────────────────────

const updateProfileSchema = z.object({
  codeforcesHandle: z.string().optional().nullable(),
  codechefHandle: z.string().optional().nullable(),
  leetcodeUsername: z.string().optional().nullable(),
});

router.put('/profile', requireAuth, async (req: Request, res: Response) => {
  try {
    const validation = updateProfileSchema.safeParse(req.body);

    if (!validation.success) {
      res.status(400).json({
        error: 'Validation failed',
        details: validation.error.flatten().fieldErrors,
      });
      return;
    }

    const { codeforcesHandle, codechefHandle, leetcodeUsername } = validation.data;

    const user = await prisma.user.update({
      where: { id: req.user!.userId },
      data: {
        ...(codeforcesHandle !== undefined && { codeforcesHandle }),
        ...(codechefHandle !== undefined && { codechefHandle }),
        ...(leetcodeUsername !== undefined && { leetcodeUsername }),
      },
      select: {
        id: true,
        username: true,
        email: true,
        codeforcesHandle: true,
        codechefHandle: true,
        leetcodeUsername: true,
        avatarUrl: true,
      },
    });

    res.json({ user });
  } catch (error) {
    console.error('[Auth] Profile update error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to update profile',
    });
  }
});

// ── POST /api/auth/google ────────────────────────
router.post('/google', async (req: Request, res: Response) => {
  try {
    const { credential } = req.body;
    if (!credential) {
      res.status(400).json({ error: 'Missing credential' });
      return;
    }

    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    if (!payload || !payload.email) {
      res.status(400).json({ error: 'Invalid token payload' });
      return;
    }

    const { email, name, picture } = payload;

    // Find existing user
    let user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      // Create new user
      const baseUsername = email.split('@')[0].replace(/[^a-zA-Z0-9_]/g, '') || 'user';
      let username = baseUsername;
      let counter = 1;

      while (await prisma.user.findUnique({ where: { username } })) {
        username = `${baseUsername}${counter}`;
        counter++;
      }

      user = await prisma.$transaction(async (tx) => {
        const newUser = await tx.user.create({
          data: {
            username,
            email,
            avatarUrl: picture,
            handlesVerified: false,
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

        await tx.platformProfileCache.create({
          data: {
            userId: newUser.id,
          },
        });

        return newUser;
      });
    }

    // Generate tokens
    const jwtPayload: TokenPayload = {
      userId: user.id,
      email: user.email,
    };

    const accessToken = generateAccessToken(jwtPayload);
    const refreshToken = generateRefreshToken(jwtPayload);

    // Set refresh token as httpOnly cookie
    res.cookie('refreshToken', refreshToken, COOKIE_OPTIONS);

    res.status(200).json({
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        codeforcesHandle: user.codeforcesHandle,
        codechefHandle: user.codechefHandle,
        leetcodeUsername: user.leetcodeUsername,
        avatarUrl: user.avatarUrl,
      },
      accessToken,
    });
  } catch (error) {
    console.error('[Auth] Google OAuth error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to authenticate with Google',
    });
  }
});

export default router;
