// ── Socket.IO Server Setup ───────────────────────

import type { Server as HttpServer } from 'http';

import { Server as SocketServer } from 'socket.io';

import { verifyAccessToken } from '../utils/jwt';

import { registerRCHandlers } from './rcInteractor';
import { initChatNamespace } from './chat';

// ── Initialize Socket.IO ─────────────────────────

export function initSocketServer(httpServer: HttpServer): SocketServer {
  const io = new SocketServer(httpServer, {
    cors: {
      origin: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
      methods: ['GET', 'POST'],
      credentials: true,
    },
  });

  // ── /rc Namespace (RC Interactor) ───────────────

  const rcNamespace = io.of('/rc');

  // Auth middleware for /rc namespace
  rcNamespace.use((socket, next) => {
    const token = socket.handshake.auth?.token as string | undefined;

    if (!token) {
      return next(new Error('Unauthorized: No token provided'));
    }

    const payload = verifyAccessToken(token);

    if (!payload) {
      return next(new Error('Unauthorized: Invalid or expired token'));
    }

    // Attach userId to socket data
    socket.data.userId = payload.userId;
    socket.data.email = payload.email;
    next();
  });

  // Register RC handlers on connection
  rcNamespace.on('connection', (socket) => {
    console.warn(`[RC] Client connected: ${socket.id} (user: ${socket.data.userId})`);
    registerRCHandlers(socket);
  });

  // ── Default Namespace ──────────────────────────

  io.on('connection', (socket) => {
    console.warn(`[Socket] Client connected: ${socket.id}`);

    socket.on('disconnect', () => {
      console.warn(`[Socket] Client disconnected: ${socket.id}`);
    });
  });

  // ── /chat Namespace ────────────────────────────
  initChatNamespace(io);

  return io;
}
