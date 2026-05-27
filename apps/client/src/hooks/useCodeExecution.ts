'use client';

import { useMutation } from '@tanstack/react-query';
import { useCallback } from 'react';
import toast from 'react-hot-toast';

import api from '../lib/axios';
import { useEditorStore } from '../store/editorStore';
import type { Verdict } from '../store/editorStore';

// ── Types ────────────────────────────────────────

interface ExecuteRequest {
  code: string;
  language: string;
  stdin: string;
  problemId?: string;
}

interface ExecuteResponse {
  stdout: string;
  stderr: string;
  exitCode: number;
  signal: string | null;
  verdict: string;
  compileError: string | null;
}

// ── Map API verdict to store verdict ─────────────

function mapVerdict(apiVerdict: string): Verdict {
  switch (apiVerdict) {
    case 'ACCEPTED':
    case 'AC':
      return 'ACCEPTED';
    case 'WA':
    case 'WRONG_ANSWER':
      return 'WRONG_ANSWER';
    case 'TLE':
    case 'TIME_LIMIT_EXCEEDED':
      return 'TIME_LIMIT_EXCEEDED';
    case 'RE':
    case 'RUNTIME_ERROR':
      return 'RUNTIME_ERROR';
    case 'CE':
    case 'COMPILATION_ERROR':
      return 'COMPILATION_ERROR';
    default:
      return 'PENDING';
  }
}

// ── Hook ─────────────────────────────────────────

export function useCodeExecution() {
  const { setOutput, setVerdict, setRunning } = useEditorStore();

  const mutation = useMutation({
    mutationFn: async (req: ExecuteRequest): Promise<ExecuteResponse> => {
      const { data } = await api.post('/api/execute', req);
      return data;
    },
    onMutate: () => {
      setRunning(true);
      setVerdict('PENDING');
      setOutput('', '');
    },
    onSuccess: (data) => {
      setOutput(data.stdout, data.stderr);
      setVerdict(mapVerdict(data.verdict));
      setRunning(false);

      // Show toast for verdict
      const v = mapVerdict(data.verdict);
      if (v === 'ACCEPTED') {
        toast.success('Accepted!');
      } else if (v === 'COMPILATION_ERROR') {
        toast.error('Compilation Error');
      } else if (v === 'TIME_LIMIT_EXCEEDED') {
        toast.error('Time Limit Exceeded');
      } else if (v === 'RUNTIME_ERROR') {
        toast.error('Runtime Error');
      }
    },
    onError: (error: Error) => {
      setRunning(false);
      setVerdict(null);
      setOutput('', error.message);
      toast.error(`Execution failed: ${error.message}`);
    },
  });

  const execute = useCallback(
    (req: ExecuteRequest) => {
      mutation.mutate(req);
    },
    [mutation],
  );

  return {
    execute,
    isRunning: mutation.isPending,
  };
}
