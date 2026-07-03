import rateLimit from 'express-rate-limit';

import { RATE_LIMIT } from '../config/constants';

// ── General Rate Limiter ─────────────────────────
// 100 requests per 15 minutes per IP

export const generalLimiter = rateLimit({
  windowMs: RATE_LIMIT.general.windowMs,
  max: RATE_LIMIT.general.max,
  skip: () => process.env.NODE_ENV === 'test',
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Too many requests',
    message: 'Rate limit exceeded. Please try again later.',
  },
});

// ── Auth Rate Limiter ────────────────────────────
// 5 requests per minute per IP (login/register)

export const authLimiter = rateLimit({
  windowMs: RATE_LIMIT.auth.windowMs,
  max: RATE_LIMIT.auth.max,
  skip: () => process.env.NODE_ENV === 'test',
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Too many authentication attempts',
    message: 'Please wait before trying again.',
  },
});

// ── Execute Rate Limiter ─────────────────────────
// 10 requests per minute per user (code execution)

export const executeLimiter = rateLimit({
  windowMs: RATE_LIMIT.execute.windowMs,
  max: RATE_LIMIT.execute.max,
  skip: () => process.env.NODE_ENV === 'test',
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    // Use userId if available, fall back to IP
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (req as any).user?.userId || req.ip || 'unknown';
  },
  message: {
    error: 'Too many execution requests',
    message: 'Please wait before submitting again.',
  },
});
