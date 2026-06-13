// ── CF Scraper Tests (Mocked Fetch) ──────────────

import { scrapeCFProblem, CFError } from '../services/cfScraper';

// Mock redis to prevent connection attempts during tests
jest.mock('../config/redis', () => ({
  redis: {
    get: jest.fn().mockResolvedValue(null),
    setex: jest.fn().mockResolvedValue('OK'),
    on: jest.fn(),
  },
}));

// ── Sample CF HTML ───────────────────────────────

const SAMPLE_CF_HTML = `
<html>
<head><title>A - Theatre Square</title></head>
<body>
<div class="problem-statement">
  <div class="header">
    <div class="title">A. Theatre Square</div>
    <div class="time-limit"><div class="property-title">time limit per test</div>1 second</div>
    <div class="memory-limit"><div class="property-title">memory limit per test</div>256 megabytes</div>
  </div>
  <div class="input-specification"><div class="section-title">Input</div><p>The input contains three positive integers n, m, a.</p></div>
  <div class="output-specification"><div class="section-title">Output</div><p>Write number of flagstones.</p></div>
  <div class="sample-tests">
    <div class="sample-test">
      <div class="input"><div class="title">Input</div><pre>6 6 4</pre></div>
      <div class="output"><div class="title">Output</div><pre>4</pre></div>
    </div>
  </div>
  <div class="note"><div class="section-title">Note</div><p>Some note here</p></div>
</div>
</body>
</html>
`;

// ── Mock global fetch ────────────────────────────

const originalFetch = global.fetch;

afterAll(() => {
  global.fetch = originalFetch;
});

// ── Tests ────────────────────────────────────────

describe('scrapeCFProblem', () => {
  beforeEach(() => {
    // Clear any cached values — we mock redis.get to return null
    jest.resetModules();
  });

  it('extracts title correctly', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      text: async () => SAMPLE_CF_HTML,
    }) as jest.Mock;

    // Mock redis to skip cache
    jest.doMock('../config/redis', () => ({
      redis: {
        get: jest.fn().mockResolvedValue(null),
        setex: jest.fn().mockResolvedValue('OK'),
      },
    }));

    const result = await scrapeCFProblem('1', 'A');
    expect(result.title).toContain('Theatre Square');
  });

  it('extracts test cases', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      text: async () => SAMPLE_CF_HTML,
    }) as jest.Mock;

    const result = await scrapeCFProblem('1', 'A');
    expect(result.testCases).toBeDefined();
    expect(result.testCases.length).toBeGreaterThan(0);
    expect(result.testCases[0].input).toContain('6 6 4');
    expect(result.testCases[0].output).toContain('4');
  });

  it('extracts time limit', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      text: async () => SAMPLE_CF_HTML,
    }) as jest.Mock;

    const result = await scrapeCFProblem('1', 'A');
    expect(result.timeLimit).toBe(1);
  });

  it('extracts memory limit', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      text: async () => SAMPLE_CF_HTML,
    }) as jest.Mock;

    const result = await scrapeCFProblem('1', 'A');
    expect(result.memoryLimit).toBe(256);
  });

  it('throws CF_NOT_FOUND on 404 response', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 404,
      text: async () => 'Not Found',
    }) as jest.Mock;

    await expect(scrapeCFProblem('99999', 'Z')).rejects.toThrow(CFError);
  });

  it('returns empty testCases if none found in DOM', async () => {
    const noTestsHTML = `
    <html><body>
    <div class="problem-statement">
      <div class="header">
        <div class="title">B. No Tests</div>
        <div class="time-limit"><div class="property-title">time limit per test</div>2 seconds</div>
        <div class="memory-limit"><div class="property-title">memory limit per test</div>512 megabytes</div>
      </div>
    </div>
    </body></html>`;

    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      text: async () => noTestsHTML,
    }) as jest.Mock;

    const result = await scrapeCFProblem('1', 'B');
    expect(result.testCases).toBeDefined();
    expect(Array.isArray(result.testCases)).toBe(true);
  });
});
