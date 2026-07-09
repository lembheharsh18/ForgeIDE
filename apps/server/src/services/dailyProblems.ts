import axios from 'axios';
import * as cheerio from 'cheerio';
import { redis } from '../config/redis';

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

    const { data } = await axios.post('https://leetcode.com/graphql', {
      query,
    }, {
      headers: { 'Content-Type': 'application/json' },
      timeout: 5000,
    });

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
    console.error('[DailyProblems] LeetCode fetch error:', err instanceof Error ? err.message : String(err));
  }

  return fallback;
}

// ── GFG POTD ─────────────────────────────────────

export async function fetchGFGPOTD(): Promise<DailyProblem> {
  const fallback: DailyProblem = {
    platform: 'GFG',
    title: 'GFG Problem of the Day',
    link: 'https://practice.geeksforgeeks.org/problem-of-the-day',
    available: false,
  };

  try {
    const { data } = await axios.get('https://practice.geeksforgeeks.org/problem-of-the-day', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      },
      timeout: 5000,
    });

    const $ = cheerio.load(data);
    
    // Scrape logic: GFG frequently changes their layout, but typically there's a link to the problem
    const problemLinkElement = $('a[href*="/problems/"]').first();
    const link = problemLinkElement.attr('href');
    const title = problemLinkElement.text().trim() || 'Problem of the Day';

    if (link) {
      return {
        platform: 'GFG',
        title,
        link: link.startsWith('http') ? link : `https://practice.geeksforgeeks.org${link}`,
        available: true,
      };
    }
  } catch (err) {
    console.error('[DailyProblems] GFG fetch error:', err instanceof Error ? err.message : String(err));
  }

  return fallback;
}

// ── GET WITH REDIS CACHE ─────────────────────────

export async function getDailyProblems(): Promise<DailyProblem[]> {
  const CACHE_KEY = 'daily_problems';
  
  try {
    const cached = await redis.get(CACHE_KEY);
    if (cached) {
      return JSON.parse(cached) as DailyProblem[];
    }
  } catch (err) {
    console.error('[DailyProblems] Redis get error:', err);
  }

  const [lc, gfg] = await Promise.all([
    fetchLeetCodeDaily(),
    fetchGFGPOTD(),
  ]);

  const problems = [lc, gfg];

  try {
    // Cache until end of day UTC or just for 12 hours
    const secondsIn12Hours = 12 * 60 * 60;
    await redis.set(CACHE_KEY, JSON.stringify(problems), 'EX', secondsIn12Hours);
  } catch (err) {
    console.error('[DailyProblems] Redis set error:', err);
  }

  return problems;
}
