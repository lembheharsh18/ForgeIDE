// ── Code Execution Routes ────────────────────────

import { Router, type Request, type Response } from 'express';
import { z } from 'zod';

import { prisma } from '../config/db';
import { LANGUAGES, type Language } from '../config/languages';
import { executeLimiter } from '../middleware/rateLimiter';
import { requireAuth } from '../middleware/requireAuth';
import { scrapeCFProblem, CFError } from '../services/cfScraper';
import { processAcceptedSubmission } from '../services/leaderboard';
import { executeCode, computeVerdict, compareOutputs } from '../services/piston';

const router = Router();

// ── Schemas ──────────────────────────────────────

const executeSchema = z.object({
  code: z.string().min(1).max(50000),
  language: z.enum(['cpp', 'python', 'java', 'javascript', 'go'] as const),
  stdin: z.string().max(10000).default(''),
  problemId: z.string().optional(),
});

const runTestsSchema = z.object({
  code: z.string().min(1).max(50000),
  language: z.enum(['cpp', 'python', 'java', 'javascript', 'go'] as const),
  problemId: z.string().optional(),
  cfContestId: z.string().optional(),
  cfIndex: z.string().optional(),
});

// ── POST /api/execute ────────────────────────────

router.post('/', requireAuth, executeLimiter, async (req: Request, res: Response) => {
  try {
    const body = executeSchema.parse(req.body);
    const lang = LANGUAGES[body.language];

    const result = await executeCode({
      language: lang.pistonLanguage,
      version: lang.pistonVersion,
      files: [{ name: `main${lang.fileExtension}`, content: body.code }],
      stdin: body.stdin,
      run_timeout: 5000,
      compile_timeout: 10000,
    });

    const verdict = computeVerdict(result);

    // Save submission to DB if problemId provided
    if (body.problemId && req.user) {
      try {
        // Map verdict to DB-compatible string
        const dbVerdict =
          verdict === 'SUCCESS'
            ? 'ACCEPTED'
            : verdict === 'COMPILATION_ERROR'
              ? 'CE'
              : verdict === 'TIME_LIMIT_EXCEEDED'
                ? 'TLE'
                : verdict === 'RUNTIME_ERROR'
                  ? 'RE'
                  : 'PENDING';

        await prisma.submission.create({
          data: {
            userId: req.user.userId,
            problemId: body.problemId,
            language: body.language,
            code: body.code,
            verdict: dbVerdict,
            timeMs: null,
            memoryKb: null,
            errorMsg: result.run.stderr || result.compile?.stderr || null,
          },
        });

        // If accepted, update leaderboard
        if (verdict === 'SUCCESS') {
          await processAcceptedSubmission(req.user.userId, body.problemId);
        }
      } catch (dbErr) {
        // Log but don't fail the response
        console.error('[Execute] DB save error:', dbErr);
      }
    }

    res.json({
      stdout: result.run.stdout,
      stderr: result.run.stderr || result.compile?.stderr || '',
      exitCode: result.run.code,
      signal: result.run.signal,
      verdict:
        verdict === 'SUCCESS'
          ? 'ACCEPTED'
          : verdict === 'COMPILATION_ERROR'
            ? 'CE'
            : verdict === 'TIME_LIMIT_EXCEEDED'
              ? 'TLE'
              : verdict === 'RUNTIME_ERROR'
                ? 'RE'
                : verdict,
      compileError: result.compile?.stderr || null,
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ error: 'Validation error', details: err.errors });
      return;
    }
    console.error('[Execute] Error:', err);
    res.status(500).json({
      error: 'Execution failed',
      message: (err as Error).message,
    });
  }
});

// ── POST /api/execute/run-tests ──────────────────

const testResultLimiter = executeLimiter; // Same 10/min limiter

