// ── Codeforces Problem Scraper ───────────────────

import * as cheerio from 'cheerio';

import { redis } from '../config/redis';

// ── Types ────────────────────────────────────────

export interface CFProblemData {
  title: string;
  timeLimit: number;
  memoryLimit: number;
  statement: string;
  inputSpec: string;
  outputSpec: string;
  noteSection: string;
  testCases: Array<{ input: string; output: string }>;
  contestId: string;
  index: string;
  url: string;
}

// ── Custom Errors ────────────────────────────────

export class CFError extends Error {
  constructor(
    public code: 'CF_NOT_FOUND' | 'CF_RATE_LIMITED' | 'CF_FETCH_FAILED',
    message: string,
  ) {
    super(message);
    this.name = 'CFError';
  }
}

// ── Scrape CF Problem ────────────────────────────

export async function scrapeCFProblem(contestId: string, index: string): Promise<CFProblemData> {
  // ── Cache Check ────────────────────────────────
  const cacheKey = `cf:problem:${contestId}:${index}`;
  try {
    const cached = await redis.get(cacheKey);
    if (cached) {
      return JSON.parse(cached) as CFProblemData;
    }
  } catch {
    // Redis unavailable — continue without cache
  }

  // ── Fetch HTML ─────────────────────────────────
  const url = `https://codeforces.com/problemset/problem/${contestId}/${index}`;

  let html: string;
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; ForgeIDE/1.0)',
        Accept: 'text/html,application/xhtml+xml',
        'Accept-Language': 'en-US,en;q=0.9',
      },
    });

    if (response.status === 404) {
      throw new CFError('CF_NOT_FOUND', `Problem ${contestId}${index} not found on Codeforces`);
    }
    if (response.status === 429) {
      throw new CFError('CF_RATE_LIMITED', 'Codeforces rate limit exceeded. Try again later.');
    }
    if (!response.ok) {
      throw new CFError('CF_FETCH_FAILED', `Failed to fetch from Codeforces (${response.status})`);
    }

    html = await response.text();
  } catch (err) {
    if (err instanceof CFError) throw err;
    throw new CFError(
      'CF_FETCH_FAILED',
      `Network error fetching Codeforces: ${(err as Error).message}`,
    );
  }

  // ── Parse with Cheerio ─────────────────────────
  const $ = cheerio.load(html);

  const title = $('.title')
    .first()
    .text()
    .trim()
    .replace(/^[A-Z]\.\s*/, '');

  // Parse time limit (e.g., "time limit per test2 seconds")
  const timeLimitText = $('.time-limit').text();
  const timeLimitMatch = timeLimitText.match(/(\d+(?:\.\d+)?)/);
  const timeLimit = timeLimitMatch ? Math.round(parseFloat(timeLimitMatch[1]) * 1000) : 2000;

  // Parse memory limit (e.g., "memory limit per test256 megabytes")
  const memoryLimitText = $('.memory-limit').text();
  const memoryLimitMatch = memoryLimitText.match(/(\d+)/);
  const memoryLimit = memoryLimitMatch ? parseInt(memoryLimitMatch[1]) : 256;

  // Parse statement sections
  const statement =
    $(
      '.problem-statement > div:not(.input-specification):not(.output-specification):not(.sample-tests):not(.note):not(.header)',
    ).html() || '';

  const inputSpec = $('.input-specification').html() || '';
  const outputSpec = $('.output-specification').html() || '';
  const noteSection = $('.note').html() || '';

  // ── Extract Test Cases ─────────────────────────
  const testCases: Array<{ input: string; output: string }> = [];

  // Strategy 1: Primary CF DOM (.sample-test)
  $('.sample-test').each((_: number, el: cheerio.Element) => {
    const inputPre = $(el).find('.input pre');
    const outputPre = $(el).find('.output pre');

    inputPre.each((i: number, inp: cheerio.Element) => {
      const outEl = outputPre.eq(i);

      // CF uses <br> tags for newlines inside pre
      $(inp).find('br').replaceWith('\n');
      if (outEl.length) $(outEl).find('br').replaceWith('\n');

      const inputText = $(inp).text().trim();
      const outputText = outEl.length ? outEl.text().trim() : '';

      if (inputText) {
        testCases.push({ input: inputText, output: outputText });
      }
    });
  });

  // Strategy 2: Fallback for alternate CF format (.input/.output pairs)
  if (testCases.length === 0) {
    const inputs = $('.input');
    const outputs = $('.output');

    inputs.each((i: number, inputEl: cheerio.Element) => {
      const outputEl = outputs.eq(i);
      const inp = $(inputEl).find('pre');
      const out = outputEl.length ? outputEl.find('pre') : null;

      inp.find('br').replaceWith('\n');
      if (out) out.find('br').replaceWith('\n');

      const inputText = inp.text().trim();
      const outputText = out ? out.text().trim() : '';

      if (inputText) {
        testCases.push({ input: inputText, output: outputText });
      }
    });
  }

  // Strategy 3: Newest CF format with .test-example-line
  if (testCases.length === 0) {
    let currentInput = '';
    let currentOutput = '';

    $('.test-example-line').each((_: number, el: cheerio.Element) => {
      const text = $(el).text();
      const parent = $(el).parent();

      if (parent.hasClass('input') || parent.closest('.input').length > 0) {
        currentInput += (currentInput ? '\n' : '') + text;
      } else if (parent.hasClass('output') || parent.closest('.output').length > 0) {
        currentOutput += (currentOutput ? '\n' : '') + text;
      }
    });

    if (currentInput) {
      testCases.push({ input: currentInput.trim(), output: currentOutput.trim() });
    }
  }

  const result: CFProblemData = {
    title,
    timeLimit,
    memoryLimit,
    statement,
    inputSpec,
    outputSpec,
    noteSection,
    testCases,
    contestId,
    index,
    url,
  };

  // ── Cache Result (1 hour) ──────────────────────
  try {
    await redis.setex(cacheKey, 3600, JSON.stringify(result));
  } catch {
    // Redis unavailable — skip caching
  }

  return result;
}
