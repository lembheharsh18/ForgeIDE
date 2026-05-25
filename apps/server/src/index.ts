import { createServer } from 'http';

import cookieParser from 'cookie-parser';
import cors from 'cors';
import dotenv from 'dotenv';
import type { Request, Response, NextFunction } from 'express';
import express from 'express';
import helmet from 'helmet';
import morgan from 'morgan';
import { Server as SocketServer } from 'socket.io';

import { generalLimiter } from './middleware/rateLimiter';
import authRoutes from './routes/auth';

dotenv.config({ path: '../../.env' });

const app = express();
const httpServer = createServer(app);

const io = new SocketServer(httpServer, {
  cors: {
    origin: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

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
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// ── Routes ───────────────────────────────────────
app.use('/api/auth', authRoutes);

// ── Socket.IO ────────────────────────────────────
io.on('connection', (socket) => {
  console.warn(`[Socket] Client connected: ${socket.id}`);

  socket.on('disconnect', () => {
    console.warn(`[Socket] Client disconnected: ${socket.id}`);
  });
});

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

httpServer.listen(PORT, () => {
  console.warn(`\n⚡ Forge IDE Server running on port ${PORT}`);
  console.warn(`   Health: http://localhost:${PORT}/api/health`);
  console.warn(`   Auth:   http://localhost:${PORT}/api/auth\n`);
});

export { app, httpServer, io };