router.post('/run-tests', requireAuth, testResultLimiter, async (req: Request, res: Response) => {
  try {
    const body = runTestsSchema.parse(req.body);
    const lang = LANGUAGES[body.language as Language];

    if (!lang) {
      res.status(400).json({ error: 'Unsupported language' });
      return;
    }

    // ── Get Test Cases ─────────────────────────────
    let testCases: Array<{ input: string; output: string }> = [];

    if (body.cfContestId && body.cfIndex) {
      // Scrape from Codeforces
      const cfData = await scrapeCFProblem(body.cfContestId, body.cfIndex);
      testCases = cfData.testCases;
    } else if (body.problemId) {
      // Fetch from DB
      const problem = await prisma.problem.findUnique({
        where: { id: body.problemId },
      });
      if (problem?.testCases) {
        testCases = problem.testCases as Array<{ input: string; output: string }>;
      }
    }

    if (testCases.length === 0) {
      res.status(400).json({ error: 'No test cases available' });
      return;
    }

    // ── Run Each Test Case ─────────────────────────
    interface TestResult {
      testNumber: number;
      input: string;
      expectedOutput: string;
      actualOutput: string;
      passed: boolean;
      verdict: string;
      stderr: string;
      compileError: string | null;
    }

    const results: TestResult[] = [];

    for (let i = 0; i < testCases.length; i++) {
      const tc = testCases[i];

      try {
        const execResult = await executeCode({
          language: lang.pistonLanguage,
          version: lang.pistonVersion,
          files: [{ name: `main${lang.fileExtension}`, content: body.code }],
          stdin: tc.input,
          run_timeout: 5000,
          compile_timeout: 10000,
        });

        const verdict = computeVerdict(execResult);
        const actualOutput = execResult.run.stdout;

        let testVerdict: string;
        let passed = false;

        if (verdict === 'COMPILATION_ERROR') {
          testVerdict = 'CE';
        } else if (verdict === 'TIME_LIMIT_EXCEEDED') {
          testVerdict = 'TLE';
        } else if (verdict === 'RUNTIME_ERROR') {
          testVerdict = 'RE';
        } else {
          // Check if output matches expected
          passed = compareOutputs(actualOutput, tc.output);
          testVerdict = passed ? 'AC' : 'WA';
        }

        results.push({
          testNumber: i + 1,
          input: tc.input,
          expectedOutput: tc.output,
          actualOutput,
          passed,
          verdict: testVerdict,
          stderr: execResult.run.stderr || '',
          compileError: execResult.compile?.stderr || null,
        });

        // If CE, skip remaining tests (same code won't compile)
        if (testVerdict === 'CE') {
          for (let j = i + 1; j < testCases.length; j++) {
            results.push({
              testNumber: j + 1,
              input: testCases[j].input,
              expectedOutput: testCases[j].output,
              actualOutput: '',
              passed: false,
              verdict: 'CE',
              stderr: execResult.run.stderr || '',
              compileError: execResult.compile?.stderr || null,
            });
          }
          break;
        }
      } catch (execErr) {
        results.push({
          testNumber: i + 1,
          input: tc.input,
          expectedOutput: tc.output,
          actualOutput: '',
          passed: false,
          verdict: 'RE',
          stderr: (execErr as Error).message,
          compileError: null,
        });
      }
    }

    // ── Build Summary ──────────────────────────────
    const total = results.length;
    const passed = results.filter((r) => r.passed).length;
    const failed = total - passed;

    let overallVerdict: string;
    if (results.some((r) => r.verdict === 'CE')) {
      overallVerdict = 'CE';
    } else if (results.some((r) => r.verdict === 'RE')) {
      overallVerdict = 'RE';
    } else if (results.some((r) => r.verdict === 'TLE')) {
      overallVerdict = 'TLE';
    } else if (results.some((r) => r.verdict === 'WA')) {
      overallVerdict = 'WA';
    } else {
      overallVerdict = 'AC';
    }

    res.json({
      results,
      summary: { total, passed, failed, overallVerdict },
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ error: 'Validation error', details: err.errors });
      return;
    }
    if (err instanceof CFError) {
      const statusMap = { CF_NOT_FOUND: 404, CF_RATE_LIMITED: 429, CF_FETCH_FAILED: 500 };
      res.status(statusMap[err.code] || 500).json({
        error: err.code,
        message: err.message,
      });
      return;
    }
    console.error('[RunTests] Error:', err);
    res.status(500).json({
      error: 'Test execution failed',
      message: (err as Error).message,
    });
  }
});

// ── GET /api/execute/languages ───────────────────

router.get('/languages', (_req: Request, res: Response) => {
  const languages = Object.entries(LANGUAGES).map(([key, config]) => ({
    key,
    display: config.display,
    fileExtension: config.fileExtension,
  }));

  res.json({ languages });
});

export default router;
