'use client';

import { motion } from 'framer-motion';
import { useRouter, useParams } from 'next/navigation';
import { useState, useEffect } from 'react';

import api from '../../lib/axios';
import { useAuthStore } from '../../store/authStore';
import type { Problem } from '../../store/editorStore';
import { useEditorStore } from '../../store/editorStore';

// ── Difficulty Color ─────────────────────────────

function getDifficultyColor(difficulty: string): string {
  const d = difficulty.toLowerCase();
  const n = parseInt(difficulty);
  if (!isNaN(n)) {
    if (n <= 1200) return 'var(--green)';
    if (n <= 1600) return '#fbbf24';
    return 'var(--red)';
  }
  if (d === 'easy') return 'var(--green)';
  if (d === 'medium') return '#fbbf24';
  if (d === 'hard') return 'var(--red)';
  return 'var(--text-muted)';
}

function getPlatformLabel(platform: string): string {
  switch (platform) {
    case 'CODEFORCES':
      return 'CF';
    case 'CUSTOM':
      return 'DSA';
    case 'LEETCODE':
      return 'LC';
    case 'ATCODER':
      return 'AC';
    default:
      return platform;
  }
}

// ── Problem Sidebar ──────────────────────────────

export function ProblemSidebar() {
  const router = useRouter();
  const params = useParams();
  const { user } = useAuthStore();
  const { currentProblem, setCurrentProblem } = useEditorStore();
  const [problems, setProblems] = useState<Problem[]>([]);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [solvedIds, setSolvedIds] = useState<Set<string>>(new Set());

  const activeProblemId = (params?.problemId as string) || currentProblem?.id;

  // Fetch problems & solved ids
  useEffect(() => {
    const fetchProblems = async () => {
      setIsLoading(true);
      try {
        const res = await api.get('/api/problems');
        setProblems(res.data.problems || []);
      } catch {
        // Use empty list if API not available
        setProblems([]);
      } finally {
        setIsLoading(false);
      }
    };

    const fetchSolvedIds = async () => {
      if (!user) return;
      try {
        const res = await api.get('/api/submissions/me?verdict=ACCEPTED');
        const ids = new Set<string>();
        // Check if data is array or object with submissions array
        const data = res.data;
        const subs = Array.isArray(data) ? data : data.submissions || [];
        subs.forEach((s: any) => {
          if (s.problemId) ids.add(s.problemId);
        });
        setSolvedIds(ids);
      } catch {
        // Ignore
      }
    };

    fetchProblems();
    fetchSolvedIds();
  }, [user]);

  // Filter problems by search
  const filtered = problems.filter(
    (p) =>
      p.title.toLowerCase().includes(search.toLowerCase()) ||
      p.tags.some((t) => t.toLowerCase().includes(search.toLowerCase())),
  );

  const handleSelectProblem = (problem: Problem) => {
    setCurrentProblem(problem);
    router.push(`/ide/${problem.id}`);
  };

  return (
    <div
      className="flex flex-col h-full overflow-hidden"
      style={{
        backgroundColor: 'var(--bg-surface)',
        borderRight: '1px solid var(--border-subtle)',
      }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-3 shrink-0"
        style={{
          height: '36px',
          borderBottom: '1px solid var(--border-subtle)',
        }}
      >
        <span
          className="text-[10px] tracking-[2px] uppercase"
          style={{
            fontFamily: "'Space Mono', monospace",
            color: 'var(--text-muted)',
          }}
        >
          Problems
        </span>
        <span
          className="text-[10px]"
          style={{
            fontFamily: "'Space Mono', monospace",
            color: 'var(--text-muted)',
          }}
        >
          {filtered.length}
        </span>
      </div>

      {/* Search */}
      <div className="px-2 py-2 shrink-0">
        <input
          type="text"
          placeholder="Search..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full px-2.5 py-1.5 rounded text-[11px] outline-none transition-all duration-200"
          style={{
            fontFamily: "'Space Mono', monospace",
            backgroundColor: 'var(--bg-elevated)',
            border: '1px solid var(--border-default)',
            color: 'var(--text-primary)',
          }}
          onFocus={(e) => {
            e.target.style.borderColor = 'var(--accent)';
          }}
          onBlur={(e) => {
            e.target.style.borderColor = 'var(--border-default)';
          }}
        />
      </div>

      {/* Problem List */}
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div
              className="w-5 h-5 rounded-full border-2 border-t-transparent animate-spin"
              style={{ borderColor: 'var(--border-default)', borderTopColor: 'transparent' }}
            />
          </div>
        ) : filtered.length === 0 ? (
          <div
            className="px-3 py-6 text-center text-[11px]"
            style={{
              fontFamily: "'Space Mono', monospace",
              color: 'var(--text-muted)',
            }}
          >
            {search ? 'No matches found' : 'No problems loaded'}
          </div>
        ) : (
          filtered.map((problem, i) => {
            const isActive = problem.id === activeProblemId;
            const isSolved = solvedIds.has(problem.id);

            return (
              <motion.button
                key={problem.id}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                whileHover={{ x: 3 }}
                transition={{ delay: i * 0.03, duration: 0.2 }}
                onClick={() => handleSelectProblem(problem)}
                className="w-full text-left px-3 py-2 transition-all duration-150 group"
                style={{
                  borderLeft: isActive ? '2px solid var(--accent)' : '2px solid transparent',
                  backgroundColor: isActive ? 'var(--bg-elevated)' : 'transparent',
                }}
                onMouseEnter={(e) => {
                  if (!isActive) e.currentTarget.style.backgroundColor = 'var(--bg-hover)';
                }}
                onMouseLeave={(e) => {
                  if (!isActive) e.currentTarget.style.backgroundColor = 'transparent';
                }}
              >
                <div className="flex items-center gap-2">
                  {/* Solved check */}
                  {isSolved && (
                    <span className="text-[10px] shrink-0" style={{ color: 'var(--green)' }}>
                      ✓
                    </span>
                  )}
                  {/* Title */}
                  <span
                    className="text-[11px] truncate flex-1"
                    style={{
                      fontFamily: "'Space Mono', monospace",
                      color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
                    }}
                  >
                    {problem.title}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 mt-1">
                  {/* Difficulty badge */}
                  <span
                    className="text-[9px] px-1.5 py-0.5 rounded"
                    style={{
                      fontFamily: "'Space Mono', monospace",
                      color: getDifficultyColor(problem.difficulty),
                      border: `1px solid ${getDifficultyColor(problem.difficulty)}`,
                      opacity: 0.8,
                    }}
                  >
                    {problem.difficulty}
                  </span>
                  {/* Platform tag */}
                  <span
                    className="text-[9px]"
                    style={{
                      fontFamily: "'Space Mono', monospace",
                      color: 'var(--text-muted)',
                    }}
                  >
                    {getPlatformLabel(problem.platform)}
                  </span>
                </div>
              </motion.button>
            );
          })
        )}
      </div>
    </div>
  );
}
