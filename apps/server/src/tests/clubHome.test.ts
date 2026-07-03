import express from 'express';
import supertest from 'supertest';

import { prisma } from '../config/db';
import clubRoutes from '../routes/club';
import { getLeaderboardEntries } from '../services/leaderboard';
import { generateAccessToken } from '../utils/jwt';

jest.mock('../config/db', () => ({
  prisma: {
    submission: {
      findMany: jest.fn(),
    },
  },
}));

jest.mock('../services/leaderboard', () => ({
  getLeaderboardEntries: jest.fn(),
}));

const app = express();
app.use(express.json());
app.use('/api/club', clubRoutes);

const request = supertest(app);
const token = generateAccessToken({
  userId: 'user_1',
  email: 'member@forge.dev',
  role: 'MEMBER',
});

const mockedFindMany = prisma.submission.findMany as jest.Mock;
const mockedGetLeaderboardEntries = getLeaderboardEntries as jest.Mock;

describe('GET /api/club/home', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns empty-state sections when optional backing data is unavailable', async () => {
    mockedFindMany.mockResolvedValueOnce([]);
    mockedGetLeaderboardEntries.mockResolvedValueOnce([]);

    const res = await request.get('/api/club/home').set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.dailyQuestions.items).toEqual([]);
    expect(res.body.dailyQuestions.source).toBe('UNBACKED');
    expect(res.body.contestReminders.items).toEqual([]);
    expect(res.body.contestReminders.source).toBe('UNBACKED');
    expect(res.body.todayTopSolvers.solvers).toEqual([]);
    expect(res.body.leaderboardPreview.entries).toEqual([]);
  });

  it('returns top solvers and leaderboard preview when current data exists', async () => {
    const now = new Date();
    mockedFindMany.mockResolvedValueOnce([
      {
        id: 'sub_1',
        userId: 'user_a',
        createdAt: now,
        user: { username: 'alice', avatarUrl: null },
      },
      {
        id: 'sub_2',
        userId: 'user_a',
        createdAt: now,
        user: { username: 'alice', avatarUrl: null },
      },
      {
        id: 'sub_3',
        userId: 'user_b',
        createdAt: now,
        user: { username: 'bob', avatarUrl: null },
      },
    ]);
    mockedGetLeaderboardEntries.mockResolvedValueOnce([
      {
        rank: 1,
        userId: 'user_a',
        username: 'alice',
        avatarUrl: null,
        codeforcesHandle: 'alice_cf',
        score: 42,
        solvedCount: 12,
        updatedAt: now,
      },
    ]);

    const res = await request.get('/api/club/home').set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.todayTopSolvers.solvers).toEqual([
      expect.objectContaining({ userId: 'user_a', username: 'alice', solveCount: 2 }),
    ]);
    expect(res.body.leaderboardPreview.entries).toEqual([
      expect.objectContaining({ rank: 1, username: 'alice', score: 42 }),
    ]);
  });

  it('requires authentication', async () => {
    const res = await request.get('/api/club/home');

    expect(res.status).toBe(401);
  });
});
