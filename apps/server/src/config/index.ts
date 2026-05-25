import dotenv from 'dotenv';

dotenv.config({ path: '../../.env' });

export const config = {
  port: parseInt(process.env.PORT || '4000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  isDev: process.env.NODE_ENV !== 'production',

  database: {
    url: process.env.DATABASE_URL || '',
  },

  redis: {
    url: process.env.REDIS_URL || 'redis://localhost:6379',
  },

  jwt: {
    secret: process.env.JWT_SECRET || 'dev-secret',
    refreshSecret: process.env.JWT_REFRESH_SECRET || 'dev-refresh-secret',
    accessExpiresIn: '15m',
    refreshExpiresIn: '7d',
  },

  piston: {
    url: process.env.PISTON_URL || 'https://emkc.org/api/v2/piston',
  },

  client: {
    url: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
  },
} as const;
