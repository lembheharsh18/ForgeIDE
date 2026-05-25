import type { Request, Response, NextFunction } from 'express';

import type { TokenPayload } from '../utils/jwt';
import { verifyAccessToken } from '../utils/jwt';

// ── Augment Express Request ──────────────────────

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: TokenPayload;
    }
  }
}

// ── requireAuth Middleware ────────────────────────
// Extracts Bearer token from Authorization header,
// verifies it, and attaches decoded payload to req.user.

export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({
      error: 'Authentication required',
      message: 'Missing or invalid Authorization header',
    });
    return;
  }

  const token = authHeader.split(' ')[1];
  const payload = verifyAccessToken(token);

  if (!payload) {
    res.status(401).json({
      error: 'Authentication failed',
      message: 'Invalid or expired access token',
    });
    return;
  }

  req.user = payload;
  next();
}
