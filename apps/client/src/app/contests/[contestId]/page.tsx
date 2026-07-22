'use client';

import { AnimatePresence, motion } from 'framer-motion';
import Link from 'next/link';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useCallback, useEffect, useState } from 'react';
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';

import { CodeEditor } from '../../../components/editor/CodeEditor';
import { IOPanel } from '../../../components/editor/IOPanel';
import { ProblemPanel } from '../../../components/editor/ProblemPanel';
import { RCInteractor } from '../../../components/editor/RCInteractor';
import { ProtectedRoute } from '../../../components/layout/ProtectedRoute';
import { StatusBar } from '../../../components/layout/StatusBar';
import { Topbar } from '../../../components/layout/Topbar';
import { Badge } from '../../../components/ui/Badge';
import { Countdown } from '../../../components/ui/Countdown';
import type { Language } from '../../../config/languages';
import { LANGUAGES, LANGUAGE_KEYS } from '../../../config/languages';
import { useCodeExecution } from '../../../hooks/useCodeExecution';
import api from '../../../lib/axios';
import { useAuthStore } from '../../../store/authStore';
import { useEditorStore } from '../../../store/editorStore';
import type { Problem } from '../../../store/editorStore';

// ── Resize Handle ────────────────────────────────

function ResizeHandle({ direction = 'horizontal' }: { direction?: 'horizontal' | 'vertical' }) {
  const isHorizontal = direction === 'horizontal';
  return (
    <PanelResizeHandle
      className="group relative flex items-center justify-center"
      style={{
        width: isHorizontal ? '4px' : '100%',
        height: isHorizontal ? '100%' : '4px',
        backgroundColor: 'transparent',
        cursor: isHorizontal ? 'col-resize' : 'row-resize',
      }}
    >
      <div
        className="transition-all duration-150 group-hover:opacity-100 group-active:opacity-100 opacity-0"
        style={{
          position: 'absolute',
          [isHorizontal ? 'width' : 'height']: '2px',
          [isHorizontal ? 'height' : 'width']: '100%',
          backgroundColor: 'var(--accent)',
          opacity: 0,
        }}
      />
      <div
        className="transition-colors duration-150"
        style={{
          position: 'absolute',
          [isHorizontal ? 'width' : 'height']: '1px',
          [isHorizontal ? 'height' : 'width']: '100%',
          backgroundColor: 'var(--border-subtle)',
        }}
      />
    </PanelResizeHandle>
  );
}

// ── Contest Arena ────────────────────────────────

function ContestArenaContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user } = useAuthStore();

  const {
    language,
    setLanguage,
    theme,
    code,
    stdin,
    setCode,
    currentProblem,
    rcMode,
    setCurrentProblem,
  } = useEditorStore();
  const { execute } = useCodeExecution();

  const [contest, setContest] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const contestId = params?.contestId as string;
  const problemId = searchParams?.get('problem');

  // Load contest data
  useEffect(() => {
    if (!contestId) return;

    const fetchContest = async () => {
      try {
        setIsLoading(true);
        const res = await api.get(`/api/contests/${contestId}`);
        setContest(res.data);

        // Auto-select first problem if none selected
        if (res.data.problems && res.data.problems.length > 0) {
          const targetProblemId = problemId || res.data.problems[0].id;
          const prob =
            res.data.problems.find((p: any) => p.id === targetProblemId) || res.data.problems[0];
          setCurrentProblem(prob as Problem);
        }
      } catch (err: any) {
        setError(err.response?.data?.error || 'Failed to load contest');
      } finally {
        setIsLoading(false);
      }
    };
    fetchContest();
  }, [contestId, problemId, setCurrentProblem]);

  const handleRun = useCallback(() => {
    execute({
      code,
      language,
      stdin,
      problemId: currentProblem?.id,
      contestId, // Pass contest ID so the execution bypasses the global live contest gate
    } as any); // Using 'as any' to avoid type issues if useCodeExecution doesn't know about contestId yet
  }, [execute, code, language, stdin, currentProblem?.id, contestId]);

  const handleLayoutChange = useCallback((sizes: number[]) => {
    try {
      localStorage.setItem('forge_contest_main', JSON.stringify(sizes));
    } catch {
      // ignore
    }
  }, []);

  const handleCenterLayoutChange = useCallback((sizes: number[]) => {
    try {
      localStorage.setItem('forge_contest_center', JSON.stringify(sizes));
    } catch {
      // ignore
    }
  }, []);

  let mainSizes: number[] | undefined;
  let centerSizes: number[] | undefined;
  if (typeof window !== 'undefined') {
    try {
      const ms = localStorage.getItem('forge_contest_main');
      if (ms) mainSizes = JSON.parse(ms);
      const cs = localStorage.getItem('forge_contest_center');
      if (cs) centerSizes = JSON.parse(cs);
    } catch {
      // ignore
    }
  }

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-bg-primary text-text-primary font-mono text-sm">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 rounded-full border-2 border-border-subtle border-t-accent animate-spin" />
          Loading Arena...
        </div>
      </div>
    );
  }

  if (error || !contest) {
    return (
      <div className="flex flex-col h-screen bg-bg-primary text-text-primary">
        <Topbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center p-8 bg-bg-surface border border-red-500/30 rounded-lg max-w-md">
            <h2 className="text-red-500 font-bold mb-2">Error</h2>
            <p className="text-text-muted font-mono text-sm">{error || 'Contest not found'}</p>
            <Link
              href="/contests"
              className="mt-6 inline-block text-accent hover:underline font-mono text-xs"
            >
              ← Back to Contests
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const now = new Date();
  const startTime = new Date(contest.startTime);
  const endTime = new Date(contest.endTime);
  const isUpcoming = now < startTime;
  const isPast = now > endTime;
  const isReverseCoding = contest.type === 'REVERSE_CODING';

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-bg-primary">
      {/* Custom Contest Topbar */}
      <div className="h-14 border-b border-border-subtle bg-bg-surface flex items-center justify-between px-4 shrink-0">
        <div className="flex items-center gap-4">
          <Link
            href="/contests"
            className="text-text-muted hover:text-text-primary transition-colors"
          >
            ← Back
          </Link>
          <div className="w-px h-4 bg-border-subtle" />
          <h1 className="font-bold text-text-primary font-syne text-lg">{contest.name}</h1>
          {isReverseCoding && (
            <span className="rounded-full bg-accent/10 px-2 py-0.5 font-mono text-[10px] font-bold tracking-wider text-accent border border-accent/30 ml-2">
              REVERSE CODING
            </span>
          )}
        </div>

        {/* Language Selector */}
        <div className="relative">
          <select
            aria-label="Select editor language"
            value={language}
            onChange={(e) => setLanguage(e.target.value as Language)}
            className="appearance-none rounded text-xs transition-all duration-200"
            style={{
              height: '32px',
              minWidth: '132px',
              padding: '0 30px 0 12px',
              fontFamily: "'Space Mono', monospace",
              border: '1px solid var(--accent)',
              backgroundColor: 'var(--accent)',
              color: '#0a0a0a',
              fontWeight: 700,
              cursor: 'pointer',
              outline: 'none',
            }}
          >
            {LANGUAGE_KEYS.map((lang) => (
              <option key={lang} value={lang}>
                {LANGUAGES[lang].display}
              </option>
            ))}
          </select>
          <span
            aria-hidden="true"
            className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[10px]"
            style={{ color: '#0a0a0a' }}
          >
            ▼
          </span>
        </div>

        <div className="flex items-center gap-6">
          <div className="font-mono text-xs flex items-center gap-2">
            {isUpcoming ? (
              <>
                <span className="text-text-muted">Starts in:</span>
                <Countdown targetDate={contest.startTime} />
              </>
            ) : isPast ? (
              <span className="text-text-muted italic">Contest Ended</span>
            ) : (
              <>
                <span className="text-text-muted">Ends in:</span>
                <span className="text-accent font-bold">
                  <Countdown targetDate={contest.endTime} />
                </span>
              </>
            )}
          </div>

          <Link
            href={`/contests/${contest.id}/leaderboard`}
            className="rounded border border-border-default px-3 py-1.5 font-mono text-[10px] font-bold uppercase tracking-wider text-text-primary transition-colors hover:border-accent hover:text-accent"
          >
            Leaderboard
          </Link>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden relative">
        <PanelGroup
          direction="horizontal"
          onLayout={handleLayoutChange}
          autoSaveId="forge-contest-layout"
        >
          {/* Left: Problems List */}
          <Panel defaultSize={mainSizes?.[0] ?? 15} minSize={10} maxSize={25} collapsible>
            <div className="flex flex-col h-full bg-bg-surface border-r border-border-subtle">
              <div className="px-3 py-2 border-b border-border-subtle shrink-0">
                <span className="text-[10px] tracking-[2px] uppercase font-mono text-text-muted">
                  Problems
                </span>
              </div>
              <div className="flex-1 overflow-y-auto">
                {contest.problems?.map((p: any, i: number) => {
                  const isActive = currentProblem?.id === p.id;
                  return (
                    <button
                      key={p.id}
                      onClick={() => {
                        setCurrentProblem(p as Problem);
                        router.push(`/contests/${contestId}?problem=${p.id}`);
                      }}
                      className="w-full text-left px-3 py-3 border-b border-border-subtle/50 transition-colors group flex flex-col gap-1.5"
                      style={{
                        backgroundColor: isActive ? 'var(--bg-elevated)' : 'transparent',
                        borderLeft: isActive ? '2px solid var(--accent)' : '2px solid transparent',
                      }}
                    >
                      <span
                        className="font-mono text-xs truncate"
                        style={{
                          color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
                        }}
                      >
                        {String.fromCharCode(65 + i)}. {p.title}
                      </span>
                      <div className="flex gap-2">
                        {p.difficulty && (
                          <span className="text-[9px] font-mono text-text-muted">
                            {p.difficulty}
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </Panel>

          <ResizeHandle direction="horizontal" />

          {/* Center: Editor + IO */}
          <Panel defaultSize={mainSizes?.[1] ?? 85} minSize={40}>
            {isUpcoming ? (
              <div className="flex flex-col items-center justify-center h-full bg-bg-primary text-center p-8">
                <div className="text-4xl mb-4">⏳</div>
                <h2 className="text-2xl font-bold font-syne mb-2 tracking-wider">
                  CONTEST HAS NOT STARTED
                </h2>
                <p className="text-text-muted font-mono text-sm mb-6 max-w-md">
                  The arena will open automatically when the contest begins.
                </p>
                <div className="p-4 rounded-lg border border-border-default bg-bg-surface font-mono">
                  <Countdown targetDate={contest.startTime} />
                </div>
              </div>
            ) : !currentProblem ? (
              <div className="flex flex-col items-center justify-center h-full bg-bg-primary text-center p-8">
                <p className="text-text-muted font-mono text-sm">
                  Select a problem from the left panel to begin.
                </p>
              </div>
            ) : (
              <PanelGroup
                direction="vertical"
                onLayout={handleCenterLayoutChange}
                autoSaveId="forge-contest-center-layout"
              >
                {/* Problem Panel + Editor */}
                <Panel defaultSize={centerSizes?.[0] ?? 70} minSize={30}>
                  <div className="flex flex-col h-full overflow-hidden">
                    <ProblemPanel />
                    <div className="flex-1 overflow-hidden">
                      <CodeEditor
                        language={language}
                        theme={theme}
                        value={code || LANGUAGES[language].boilerplate}
                        onChange={setCode}
                        onRun={handleRun}
                      />
                    </div>
                  </div>
                </Panel>

                <ResizeHandle direction="vertical" />

                {/* IO Panel */}
                <Panel defaultSize={centerSizes?.[1] ?? 30} minSize={15} maxSize={50}>
                  <IOPanel />
                </Panel>
              </PanelGroup>
            )}
          </Panel>
        </PanelGroup>

        {/* RC Interactor Overlay */}
        <AnimatePresence>{rcMode && <RCInteractor />}</AnimatePresence>
      </div>

      <StatusBar />
    </div>
  );
}

export default function ContestArenaPage() {
  return (
    <ProtectedRoute>
      <Suspense
        fallback={
          <div className="flex h-screen items-center justify-center bg-bg-primary text-text-primary">
            Loading...
          </div>
        }
      >
        <ContestArenaContent />
      </Suspense>
    </ProtectedRoute>
  );
}
