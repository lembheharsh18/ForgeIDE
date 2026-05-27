'use client';

import { useQuery } from '@tanstack/react-query';
import { useSearchParams } from 'next/navigation';
import { useEffect } from 'react';

import api from '../lib/axios';
import { useEditorStore } from '../store/editorStore';
import type { Problem } from '../store/editorStore';

// ── Types ────────────────────────────────────────

interface CFProblemResponse {
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

// ── Hook ─────────────────────────────────────────

export function useCFProblem() {
  const searchParams = useSearchParams();
  const { setCurrentProblem } = useEditorStore();

  const cfContestId = searchParams?.get('cf') || null;
  const cfIndex = searchParams?.get('problem') || null;
  const enabled = !!(cfContestId && cfIndex);

  const query = useQuery<CFProblemResponse>({
    queryKey: ['cf-problem', cfContestId, cfIndex],
    queryFn: async () => {
      const { data } = await api.get('/api/cf/problem', {
        params: { contestId: cfContestId, index: cfIndex },
      });
      return data;
    },
    enabled,
    staleTime: 60 * 60 * 1000, // 1 hour
    retry: 1,
  });

  // Set current problem when CF data loads
  useEffect(() => {
    if (query.data && cfContestId && cfIndex) {
      const cfData = query.data;

      const problem: Problem = {
        id: `cf-${cfContestId}-${cfIndex}`,
        title: cfData.title,
        platform: 'CODEFORCES',
        difficulty: '0',
        tags: [],
        link: cfData.url,
        statement: cfData.statement,
        inputSpec: cfData.inputSpec,
        outputSpec: cfData.outputSpec,
        noteSection: cfData.noteSection,
        timeLimit: cfData.timeLimit,
        memoryLimit: cfData.memoryLimit,
        cfContestId,
        cfIndex: cfIndex.toUpperCase(),
        testCases: cfData.testCases,
        addedById: '',
      };

      setCurrentProblem(problem);
    }
  }, [query.data, cfContestId, cfIndex, setCurrentProblem]);

  return {
    cfData: query.data,
    isLoading: query.isLoading,
    error: query.error,
    cfContestId,
    cfIndex,
  };
}
