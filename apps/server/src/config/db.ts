import { PrismaClient } from '@prisma/client';

// ── PrismaClient Singleton ───────────────────────
// Prevents multiple instances in development due to
// hot-reloading creating new connections each time.

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}
