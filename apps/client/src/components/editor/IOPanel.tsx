'use client';

import { motion } from 'framer-motion';
import { useEffect, useState, useCallback } from 'react';

import { useCFSubmit } from '../../hooks/useCFSubmit';
import { useLiveContest } from '../../hooks/useLiveContest';
import { useRunTests } from '../../hooks/useRunTests';
import api from '../../lib/axios';
import { useCFSettingsStore } from '../../store/cfSettingsStore';
import type { Verdict } from '../../store/editorStore';
import { useEditorStore } from '../../store/editorStore';
import { CFSettingsModal } from '../ui/CFSettingsModal';

// ── Verdict Badge ────────────────────────────────

function VerdictBadge({ verdict }: { verdict: Verdict }) {
  if (!verdict) return null;

  const colors: Record<string, { text: string; border: string }> = {
    ACCEPTED: { text: 'var(--green)', border: 'var(--green)' },
    WRONG_ANSWER: { text: 'var(--red)', border: 'var(--red)' },
    TIME_LIMIT_EXCEEDED: { text: 'var(--orange)', border: 'var(--orange)' },
    COMPILATION_ERROR: { text: 'var(--red)', border: 'var(--red)' },
    RUNTIME_ERROR: { text: 'var(--red)', border: 'var(--red)' },
    PENDING: { text: 'var(--text-muted)', border: 'var(--border-default)' },
  };

  const c = colors[verdict] || colors.PENDING;
  const labels: Record<string, string> = {
    ACCEPTED: 'AC',
    WRONG_ANSWER: 'WA',
    TIME_LIMIT_EXCEEDED: 'TLE',
    COMPILATION_ERROR: 'CE',
    RUNTIME_ERROR: 'RE',
    PENDING: '...',
  };

  return (
    <span
      className="text-[9px] px-1.5 py-0.5 rounded"
      style={{
        fontFamily: "'Space Mono', monospace",
        color: c.text,
        border: `1px solid ${c.border}`,
      }}
    >
      {verdict === 'PENDING' ? (
        <motion.span
          animate={{ opacity: [0.3, 1, 0.3] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        >
          ●●●
        </motion.span>
      ) : (
        labels[verdict] || verdict
      )}
    </span>
  );
}

// ── IO Panel ─────────────────────────────────────

export function IOPanel() {
  const {
    activeTab,
    setActiveTab,
    stdin,
    setStdin,
    stdout,
    stderr,
    verdict,
    isRunning,
    isRunningTests,
    testResults,
    currentProblem,
    executionTimeMs,
    executionMemoryKb,
  } = useEditorStore();

  const [copied, setCopied] = useState(false);
  const [showCFSettings, setShowCFSettings] = useState(false);
  const { contest } = useLiveContest();

  // Reverse Coding Try Input
  const [tryInputVal, setTryInputVal] = useState('');
  const [tryOutputVal, setTryOutputVal] = useState('');
  const [tryInputLoading, setTryInputLoading] = useState(false);
  const [queriesLeft, setQueriesLeft] = useState<number | null>(null);

  // CF Submit Integration
  const cfSubmit = useCFSubmit();
  const { loadFromStorage, isConfigured: cfConfigured } = useCFSettingsStore();

  useEffect(() => {
    loadFromStorage();
  }, [loadFromStorage]);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(stdout);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // fallback
    }
  }, [stdout]);

  const { runTests } = useRunTests();

  const handleRunAllTests = () => {
    const { code, language, currentProblem } = useEditorStore.getState();
    runTests({
      code,
      language,
      problemId: currentProblem?.id,
      cfContestId: currentProblem?.cfContestId || undefined,
      cfIndex: currentProblem?.cfIndex || undefined,
    });
  };

  const testCases = currentProblem?.testCases || [];

  const handleTryInput = async () => {
    if (!currentProblem?.id || !tryInputVal) return;
    setTryInputLoading(true);
    try {
      const { data } = await api.post('/api/reverse-code/try-input', {
        problemId: currentProblem.id,
        input: tryInputVal,
      });
      setTryOutputVal(data.output);
      setQueriesLeft(data.queriesRemaining);
    } catch (err: any) {
      setTryOutputVal(err.response?.data?.message || 'Error occurred while executing reference solution.');
    } finally {
      setTryInputLoading(false);
    }
  };

  const tabs = ['custom', 'testcases'] as const;
  const allTabs = contest?.type === 'REVERSE_CODING' ? [...tabs, 'tryinput' as const] : tabs;

  return (
    <div
      className="flex flex-col h-full overflow-hidden"
      style={{
        backgroundColor: 'var(--bg-surface)',
        borderTop: '1px solid var(--border-subtle)',
      }}
    >
      {/* Tab Bar */}
      <div
        className="flex items-center gap-0 shrink-0"
        style={{
          height: '32px',
          borderBottom: '1px solid var(--border-subtle)',
        }}
      >
        {allTabs.map((tab) => {
          const isActive = activeTab === tab;
          const label = tab === 'custom' ? 'CUSTOM INPUT' : tab === 'testcases' ? 'TEST CASES' : 'TRY INPUT';
          return (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className="px-4 h-full text-[10px] tracking-wider transition-all duration-150"
              style={{
                fontFamily: "'Space Mono', monospace",
                color: isActive ? 'var(--text-primary)' : 'var(--text-muted)',
                borderBottom: isActive ? '2px solid var(--accent)' : '2px solid transparent',
                fontWeight: isActive ? 700 : 400,
              }}
              onMouseEnter={(e) => {
                if (!isActive) e.currentTarget.style.color = 'var(--text-secondary)';
              }}
              onMouseLeave={(e) => {
                if (!isActive) e.currentTarget.style.color = 'var(--text-muted)';
              }}
            >
              {label}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-hidden">
        {activeTab === 'custom' ? (
          /* ── Custom Input Tab ────────────── */
          <div className="flex h-full">
            {/* STDIN */}
            <div
              className="flex-1 flex flex-col"
              style={{
                borderRight: '1px solid var(--border-subtle)',
              }}
            >
              <div
                className="px-3 py-1.5 shrink-0"
                style={{ borderBottom: '1px solid var(--border-subtle)' }}
              >
                <span
                  className="text-[9px] tracking-[2px] uppercase"
                  style={{
                    fontFamily: "'Space Mono', monospace",
                    color: 'var(--text-muted)',
                  }}
                >
                  STDIN
                </span>
              </div>
              <textarea
                value={stdin}
                onChange={(e) => setStdin(e.target.value)}
                className="flex-1 w-full resize-none outline-none p-3"
                style={{
                  fontFamily: "'Space Mono', monospace",
                  fontSize: '12px',
                  lineHeight: '1.6',
                  backgroundColor: 'var(--bg-primary)',
                  color: 'var(--text-primary)',
                  border: 'none',
                }}
                placeholder="Enter input..."
                spellCheck={false}
              />
            </div>

            {/* STDOUT */}
            <div
              className="flex-1 flex flex-col"
              style={{
                borderRight: '1px solid var(--border-subtle)',
              }}
            >
              <div
                className="flex items-center justify-between px-3 py-1.5 shrink-0"
                style={{ borderBottom: '1px solid var(--border-subtle)' }}
              >
                <div className="flex items-center gap-2">
                  <span
                    className="text-[9px] tracking-[2px] uppercase"
                    style={{
                      fontFamily: "'Space Mono', monospace",
                      color: 'var(--text-muted)',
                    }}
                  >
                    STDOUT
                  </span>
                  {verdict && <VerdictBadge verdict={verdict} />}
                </div>
                <button
                  onClick={handleCopy}
                  className="text-[9px] px-1.5 py-0.5 rounded transition-all duration-150"
                  style={{
                    fontFamily: "'Space Mono', monospace",
                    color: copied ? 'var(--green)' : 'var(--text-muted)',
                    border: `1px solid ${copied ? 'var(--green)' : 'var(--border-default)'}`,
                  }}
                >
                  {copied ? '✓ COPIED' : 'COPY'}
                </button>
              </div>
              <div
                className="flex-1 overflow-auto p-3"
                style={{
                  fontFamily: "'Space Mono', monospace",
                  fontSize: '12px',
                  lineHeight: '1.6',
                  backgroundColor: 'var(--bg-primary)',
                  color: 'var(--text-primary)',
                  whiteSpace: 'pre-wrap',
                }}
              >
                {isRunning ? (
                  <motion.span
                    style={{ color: 'var(--text-muted)' }}
                    animate={{ opacity: [0.3, 1, 0.3] }}
                    transition={{ duration: 1.2, repeat: Infinity }}
                  >
                    Running...
                  </motion.span>
                ) : stderr ? (
                  <span style={{ color: 'var(--red)' }}>{stderr}</span>
                ) : (
                  stdout || (
                    <span style={{ color: 'var(--text-muted)' }}>Output will appear here...</span>
                  )
                )}
              </div>
            </div>

            {/* METRICS */}
            <div
              className="flex flex-col shrink-0"
              style={{
                width: '160px',
                backgroundColor: 'var(--bg-surface)',
              }}
            >
              <div
                className="px-3 py-1.5 shrink-0"
                style={{ borderBottom: '1px solid var(--border-subtle)' }}
              >
                <span
                  className="text-[9px] tracking-[2px] uppercase"
                  style={{
                    fontFamily: "'Space Mono', monospace",
                    color: 'var(--text-muted)',
                  }}
                >
                  METRICS
                </span>
              </div>
              <div className="flex-1 flex flex-col justify-center px-4 gap-4">
                {/* Time */}
                <div>
                  <span
                    className="text-[9px] tracking-wider block mb-1"
                    style={{
                      fontFamily: "'Space Mono', monospace",
                      color: 'var(--text-muted)',
                    }}
                  >
                    TIME
                  </span>
                  <span
                    className="text-lg font-bold"
                    style={{
                      fontFamily: "'Space Mono', monospace",
                      color: 'var(--text-primary)',
                    }}
                  >
                    {isRunning ? '—' : (executionTimeMs ?? '0')}
                    <span
                      className="text-xs font-normal ml-0.5"
                      style={{ color: 'var(--text-muted)' }}
                    >
                      ms
                    </span>
                  </span>
                </div>
                {/* Memory */}
                <div>
                  <span
                    className="text-[9px] tracking-wider block mb-1"
                    style={{
                      fontFamily: "'Space Mono', monospace",
                      color: 'var(--text-muted)',
                    }}
                  >
                    MEMORY
                  </span>
                  <span
                    className="text-lg font-bold"
                    style={{
                      fontFamily: "'Space Mono', monospace",
                      color: 'var(--text-primary)',
                    }}
                  >
                    {isRunning
                      ? '—'
                      : executionMemoryKb
                        ? Math.round(executionMemoryKb / 1024)
                        : '0'}
                    <span
                      className="text-xs font-normal ml-0.5"
                      style={{ color: 'var(--text-muted)' }}
                    >
                      MB
                    </span>
                  </span>
                </div>

                {/* Submit on CF */}
                {currentProblem?.platform === 'CODEFORCES' && (
                  <div className="flex flex-col gap-2">
                    {/* CF Submit Button */}
                    <button
                      onClick={() => {
                        if (!cfConfigured) {
                          setShowCFSettings(true);
                          return;
                        }
                        const { code, language, currentProblem: p } = useEditorStore.getState();
                        if (p?.cfContestId && p?.cfIndex) {
                          cfSubmit.submitToCF(code, language, p.cfContestId, p.cfIndex);
                        }
                      }}
                      disabled={cfSubmit.isSubmitting || cfSubmit.isPolling}
                      className="mt-2 py-1.5 rounded text-[10px] font-bold tracking-wider transition-all duration-200 disabled:opacity-50"
                      style={{
                        fontFamily: "'Space Mono', monospace",
                        color: 'var(--blue)',
                        border: '1px solid var(--blue)',
                      }}
                      title={
                        !cfConfigured ? 'Set CF credentials in profile' : 'Submit to Codeforces'
                      }
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = 'rgba(90, 158, 255, 0.1)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'transparent';
                      }}
                    >
                      {cfSubmit.isSubmitting
                        ? '⟳ SUBMITTING...'
                        : cfSubmit.isPolling
                          ? '⟳ CHECKING...'
                          : !cfConfigured
                            ? '⚙ SET CF CREDS'
                            : 'SUBMIT ON CF'}
                    </button>

                    {/* CF Verdict Display */}
                    {cfSubmit.forgeVerdict && (
                      <div
                        className="text-[10px] font-bold p-1.5 rounded text-center"
                        style={{
                          fontFamily: "'Space Mono', monospace",
                          color:
                            cfSubmit.forgeVerdict === 'AC'
                              ? 'var(--green)'
                              : cfSubmit.forgeVerdict === 'TLE'
                                ? 'var(--orange)'
                                : 'var(--red)',
                          border: `1px solid ${
                            cfSubmit.forgeVerdict === 'AC'
                              ? 'var(--green)'
                              : cfSubmit.forgeVerdict === 'TLE'
                                ? 'var(--orange)'
                                : 'var(--red)'
                          }`,
                        }}
                      >
                        {cfSubmit.forgeVerdict === 'AC'
                          ? '✓ ACCEPTED'
                          : cfSubmit.forgeVerdict === 'WA'
                            ? `✕ WA test ${cfSubmit.passedTestCount + 1}`
                            : cfSubmit.forgeVerdict === 'TLE'
                              ? '⏱ TLE'
                              : `✕ ${cfSubmit.cfVerdict}`}
                      </div>
                    )}

                    {/* View on CF link */}
                    {cfSubmit.submissionId && cfSubmit.contestId && (
                      <a
                        href={`https://codeforces.com/contest/${cfSubmit.contestId}/submission/${cfSubmit.submissionId}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[9px] text-center transition-colors"
                        style={{
                          fontFamily: "'Space Mono', monospace",
                          color: 'var(--blue)',
                        }}
                      >
                        VIEW ON CF ↗
                      </a>
                    )}

                    {/* CF Error */}
                    {cfSubmit.error && (
                      <p
                        className="text-[9px] leading-relaxed"
                        style={{
                          fontFamily: "'Space Mono', monospace",
                          color: 'var(--red)',
                        }}
                      >
                        {cfSubmit.error}
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          /* ── Test Cases Tab ──────────────── */
          <div className="h-full flex flex-col overflow-hidden">
            {/* Run All button */}
            <div className="px-3 py-2 shrink-0">
              <button
                onClick={handleRunAllTests}
                disabled={isRunningTests || testCases.length === 0}
                className="w-full py-1.5 rounded text-[11px] font-bold tracking-wider transition-all duration-200 disabled:opacity-50"
                style={{
                  fontFamily: "'Space Mono', monospace",
                  backgroundColor: 'var(--accent)',
                  color: '#0a0a0a',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.boxShadow = '0 0 15px rgba(232, 255, 90, 0.3)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                {isRunningTests ? '⟳ RUNNING TESTS...' : '▶ RUN ALL TESTS'}
              </button>
              {isRunningTests && testResults && (
                <p
                  className="text-[10px] text-center mt-1"
                  style={{
                    fontFamily: "'Space Mono', monospace",
                    color: 'var(--text-muted)',
                  }}
                >
                  Running test {testResults.filter((r) => r.verdict !== null).length}/
                  {testCases.length}...
                </p>
              )}
            </div>

            {/* Test case cards */}
            <div className="flex-1 overflow-y-auto px-3 pb-3 space-y-2">
              {testCases.length === 0 ? (
                <div
                  className="text-center py-6 text-[11px]"
                  style={{
                    fontFamily: "'Space Mono', monospace",
                    color: 'var(--text-muted)',
                  }}
                >
                  No test cases available
                </div>
              ) : (
                testCases.map((tc, i) => {
                  const result = testResults?.[i];
                  const borderColor =
                    result?.verdict === 'ACCEPTED'
                      ? 'var(--green)'
                      : result?.verdict === 'WRONG_ANSWER'
                        ? 'var(--red)'
                        : 'var(--border-subtle)';

                  return (
                    <div
                      key={i}
                      className="rounded overflow-hidden"
                      style={{
                        borderLeft: `2px solid ${borderColor}`,
                        border: `1px solid var(--border-subtle)`,
                        borderLeftWidth: '2px',
                        borderLeftColor: borderColor,
                        backgroundColor: 'var(--bg-elevated)',
                      }}
                    >
                      {/* Header */}
                      <div
                        className="flex items-center justify-between px-3 py-1.5"
                        style={{
                          borderBottom: '1px solid var(--border-subtle)',
                        }}
                      >
                        <span
                          className="text-[10px] font-bold"
                          style={{
                            fontFamily: "'Space Mono', monospace",
                            color: 'var(--text-secondary)',
                          }}
                        >
                          TEST #{i + 1}
                        </span>
                        {result?.verdict && <VerdictBadge verdict={result.verdict} />}
                      </div>

                      {/* Input / Expected */}
                      <div className="flex">
                        <div
                          className="flex-1 p-2"
                          style={{
                            borderRight: '1px solid var(--border-subtle)',
                          }}
                        >
                          <div
                            className="text-[9px] tracking-wider mb-1"
                            style={{
                              fontFamily: "'Space Mono', monospace",
                              color: 'var(--text-muted)',
                            }}
                          >
                            INPUT
                          </div>
                          <pre
                            className="text-[11px] whitespace-pre-wrap"
                            style={{
                              fontFamily: "'Space Mono', monospace",
                              color: 'var(--text-primary)',
                            }}
                          >
                            {tc.input}
                          </pre>
                        </div>
                        <div className="flex-1 p-2">
                          <div
                            className="text-[9px] tracking-wider mb-1"
                            style={{
                              fontFamily: "'Space Mono', monospace",
                              color: 'var(--text-muted)',
                            }}
                          >
                            EXPECTED
                          </div>
                          <pre
                            className="text-[11px] whitespace-pre-wrap"
                            style={{
                              fontFamily: "'Space Mono', monospace",
                              color: 'var(--text-primary)',
                            }}
                          >
                            {tc.output}
                          </pre>
                        </div>
                      </div>

                      {/* Your output (after run) */}
                      {result?.actual && (
                        <div
                          className="p-2"
                          style={{
                            borderTop: '1px solid var(--border-subtle)',
                            backgroundColor:
                              result.verdict === 'WRONG_ANSWER'
                                ? 'rgba(255, 69, 69, 0.05)'
                                : result.verdict === 'ACCEPTED'
                                  ? 'rgba(57, 255, 138, 0.05)'
                                  : 'transparent',
                          }}
                        >
                          <div
                            className="text-[9px] tracking-wider mb-1"
                            style={{
                              fontFamily: "'Space Mono', monospace",
                              color:
                                result.verdict === 'WRONG_ANSWER' ? 'var(--red)' : 'var(--green)',
                            }}
                          >
                            YOUR OUTPUT
                          </div>
                          <pre
                            className="text-[11px] whitespace-pre-wrap"
                            style={{
                              fontFamily: "'Space Mono', monospace",
                              color:
                                result.verdict === 'WRONG_ANSWER'
                                  ? 'var(--red)'
                                  : 'var(--text-primary)',
                            }}
                          >
                            {result.actual}
                          </pre>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        ) : (
          /* ── Try Input Tab ────────────────── */
          <div className="flex h-full">
            <div className="flex-1 flex flex-col" style={{ borderRight: '1px solid var(--border-subtle)' }}>
              <div className="px-3 py-1.5 shrink-0" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                <span className="text-[9px] tracking-[2px] uppercase text-text-muted font-mono">TEST INPUT</span>
              </div>
              <textarea
                value={tryInputVal}
                onChange={(e) => setTryInputVal(e.target.value)}
                className="flex-1 w-full resize-none outline-none p-3 bg-bg-primary text-text-primary border-none font-mono text-[12px] leading-[1.6]"
                placeholder="Enter input for the reference solution..."
                spellCheck={false}
              />
            </div>
            
            <div className="flex-1 flex flex-col" style={{ borderRight: '1px solid var(--border-subtle)' }}>
              <div className="flex items-center justify-between px-3 py-1.5 shrink-0" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                <span className="text-[9px] tracking-[2px] uppercase text-text-muted font-mono">REFERENCE OUTPUT</span>
              </div>
              <div className="flex-1 overflow-auto p-3 font-mono text-[12px] leading-[1.6] whitespace-pre-wrap bg-bg-primary text-text-primary">
                {tryInputLoading ? (
                  <motion.span animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 1.2, repeat: Infinity }} className="text-text-muted">
                    Running reference solution...
                  </motion.span>
                ) : (
                  tryOutputVal || <span className="text-text-muted">Output will appear here...</span>
                )}
              </div>
            </div>

            <div className="flex flex-col shrink-0 w-[160px] bg-bg-surface">
              <div className="px-3 py-1.5 shrink-0" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                <span className="text-[9px] tracking-[2px] uppercase text-text-muted font-mono">ACTIONS</span>
              </div>
              <div className="flex-1 flex flex-col px-4 pt-4 gap-4">
                {queriesLeft !== null && (
                  <div>
                    <span className="text-[9px] tracking-wider block mb-1 text-text-muted font-mono">QUERIES LEFT</span>
                    <span className="text-lg font-bold text-text-primary font-mono">{queriesLeft}</span>
                  </div>
                )}
                <button
                  onClick={handleTryInput}
                  disabled={tryInputLoading || !tryInputVal.trim()}
                  className="w-full py-1.5 rounded text-[11px] font-bold tracking-wider transition-all duration-200 disabled:opacity-50 bg-accent text-[#0a0a0a] font-mono mt-auto mb-4"
                  onMouseEnter={(e) => { e.currentTarget.style.boxShadow = '0 0 15px rgba(232, 255, 90, 0.3)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.boxShadow = 'none'; }}
                >
                  {tryInputLoading ? '⟳ RUNNING' : '▶ TRY INPUT'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
      {/* CF Settings Modal */}
      <CFSettingsModal isOpen={showCFSettings} onClose={() => setShowCFSettings(false)} />
    </div>
  );
}
