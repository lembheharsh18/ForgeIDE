'use client';

import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';

import api from '../../lib/axios';

// ── Types ────────────────────────────────────────

interface LeaderboardEntry {
  rank?: number;
  user?: { username?: string | null } | null;
  username?: string | null;
  score?: number;
  solvedCount?: number;
}

interface RecentSubmission {
  id: string;
  user?: { username?: string | null } | null;
  username?: string | null;
  problem?: { title?: string | null } | null;
  problemTitle?: string | null;
  verdict?: string;
  createdAt?: string;
}

// ── Rank Color ───────────────────────────────────

function getRankColor(rank: number): string {
  if (rank === 1) return '#e8ff5a'; // gold
  if (rank === 2) return '#aaaaaa'; // silver
  if (rank === 3) return '#ff8c42'; // bronze
  return 'var(--text-muted)';
}

function getVerdictColor(verdict: string): string {
  switch (verdict) {
    case 'ACCEPTED':
      return 'var(--green)';
    case 'WRONG_ANSWER':
      return 'var(--red)';
    case 'TIME_LIMIT_EXCEEDED':
      return 'var(--orange)';
    case 'RUNTIME_ERROR':
      return 'var(--red)';
    case 'COMPILATION_ERROR':
      return 'var(--red)';
    default:
      return 'var(--text-muted)';
  }
}

function getVerdictLabel(verdict: string): string {
  switch (verdict) {
    case 'ACCEPTED':
      return 'AC';
    case 'WRONG_ANSWER':
      return 'WA';
    case 'TIME_LIMIT_EXCEEDED':
      return 'TLE';
    case 'RUNTIME_ERROR':
      return 'RE';
    case 'COMPILATION_ERROR':
      return 'CE';
    default:
      return verdict;
  }
}

function getLeaderboardEntries(data: unknown): LeaderboardEntry[] {
  if (Array.isArray(data)) return data as LeaderboardEntry[];
  if (data && typeof data === 'object' && Array.isArray((data as { entries?: unknown }).entries)) {
    return (data as { entries: LeaderboardEntry[] }).entries;
  }
  return [];
}

function getRecentSubmissions(data: unknown): RecentSubmission[] {
  if (
    data &&
    typeof data === 'object' &&
    Array.isArray((data as { submissions?: unknown }).submissions)
  ) {
    return (data as { submissions: RecentSubmission[] }).submissions;
  }
  if (Array.isArray(data)) return data as RecentSubmission[];
  return [];
}

function getEntryUsername(entry: LeaderboardEntry): string {
  return entry.user?.username ?? entry.username ?? 'unknown';
}

function getSubmissionUsername(submission: RecentSubmission): string {
  return submission.user?.username ?? submission.username ?? 'unknown';
}

function getSubmissionProblemTitle(submission: RecentSubmission): string {
  return submission.problem?.title ?? submission.problemTitle ?? 'Unknown problem';
}

// ── Club Panel ───────────────────────────────────

