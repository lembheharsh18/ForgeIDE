import axios from 'axios';
import * as cheerio from 'cheerio';

let redis: any = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const mod = require('../config/redis');
  redis = mod.redis;
} catch {
  // Redis not available
}

export interface DailyProblem {
  platform: 'LEETCODE' | 'GFG';
  title: string;
  link: string;
  difficulty?: string;
  available: boolean;
}

// ── LEETCODE DAILY ───────────────────────────────

export async function fetchLeetCodeDaily(): Promise<DailyProblem> {
  const fallback: DailyProblem = {
    platform: 'LEETCODE',
    title: 'LeetCode Daily',
    link: 'https://leetcode.com/problemset/all/',
    available: false,
  };

  try {
    const query = `
      query questionOfToday {
        activeDailyCodingChallengeQuestion {
          date
          link
          question {
            title
            titleSlug
            difficulty
          }
        }
      }
    `;

    const { data } = await axios.post(
      'https://leetcode.com/graphql',
      {
        query,
      },
      {
        headers: { 'Content-Type': 'application/json' },
        timeout: 5000,
      },
    );

    const activeQuestion = data?.data?.activeDailyCodingChallengeQuestion;

    if (activeQuestion && activeQuestion.question) {
      return {
        platform: 'LEETCODE',
        title: activeQuestion.question.title,
        link: `https://leetcode.com${activeQuestion.link}`,
        difficulty: activeQuestion.question.difficulty,
        available: true,
      };
    }
  } catch (err) {
    console.error(
      '[DailyProblems] LeetCode fetch error:',
      err instanceof Error ? err.message : String(err),
    );
  }

  return fallback;
}

// ── GFG POTD ─────────────────────────────────────

export async function fetchGFGPOTD(): Promise<DailyProblem> {
  const fallback: DailyProblem = {
    platform: 'GFG',
    title: 'GFG Problem of the Day',
    link: 'https://www.geeksforgeeks.org/problem-of-the-day',
    available: false,
  };

  try {
    // Try the GFG API endpoint first
    const { data } = await axios.get(
      'https://practice.geeksforgeeks.org/api/vr/problems-of-day/problem/today/',
      {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        },
        timeout: 5000,
      },
    );

    if (data?.problem_name && data?.problem_url) {
      return {
        platform: 'GFG',
        title: data.problem_name,
        link: data.problem_url.startsWith('http')
          ? data.problem_url
          : `https://www.geeksforgeeks.org${data.problem_url}`,
        difficulty: data.difficulty,
        available: true,
      };
    }
  } catch {
    // API endpoint failed, try scraping
    try {
      const { data } = await axios.get('https://www.geeksforgeeks.org/problem-of-the-day', {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        },
        timeout: 5000,
      });

      const $ = cheerio.load(data);
      const problemLinkElement = $('a[href*="/problems/"]').first();
      const link = problemLinkElement.attr('href');
      const title = problemLinkElement.text().trim() || 'Problem of the Day';

      if (link) {
        return {
          platform: 'GFG',
          title,
          link: link.startsWith('http') ? link : `https://www.geeksforgeeks.org${link}`,
          available: true,
        };
      }
    } catch (err) {
      console.error(
        '[DailyProblems] GFG scrape error:',
        err instanceof Error ? err.message : String(err),
      );
    }
  }

  return fallback;
}

// ── GET WITH REDIS CACHE ─────────────────────────

export async function getDailyProblems(): Promise<DailyProblem[]> {
  const CACHE_KEY = 'daily_problems';

  // Try Redis cache first (gracefully skip if unavailable)
  if (redis) {
    try {
      const cached = await redis.get(CACHE_KEY);
      if (cached) {
        return JSON.parse(cached) as DailyProblem[];
      }
    } catch (err) {
      console.error(
        '[DailyProblems] Redis get error:',
        err instanceof Error ? err.message : String(err),
      );
    }
  }

  const [lc, gfg] = await Promise.all([fetchLeetCodeDaily(), fetchGFGPOTD()]);

  const problems = [lc, gfg];

  // Cache only if Redis is available
  if (redis) {
    try {
      const secondsIn12Hours = 12 * 60 * 60;
      await redis.set(CACHE_KEY, JSON.stringify(problems), 'EX', secondsIn12Hours);
    } catch (err) {
      console.error(
        '[DailyProblems] Redis set error:',
        err instanceof Error ? err.message : String(err),
      );
    }
  }

  return problems;
}
