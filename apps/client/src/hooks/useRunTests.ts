'use client';

import { useMutation } from '@tanstack/react-query';
import { useCallback } from 'react';
import toast from 'react-hot-toast';

import api from '../lib/axios';
import { useEditorStore } from '../store/editorStore';
import type { TestResult, Verdict } from '../store/editorStore';

// ── Types ────────────────────────────────────────

interface RunTestsRequest {
  code: string;
  language: string;
  problemId?: string;
  cfContestId?: string;
  cfIndex?: string;
}

interface ApiTestResult {
  testNumber: number;
  input: string;
  expectedOutput: string;
  actualOutput: string;
  passed: boolean;
  verdict: string;
  stderr: string;
  compileError: string | null;
}

interface RunTestsResponse {
  results: ApiTestResult[];
  summary: {
    total: number;
    passed: number;
    failed: number;
    overallVerdict: string;
  };
}

// ── Map verdict ──────────────────────────────────

function mapVerdict(v: string): Verdict {
  switch (v) {
    case 'AC':
      return 'ACCEPTED';
    case 'WA':
      return 'WRONG_ANSWER';
    case 'TLE':
      return 'TIME_LIMIT_EXCEEDED';
    case 'RE':
      return 'RUNTIME_ERROR';
    case 'CE':
      return 'COMPILATION_ERROR';
    default:
      return 'PENDING';
  }
}

// ── Hook ─────────────────────────────────────────

export function useRunTests() {
  const { setTestResults, setRunningTests, setActiveTab } = useEditorStore();

  const mutation = useMutation({
    mutationFn: async (req: RunTestsRequest): Promise<RunTestsResponse> => {
      const { data } = await api.post('/api/execute/run-tests', req);
      return data;
    },
    onMutate: () => {
      setRunningTests(true);
      setTestResults(null);
      setActiveTab('testcases');
    },
    onSuccess: (data) => {
      // Map API results to store format
      const results: TestResult[] = data.results.map((r) => ({
        index: r.testNumber,
        input: r.input,
        expected: r.expectedOutput,
        actual: r.actualOutput,
        verdict: mapVerdict(r.verdict),
      }));

      setTestResults(results);
      setRunningTests(false);

      const s = data.summary;
      if (s.overallVerdict === 'AC') {
        toast.success(`All ${s.total} tests passed!`);
      } else {
        toast.error(`${s.passed}/${s.total} tests passed — ${s.overallVerdict}`);
      }
    },
    onError: (error: Error) => {
      setRunningTests(false);
      toast.error(`Test run failed: ${error.message}`);
    },
  });

  const runTests = useCallback(
    (req: RunTestsRequest) => {
      mutation.mutate(req);
    },
    [mutation],
  );

  return {
    runTests,
    isRunning: mutation.isPending,
  };
}
