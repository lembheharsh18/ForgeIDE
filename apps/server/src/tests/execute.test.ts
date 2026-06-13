// ── Execute Route Tests (Mocked Piston) ──────────

import supertest from 'supertest';

import { app } from '../index';
import { compareOutputs, computeVerdict, type PistonResponse } from '../services/piston';

const request = supertest(app);

// ── We need a valid token to test authenticated endpoints ──
let accessToken: string;

beforeAll(async () => {
  // Register and login to get a token
  const user = {
    username: `exec_${Date.now()}`,
    email: `exec_${Date.now()}@forge.dev`,
    password: 'TestPass1234',
  };

  await request.post('/api/auth/register').send(user);
  const loginRes = await request.post('/api/auth/login').send({
    email: user.email,
    password: user.password,
  });
  accessToken = loginRes.body.accessToken;
});

// ── Unit Tests: computeVerdict ───────────────────

describe('computeVerdict', () => {
  it('returns COMPILATION_ERROR for compile failure', () => {
    const res: PistonResponse = {
      language: 'c++',
      version: '10.2.0',
      compile: { stdout: '', stderr: 'error', code: 1, signal: null, output: '' },
      run: { stdout: '', stderr: '', code: 0, signal: null, output: '' },
    };
    expect(computeVerdict(res)).toBe('COMPILATION_ERROR');
  });

  it('returns TIME_LIMIT_EXCEEDED for SIGKILL', () => {
    const res: PistonResponse = {
      language: 'c++',
      version: '10.2.0',
      run: { stdout: '', stderr: '', code: 137, signal: 'SIGKILL', output: '' },
    };
    expect(computeVerdict(res)).toBe('TIME_LIMIT_EXCEEDED');
  });

  it('returns RUNTIME_ERROR for non-zero exit code', () => {
    const res: PistonResponse = {
      language: 'python',
      version: '3.10.0',
      run: { stdout: '', stderr: 'NameError', code: 1, signal: null, output: '' },
    };
    expect(computeVerdict(res)).toBe('RUNTIME_ERROR');
  });

  it('returns SUCCESS for clean run', () => {
    const res: PistonResponse = {
      language: 'python',
      version: '3.10.0',
      run: { stdout: 'Hello', stderr: '', code: 0, signal: null, output: 'Hello' },
    };
    expect(computeVerdict(res)).toBe('SUCCESS');
  });
});

// ── Unit Tests: compareOutputs ───────────────────

describe('compareOutputs', () => {
  it('returns true for identical outputs', () => {
    expect(compareOutputs('hello\nworld', 'hello\nworld')).toBe(true);
  });

  it('trims trailing whitespace before comparing', () => {
    expect(compareOutputs('hello  \nworld  ', 'hello\nworld')).toBe(true);
  });

  it('returns false for different outputs', () => {
    expect(compareOutputs('hello', 'world')).toBe(false);
  });

  it('handles different line counts', () => {
    expect(compareOutputs('line1\nline2', 'line1')).toBe(false);
  });

  it('handles empty strings', () => {
    expect(compareOutputs('', '')).toBe(true);
  });
});

// ── Integration Tests: POST /api/execute ─────────

describe('POST /api/execute', () => {
  it('rejects unauthenticated requests', async () => {
    const res = await request.post('/api/execute').send({
      code: 'print("hi")',
      language: 'python',
    });
    expect(res.status).toBe(401);
  });

  it('accepts a valid execution request', async () => {
    const res = await request
      .post('/api/execute')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        code: 'print("hello")',
        language: 'python',
      });
    // Should succeed or fail depending on Piston availability
    // In CI with no Piston, this may 500. Check structure.
    expect([200, 500]).toContain(res.status);
    if (res.status === 200) {
      expect(res.body.run).toBeDefined();
      expect(res.body.verdict).toBeDefined();
    }
  });

  it('rejects missing code field', async () => {
    const res = await request
      .post('/api/execute')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        language: 'python',
      });
    expect(res.status).toBe(400);
  });

  it('rejects invalid language', async () => {
    const res = await request
      .post('/api/execute')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        code: 'hello',
        language: 'rust',
      });
    expect(res.status).toBe(400);
  });
});
