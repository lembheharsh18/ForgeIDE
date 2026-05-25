import type { Request, Response, NextFunction } from 'express';

import { requireAuth } from './requireAuth';

// ── requireAdmin Middleware ──────────────────────
// Chains requireAuth first, then checks for ADMIN role.
// Returns 403 if user is not an admin.

export function requireAdmin(req: Request, res: Response, next: NextFunction): void {
  requireAuth(req, res, (err?: unknown) => {
    if (err) {
      next(err);
      return;
    }

    // If requireAuth already sent a response (401), don't continue
    if (res.headersSent) {
      return;
    }

    if (!req.user || req.user.role !== 'ADMIN') {
      res.status(403).json({
        error: 'Forbidden',
        message: 'Admin access required',
      });
      return;
    }

    next();
  });
}
