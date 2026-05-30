'use client';

import { useCallback, useRef, useState } from 'react';

import api from '../lib/axios';
import { useCFSettingsStore } from '../store/cfSettingsStore';

// ── Types ────────────────────────────────────────

interface CFSubmitState {
  submissionId: number | null;
  contestId: string | null;
  problemIndex: string | null;
  isSubmitting: boolean;
  isPolling: boolean;
  cfVerdict: string | null;
  forgeVerdict: string | null;
  passedTestCount: number;
  timeMs: number;
  error: string | null;
}

// ── Hook ─────────────────────────────────────────

export function useCFSubmit() {
  const { cfHandle, cfApiKey, cfApiSecret, isConfigured } = useCFSettingsStore();

  const [state, setState] = useState<CFSubmitState>({
    submissionId: null,
    contestId: null,
    problemIndex: null,
    isSubmitting: false,
    isPolling: false,
    cfVerdict: null,
    forgeVerdict: null,
    passedTestCount: 0,
    timeMs: 0,
    error: null,
  });

  const pollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pollStartRef = useRef<number>(0);

  // ── Poll Verdict ────────────────────────────────

  const pollVerdict = useCallback(
    (submissionId: number) => {
      pollStartRef.current = Date.now();

      pollIntervalRef.current = setInterval(async () => {
        // Timeout after 60 seconds
        if (Date.now() - pollStartRef.current > 60_000) {
          if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
          pollIntervalRef.current = null;
          setState((prev) => ({
            ...prev,
            isPolling: false,
            error: 'Verdict polling timed out after 60s',
          }));
          return;
        }

        try {
          const params = new URLSearchParams({
            cfHandle,
            cfApiKey,
            cfApiSecret,
          });

          const { data } = await api.get(`/api/cf/verdict/${submissionId}?${params.toString()}`);

          if (data.verdict !== 'PENDING') {
            if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
            pollIntervalRef.current = null;
            setState((prev) => ({
              ...prev,
              isPolling: false,
              cfVerdict: data.cfVerdict,
              forgeVerdict: data.verdict,
              passedTestCount: data.passedTestCount,
              timeMs: data.timeMs,
            }));
          }
        } catch {
          // Silently retry on network errors
        }
      }, 2000);
    },
    [cfHandle, cfApiKey, cfApiSecret],
  );

  // ── Submit to CF ────────────────────────────────

  const submitToCF = useCallback(
    async (code: string, language: string, contestId: string, problemIndex: string) => {
      if (!isConfigured) {
        setState((prev) => ({
          ...prev,
          error: 'CF credentials not configured. Go to profile settings.',
        }));
        return;
      }

      setState({
        submissionId: null,
        contestId,
        problemIndex,
        isSubmitting: true,
        isPolling: false,
        cfVerdict: null,
        forgeVerdict: null,
        passedTestCount: 0,
        timeMs: 0,
        error: null,
      });

      try {
        const { data } = await api.post('/api/cf/submit', {
          contestId,
          problemIndex,
          language,
          code,
          cfHandle,
          cfApiKey,
          cfApiSecret,
        });

        setState((prev) => ({
          ...prev,
          submissionId: data.submissionId,
          isSubmitting: false,
          isPolling: true,
        }));

        // Start polling
        pollVerdict(data.submissionId);
      } catch (err: unknown) {
        const message =
          (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
          'Failed to submit to Codeforces';
        setState((prev) => ({
          ...prev,
          isSubmitting: false,
          error: message,
        }));
      }
    },
    [isConfigured, cfHandle, cfApiKey, cfApiSecret, pollVerdict],
  );

  // ── Reset ───────────────────────────────────────

  const reset = useCallback(() => {
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }
    setState({
      submissionId: null,
      contestId: null,
      problemIndex: null,
      isSubmitting: false,
      isPolling: false,
      cfVerdict: null,
      forgeVerdict: null,
      passedTestCount: 0,
      timeMs: 0,
      error: null,
    });
  }, []);

  return {
    ...state,
    isConfigured,
    submitToCF,
    reset,
  };
}
