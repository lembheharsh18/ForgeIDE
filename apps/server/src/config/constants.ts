// ── Application Constants ────────────────────────

export const JWT_EXPIRY = '15m';
export const REFRESH_EXPIRY = '7d';
export const BCRYPT_ROUNDS = 12;

export const RATE_LIMIT = {
  /** General API: 100 requests per 15 minutes per IP */
  general: {
    windowMs: 15 * 60 * 1000,
    max: 100,
  },
  /** Auth endpoints: 5 requests per minute per IP */
  auth: {
    windowMs: 1 * 60 * 1000,
    max: 5,
  },
  /** Code execution: 10 requests per minute per user */
  execute: {
    windowMs: 1 * 60 * 1000,
    max: 10,
  },
} as const;

export const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  path: '/',
};
