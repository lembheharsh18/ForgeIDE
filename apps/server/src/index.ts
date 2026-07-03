import { createServer } from 'http';

import cookieParser from 'cookie-parser';
import cors from 'cors';
import dotenv from 'dotenv';
import type { Request, Response, NextFunction } from 'express';
import express from 'express';
import helmet from 'helmet';
import morgan from 'morgan';

import { generalLimiter } from './middleware/rateLimiter';
import authRoutes from './routes/auth';
import cfRoutes from './routes/cf';
import clubRoutes from './routes/club';
import contestsRoutes from './routes/contests';
import executeRoutes from './routes/execute';
import leaderboardRoutes from './routes/leaderboard';
import problemsRoutes from './routes/problems';
import submissionsRoutes from './routes/submissions';
import usersRoutes from './routes/users';
import { initSocketServer } from './sockets';

dotenv.config({ path: '../../.env' });

const app = express();
const httpServer = createServer(app);

// ── Socket.IO ────────────────────────────────────
const io = initSocketServer(httpServer);

// ── Middleware ────────────────────────────────────
app.use(helmet());
app.use(
  cors({
    origin: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
    credentials: true,
  }),
);
app.use(morgan('dev'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(generalLimiter);

// ── Health Check ─────────────────────────────────
app.get('/health', async (_req, res) => {
  let dbStatus = 'disconnected';
  let redisStatus = 'disconnected';

  try {
    const { prisma } = await import('./config/db');
    await prisma.$queryRaw`SELECT 1`;
    dbStatus = 'connected';
  } catch {
    dbStatus = 'error';
  }

  try {
    const { redis } = await import('./config/redis');
    await redis.ping();
    redisStatus = 'connected';
  } catch {
    redisStatus = 'error';
  }

  const status = dbStatus === 'connected' && redisStatus === 'connected' ? 'ok' : 'degraded';

  res.status(status === 'ok' ? 200 : 503).json({
    status,
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    database: dbStatus,
    redis: redisStatus,
  });
});

// ── Routes ───────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/cf', cfRoutes);
app.use('/api/club', clubRoutes);
app.use('/api/execute', executeRoutes);
app.use('/api/problems', problemsRoutes);
app.use('/api/contests', contestsRoutes);
app.use('/api/leaderboard', leaderboardRoutes);
app.use('/api/submissions', submissionsRoutes);
app.use('/api/users', usersRoutes);

// ── Global Error Handler ─────────────────────────
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error('[Error]', err.stack);
  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong',
  });
});

// ── Start Server ─────────────────────────────────
const PORT = process.env.PORT || 4000;

if (process.env.NODE_ENV !== 'test') {
  httpServer.listen(PORT, () => {
    console.warn(`\n⚡ Forge IDE Server running on port ${PORT}`);
    console.warn(`   Health: http://localhost:${PORT}/health`);
    console.warn(`   Auth:   http://localhost:${PORT}/api/auth`);
    console.warn(`   RC WS:  ws://localhost:${PORT}/rc\n`);
  });
}

export { app, httpServer, io };
