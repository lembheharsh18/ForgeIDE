import Redis from 'ioredis';

// ── Redis Client Singleton ───────────────────────

const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

const globalForRedis = globalThis as unknown as {
  redis: Redis | undefined;
};

export const redis =
  globalForRedis.redis ??
  new Redis(redisUrl, {
    maxRetriesPerRequest: 3,
    retryStrategy(times) {
      const delay = Math.min(times * 50, 2000);
      return delay;
    },
    lazyConnect: true,
  });

redis.on('error', (err) => {
  console.error('[Redis] Connection error:', err.message);
});

redis.on('connect', () => {
  console.warn('[Redis] Connected successfully');
});

if (process.env.NODE_ENV !== 'production') {
  globalForRedis.redis = redis;
}
