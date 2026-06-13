// ── Auth Route Tests ─────────────────────────────

import supertest from 'supertest';

import { app } from '../index';

const request = supertest(app);

// ── Helpers ──────────────────────────────────────

const testUser = {
  username: `testuser_${Date.now()}`,
  email: `test_${Date.now()}@forge.dev`,
  password: 'TestPass1234',
};

let accessToken: string;

// ── POST /api/auth/register ──────────────────────

describe('POST /api/auth/register', () => {
  it('registers a new user successfully', async () => {
    const res = await request.post('/api/auth/register').send(testUser);
    expect(res.status).toBe(201);
    expect(res.body.user).toBeDefined();
    expect(res.body.user.username).toBe(testUser.username);
    expect(res.body.user.email).toBe(testUser.email);
  });

  it('returns access token on register', async () => {
    const uniqueUser = {
      username: `tokenuser_${Date.now()}`,
      email: `tokenuser_${Date.now()}@forge.dev`,
      password: 'TestPass1234',
    };
    const res = await request.post('/api/auth/register').send(uniqueUser);
    expect(res.status).toBe(201);
    expect(res.body.accessToken).toBeDefined();
    expect(typeof res.body.accessToken).toBe('string');
  });

  it('rejects duplicate email', async () => {
    const res = await request.post('/api/auth/register').send({
      username: `other_${Date.now()}`,
      email: testUser.email,
      password: 'TestPass1234',
    });
    expect(res.status).toBe(409);
    expect(res.body.error).toBe('Conflict');
  });

  it('rejects duplicate username', async () => {
    const res = await request.post('/api/auth/register').send({
      username: testUser.username,
      email: `other_${Date.now()}@forge.dev`,
      password: 'TestPass1234',
    });
    expect(res.status).toBe(409);
    expect(res.body.error).toBe('Conflict');
  });

  it('rejects weak password (no uppercase, too short)', async () => {
    const res = await request.post('/api/auth/register').send({
      username: `weak_${Date.now()}`,
      email: `weak_${Date.now()}@forge.dev`,
      password: 'short',
    });
    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Validation failed');
  });

  it('rejects invalid email format', async () => {
    const res = await request.post('/api/auth/register').send({
      username: `bademail_${Date.now()}`,
      email: 'not-an-email',
      password: 'TestPass1234',
    });
    expect(res.status).toBe(400);
    expect(res.body.details.email).toBeDefined();
  });
});

// ── POST /api/auth/login ─────────────────────────

describe('POST /api/auth/login', () => {
  it('logs in with correct credentials', async () => {
    const res = await request.post('/api/auth/login').send({
      email: testUser.email,
      password: testUser.password,
    });
    expect(res.status).toBe(200);
    expect(res.body.user).toBeDefined();
    expect(res.body.accessToken).toBeDefined();
    accessToken = res.body.accessToken;
  });

  it('returns 401 for wrong password', async () => {
    const res = await request.post('/api/auth/login').send({
      email: testUser.email,
      password: 'WrongPassword1',
    });
    expect(res.status).toBe(401);
  });

  it('returns 401 for non-existent email', async () => {
    const res = await request.post('/api/auth/login').send({
      email: 'nonexistent@forge.dev',
      password: 'TestPass1234',
    });
    expect(res.status).toBe(401);
  });

  it('sets httpOnly cookie on login', async () => {
    const res = await request.post('/api/auth/login').send({
      email: testUser.email,
      password: testUser.password,
    });
    const cookies = res.headers['set-cookie'];
    expect(cookies).toBeDefined();
    const refreshCookie = Array.isArray(cookies)
      ? cookies.find((c: string) => c.includes('refreshToken'))
      : cookies;
    expect(refreshCookie).toBeDefined();
    expect(refreshCookie).toContain('HttpOnly');
  });
});

// ── GET /api/auth/me ─────────────────────────────

describe('GET /api/auth/me', () => {
  it('returns user when authenticated', async () => {
    const res = await request.get('/api/auth/me').set('Authorization', `Bearer ${accessToken}`);
    expect(res.status).toBe(200);
    expect(res.body.user).toBeDefined();
    expect(res.body.user.email).toBe(testUser.email);
  });

  it('returns 401 when no token', async () => {
    const res = await request.get('/api/auth/me');
    expect(res.status).toBe(401);
  });

  it('returns 401 for expired/invalid token', async () => {
    const res = await request.get('/api/auth/me').set('Authorization', 'Bearer invalidtoken123');
    expect(res.status).toBe(401);
  });
});