export function ClubPanel() {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [submissions, setSubmissions] = useState<RecentSubmission[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const [lbRes, subRes] = await Promise.allSettled([
          api.get('/api/leaderboard?limit=7'),
          api.get('/api/submissions/recent?limit=5'),
        ]);

        if (lbRes.status === 'fulfilled') {
          setLeaderboard(getLeaderboardEntries(lbRes.value.data));
        }
        if (subRes.status === 'fulfilled') {
          setSubmissions(getRecentSubmissions(subRes.value.data));
        }
      } catch {
        // API not available yet — use empty data
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  const maxScore =
    leaderboard.length > 0 ? Math.max(...leaderboard.map((e) => Number(e.score) || 0), 1) : 1;

  return (
    <div
      className="flex flex-col h-full overflow-hidden"
      style={{
        backgroundColor: 'var(--bg-surface)',
        borderLeft: '1px solid var(--border-subtle)',
      }}
    >
      {/* Leaderboard Header */}
      <div
        className="px-3 shrink-0 flex items-center"
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
          Leaderboard
        </span>
      </div>

      {/* Leaderboard Entries */}
      <div className="flex-1 overflow-y-auto" style={{ minHeight: 0 }}>
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div
              className="w-5 h-5 rounded-full border-2 border-t-transparent animate-spin"
              style={{
                borderColor: 'var(--border-default)',
                borderTopColor: 'transparent',
              }}
            />
          </div>
        ) : leaderboard.length === 0 ? (
          /* Placeholder data when API isn't ready */
          <div className="px-3 py-2 space-y-2">
            {[
              { rank: 1, username: 'admin', score: 2500 },
              { rank: 2, username: 'arjun_cp', score: 2300 },
              { rank: 3, username: 'sneha_algo', score: 2100 },
              { rank: 4, username: 'rohan_dev', score: 1900 },
              { rank: 5, username: 'priya_code', score: 1700 },
              { rank: 6, username: 'vikram_cp', score: 1500 },
              { rank: 7, username: 'ananya_dsa', score: 1350 },
            ].map((entry, i) => (
              <div key={i} className="py-1">
                <div className="flex items-center gap-2 mb-1">
                  <span
                    className="text-[10px] font-bold w-4 text-right"
                    style={{
                      fontFamily: "'Space Mono', monospace",
                      color: getRankColor(entry.rank ?? i + 1),
                    }}
                  >
                    {entry.rank ?? i + 1}
                  </span>
                  <span
                    className="text-[11px] truncate flex-1"
                    style={{
                      fontFamily: "'Space Mono', monospace",
                      color: 'var(--text-secondary)',
                    }}
                  >
                    {entry.username}
                  </span>
                  <span
                    className="text-[11px] font-bold"
                    style={{
                      fontFamily: "'Space Mono', monospace",
                      color: 'var(--accent)',
                    }}
                  >
                    {entry.score}
                  </span>
                </div>
                {/* Score bar */}
                <div
                  className="ml-6 h-[3px] rounded-full overflow-hidden"
                  style={{ backgroundColor: 'var(--bg-elevated)' }}
                >
                  <motion.div
                    className="h-full rounded-full"
                    style={{ backgroundColor: 'var(--accent)' }}
                    initial={{ width: 0 }}
                    animate={{
                      width: `${(entry.score / 2500) * 100}%`,
                    }}
                    transition={{
                      duration: 0.5,
                      ease: 'easeOut',
                      delay: 0.4 + i * 0.08,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="px-3 py-2 space-y-2">
            {leaderboard.map((entry, i) => (
              <div key={i} className="py-1">
                <div className="flex items-center gap-2 mb-1">
                  <span
                    className="text-[10px] font-bold w-4 text-right"
                    style={{
                      fontFamily: "'Space Mono', monospace",
                      color: getRankColor(entry.rank ?? i + 1),
                    }}
                  >
                    {entry.rank ?? i + 1}
                  </span>
                  <span
                    className="text-[11px] truncate flex-1"
                    style={{
                      fontFamily: "'Space Mono', monospace",
                      color: 'var(--text-secondary)',
                    }}
                  >
                    {getEntryUsername(entry)}
                  </span>
                  <span
                    className="text-[11px] font-bold"
                    style={{
                      fontFamily: "'Space Mono', monospace",
                      color: 'var(--accent)',
                    }}
                  >
                    {Number(entry.score) || 0}
                  </span>
                </div>
                {/* Score bar animation */}
                <div
                  className="ml-6 h-[3px] rounded-full overflow-hidden"
                  style={{ backgroundColor: 'var(--bg-elevated)' }}
                >
                  <motion.div
                    className="h-full rounded-full"
                    style={{ backgroundColor: 'var(--accent)' }}
                    initial={{ width: 0 }}
                    animate={{
                      width: `${((Number(entry.score) || 0) / maxScore) * 100}%`,
                    }}
                    transition={{
                      duration: 0.5,
                      ease: 'easeOut',
                      delay: 0.4 + i * 0.08,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Recent Submissions */}
      <div className="shrink-0" style={{ borderTop: '1px solid var(--border-subtle)' }}>
        <div
          className="px-3 flex items-center"
          style={{
            height: '28px',
            borderBottom: '1px solid var(--border-subtle)',
          }}
        >
          <span
            className="text-[9px] tracking-[2px] uppercase"
            style={{
              fontFamily: "'Space Mono', monospace",
              color: 'var(--text-muted)',
            }}
          >
            Recent
          </span>
        </div>
        <div className="px-3 py-1.5 space-y-1" style={{ maxHeight: '120px', overflowY: 'auto' }}>
          {submissions.length === 0
            ? /* Placeholder submissions */
              [
                { user: 'arjun_cp', problem: 'Theatre Sq.', verdict: 'AC' },
                { user: 'sneha_algo', problem: 'Two Sum', verdict: 'WA' },
                { user: 'rohan_dev', problem: 'Taxi', verdict: 'AC' },
                { user: 'priya_code', problem: 'LCS', verdict: 'TLE' },
                { user: 'admin', problem: 'Watermelon', verdict: 'AC' },
              ].map((s, i) => (
                <div
                  key={i}
                  className="flex items-center gap-1.5 text-[10px]"
                  style={{ fontFamily: "'Space Mono', monospace" }}
                >
                  <span style={{ color: 'var(--text-secondary)' }}>{s.user}</span>
                  <span style={{ color: 'var(--text-muted)' }}>·</span>
                  <span className="truncate flex-1" style={{ color: 'var(--text-muted)' }}>
                    {s.problem}
                  </span>
                  <span
                    style={{
                      color:
                        s.verdict === 'AC'
                          ? 'var(--green)'
                          : s.verdict === 'WA'
                            ? 'var(--red)'
                            : 'var(--orange)',
                    }}
                  >
                    {s.verdict}
                  </span>
                </div>
              ))
            : submissions.map((s) => (
                <div
                  key={s.id}
                  className="flex items-center gap-1.5 text-[10px]"
                  style={{ fontFamily: "'Space Mono', monospace" }}
                >
                  <span style={{ color: 'var(--text-secondary)' }}>{getSubmissionUsername(s)}</span>
                  <span style={{ color: 'var(--text-muted)' }}>·</span>
                  <span className="truncate flex-1" style={{ color: 'var(--text-muted)' }}>
                    {getSubmissionProblemTitle(s)}
                  </span>
                  <span style={{ color: getVerdictColor(s.verdict ?? 'PENDING') }}>
                    {getVerdictLabel(s.verdict ?? 'PENDING')}
                  </span>
                </div>
              ))}
        </div>
      </div>
    </div>
  );
}
