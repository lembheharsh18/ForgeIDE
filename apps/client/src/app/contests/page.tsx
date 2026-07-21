'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { useEffect, useState } from 'react';

import { ProtectedRoute } from '../../components/layout/ProtectedRoute';
import { Topbar } from '../../components/layout/Topbar';
import { Badge, type BadgeVariant } from '../../components/ui/Badge';
import { Countdown } from '../../components/ui/Countdown';
import api from '../../lib/axios';
import { useAuthStore } from '../../store/authStore';

// ── Types ────────────────────────────────────────

interface Contest {
  id: string;
  name: string;
  platform: string;
  startTime: string;
  endTime: string;
  link: string;
  description: string | null;
  participantCount: number;
  createdById: string | null;
}

interface CFContest {
  id: number;
  name: string;
  type: string;
  phase: string;
  startTimeSeconds: number;
  durationSeconds: number;
}

// ── Helpers ──────────────────────────────────────

const formatDate = (dateStr: string) =>
  new Date(dateStr).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });

const formatCFDate = (seconds: number) =>
  new Date(seconds * 1000).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });

const getDaysAgo = (dateStr: string) => {
  const days = Math.floor(
    (new Date().getTime() - new Date(dateStr).getTime()) / (1000 * 60 * 60 * 24),
  );
  return days === 0 ? 'Today' : `${days} days ago`;
};

const getDuration = (seconds: number) => {
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  return hrs > 0 ? `${hrs}h ${mins > 0 ? `${mins}m` : ''}` : `${mins}m`;
};

// ── Club Contest Card ────────────────────────────

function ContestCard({ contest, isPast }: { contest: Contest; isPast: boolean }) {
  const isReverseCoding = (contest as any).type === 'REVERSE_CODING';
  const isCustom = contest.platform === 'CUSTOM';
  const isInPlatform = isCustom || isReverseCoding;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col justify-between gap-6 rounded-lg border border-border-default bg-bg-surface p-5 transition-colors hover:border-border-subtle md:flex-row md:items-center"
    >
      <div className="flex flex-1 flex-col gap-2">
        <div className="flex items-center gap-3">
          <Badge
            variant={`platform-${contest.platform}` as BadgeVariant}
            label={contest.platform}
          />
          {isReverseCoding && (
            <span className="rounded-full bg-accent/10 px-2 py-0.5 font-mono text-[10px] font-bold tracking-wider text-accent border border-accent/30">
              REVERSE CODING
            </span>
          )}
          <h3 className="text-lg font-bold text-text-primary">{contest.name}</h3>
        </div>
        {contest.description && (
          <p className="line-clamp-2 text-sm text-text-muted">{contest.description}</p>
        )}
        <div className="mt-2 flex flex-col md:flex-row md:items-center gap-4 font-mono text-xs text-text-muted">
          <span>
            {formatDate(contest.startTime)} - {formatDate(contest.endTime)}
          </span>
          <span className="hidden md:inline">•</span>
          <span>{contest.participantCount} participants</span>
          {contest.createdById && (contest as any).createdBy?.username && (
            <>
              <span className="hidden md:inline">•</span>
              <span>By @{(contest as any).createdBy.username}</span>
            </>
          )}
        </div>
      </div>

      <div className="flex shrink-0 flex-col items-end gap-4">
        {!isPast ? (
          <Countdown targetDate={contest.startTime} />
        ) : (
          <span className="font-mono text-sm italic text-text-muted">
            Ended {getDaysAgo(contest.endTime)}
          </span>
        )}

        <div className="flex items-center gap-3">
          <Link
            href={`/contests/${contest.id}/leaderboard`}
            className="rounded border border-border-default px-3 py-1.5 font-mono text-[10px] font-bold uppercase tracking-wider text-text-primary transition-colors hover:border-accent hover:text-accent"
          >
            Leaderboard
          </Link>

          {isInPlatform ? (
            <Link
              href={`/contests/${contest.id}`}
              className="rounded bg-accent px-4 py-1.5 font-mono text-xs font-bold uppercase tracking-wider text-bg-primary transition-colors hover:bg-[#fbbf24]"
            >
              {isPast ? 'View' : 'Enter Arena'}
            </Link>
          ) : (
            <a
              href={contest.link || '#'}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded bg-accent px-4 py-1.5 font-mono text-xs font-bold uppercase tracking-wider text-bg-primary transition-colors hover:bg-[#fbbf24]"
            >
              {isPast ? 'View contest' : 'Register'}
            </a>
          )}
        </div>
      </div>
    </motion.div>
  );
}

// ── CF Contest Card ──────────────────────────────

function CFContestCard({ contest, index }: { contest: CFContest; index: number }) {
  const startDate = new Date(contest.startTimeSeconds * 1000);
  const cfLink = `https://codeforces.com/contests/${contest.id}`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="flex flex-col justify-between gap-4 rounded-lg border p-5 transition-all duration-300 md:flex-row md:items-center"
      style={{
        backgroundColor: 'var(--bg-surface)',
        borderColor: 'var(--border-default)',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = 'var(--accent)';
        e.currentTarget.style.boxShadow = '0 4px 20px rgba(232, 255, 90, 0.06)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = 'var(--border-default)';
        e.currentTarget.style.boxShadow = 'none';
      }}
    >
      <div className="flex flex-1 flex-col gap-2">
        <div className="flex items-center gap-3">
          <Badge variant="platform-CF" label="CF" />
          <span
            className="rounded-full px-2 py-0.5 font-mono text-[10px] tracking-wider"
            style={{
              backgroundColor: 'rgba(96, 165, 250, 0.1)',
              color: 'var(--text-muted)',
              border: '1px solid rgba(96, 165, 250, 0.2)',
            }}
          >
            {contest.type}
          </span>
          <h3 className="text-base font-bold text-text-primary">{contest.name}</h3>
        </div>
        <div className="mt-1 flex flex-col md:flex-row md:items-center gap-3 font-mono text-xs text-text-muted">
          <span>📅 {formatCFDate(contest.startTimeSeconds)}</span>
          <span className="hidden md:inline">•</span>
          <span>⏱ {getDuration(contest.durationSeconds)}</span>
        </div>
      </div>

      <div className="flex shrink-0 flex-col items-end gap-3">
        <Countdown targetDate={startDate.toISOString()} />
        <a
          href={cfLink}
          target="_blank"
          rel="noopener noreferrer"
          className="rounded px-4 py-1.5 font-mono text-xs font-bold uppercase tracking-wider transition-all duration-200"
          style={{
            backgroundColor: 'rgba(96, 165, 250, 0.15)',
            color: '#60a5fa',
            border: '1px solid rgba(96, 165, 250, 0.3)',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(96, 165, 250, 0.25)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(96, 165, 250, 0.15)';
          }}
        >
          Register on CF →
        </a>
      </div>
    </motion.div>
  );
}

// ── Section Header ───────────────────────────────

function SectionHeader({
  title,
  count,
  accent,
}: {
  title: string;
  count: number;
  accent?: string;
}) {
  return (
    <div className="flex items-center gap-3">
      {accent && <span className="w-2 h-2 rounded-full" style={{ backgroundColor: accent }} />}
      <h2 className="text-xl font-bold text-text-primary">{title}</h2>
      <span className="rounded-full bg-bg-elevated px-2.5 py-0.5 font-mono text-xs text-text-muted">
        {count}
      </span>
    </div>
  );
}

// ── Main Page ────────────────────────────────────

export default function ContestsPage() {
  const { user } = useAuthStore();

  const [upcoming, setUpcoming] = useState<Contest[]>([]);
  const [past, setPast] = useState<Contest[]>([]);
  const [cfUpcoming, setCfUpcoming] = useState<CFContest[]>([]);
  const [cfPrevious, setCfPrevious] = useState<CFContest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [cfLoading, setCfLoading] = useState(true);
  const [cfError, setCfError] = useState<string | null>(null);

  // Fetch club contests
  useEffect(() => {
    const fetchContests = async () => {
      try {
        const res = await api.get('/api/contests');
        setUpcoming(res.data.upcoming);
        setPast(res.data.past);
      } catch (err) {
        console.error('Failed to fetch club contests', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchContests();
  }, []);

  // Fetch Codeforces contests (independent fetch)
  useEffect(() => {
    const fetchCF = async () => {
      try {
        const res = await api.get('/api/reminders/contests');
        setCfUpcoming(res.data.upcoming || []);
        setCfPrevious(res.data.previous || []);
      } catch (err) {
        console.error('Failed to fetch CF contests', err);
        setCfError('Could not load Codeforces contests.');
      } finally {
        setCfLoading(false);
      }
    };
    fetchCF();
  }, []);

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-bg-primary text-text-primary">
        <Topbar />
        <main className="mx-auto max-w-5xl space-y-10 px-6 py-8">
          {/* Page Header */}
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="font-mono text-xs uppercase tracking-widest text-text-muted">Compete</p>
              <h1 className="text-3xl font-bold tracking-tight mt-1">Contests</h1>
              <p className="mt-2 text-sm text-text-muted max-w-xl">
                Club-hosted contests and upcoming Codeforces rounds — all in one place.
              </p>
            </div>
            <Link
              href="/contests/create"
              className="self-start rounded border px-4 py-2 font-mono text-xs font-bold uppercase tracking-wider transition-colors"
              style={{
                borderColor: '#39ff8a',
                color: '#39ff8a',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(57,255,138,0.1)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
            >
              + Create Contest
            </Link>
          </div>

          {/* ── Upcoming Codeforces Contests ──── */}
          <section className="space-y-5">
            <SectionHeader
              title="UPCOMING — CODEFORCES"
              count={cfUpcoming.length}
              accent="#60a5fa"
            />

            {cfLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="h-24 rounded-lg animate-pulse"
                    style={{ backgroundColor: 'var(--bg-surface)' }}
                  />
                ))}
              </div>
            ) : cfError ? (
              <div
                className="rounded-lg border p-5 text-sm italic"
                style={{
                  borderColor: 'var(--border-default)',
                  backgroundColor: 'var(--bg-surface)',
                  color: 'var(--text-muted)',
                }}
              >
                {cfError}
              </div>
            ) : cfUpcoming.length === 0 ? (
              <div
                className="rounded-lg border p-6 text-center text-sm italic"
                style={{
                  borderColor: 'var(--border-default)',
                  backgroundColor: 'var(--bg-surface)',
                  color: 'var(--text-muted)',
                }}
              >
                No upcoming Codeforces contests scheduled.
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {cfUpcoming.map((contest, idx) => (
                  <CFContestCard key={contest.id} contest={contest} index={idx} />
                ))}
              </div>
            )}
          </section>

          {/* ── Club Contests — Upcoming ──────── */}
          <section className="space-y-5">
            <SectionHeader title="UPCOMING — CLUB" count={upcoming.length} accent="#39ff8a" />

            {isLoading ? (
              <div className="space-y-3">
                {[1, 2].map((i) => (
                  <div
                    key={i}
                    className="h-24 rounded-lg animate-pulse"
                    style={{ backgroundColor: 'var(--bg-surface)' }}
                  />
                ))}
              </div>
            ) : upcoming.length === 0 ? (
              <div
                className="rounded-lg border p-6 text-center italic text-sm"
                style={{
                  borderColor: 'var(--border-default)',
                  backgroundColor: 'var(--bg-surface)',
                  color: 'var(--text-muted)',
                }}
              >
                No upcoming club contests scheduled.{' '}
                <Link href="/contests/create" className="text-accent hover:underline">
                  Create one?
                </Link>
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                {upcoming.map((contest) => (
                  <ContestCard key={contest.id} contest={contest} isPast={false} />
                ))}
              </div>
            )}
          </section>

          {/* ── Past Contests ────────────────── */}
          <section className="space-y-5">
            <SectionHeader title="PAST" count={past.length + cfPrevious.length} />

            {/* Past CF Contests */}
            {!cfLoading && cfPrevious.length > 0 && (
              <div className="space-y-3">
                <p className="font-mono text-[10px] uppercase tracking-widest text-text-muted">
                  Recent Codeforces
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {cfPrevious.map((contest) => (
                    <a
                      key={contest.id}
                      href={`https://codeforces.com/contests/${contest.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-between rounded-lg border p-4 transition-colors"
                      style={{
                        borderColor: 'var(--border-default)',
                        backgroundColor: 'var(--bg-surface)',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = 'var(--border-subtle)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = 'var(--border-default)';
                      }}
                    >
                      <div className="flex flex-col gap-1">
                        <span className="text-sm font-bold text-text-secondary truncate max-w-[300px]">
                          {contest.name}
                        </span>
                        <span className="font-mono text-[11px] text-text-muted">
                          {formatCFDate(contest.startTimeSeconds)}
                        </span>
                      </div>
                      <Badge variant="platform-CF" label="CF" />
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* Past Club Contests */}
            {!isLoading && past.length > 0 && (
              <div className="space-y-3 mt-4">
                <p className="font-mono text-[10px] uppercase tracking-widest text-text-muted">
                  Club Contests
                </p>
                <div className="flex flex-col gap-4">
                  {past.map((contest) => (
                    <ContestCard key={contest.id} contest={contest} isPast={true} />
                  ))}
                </div>
              </div>
            )}

            {!isLoading && !cfLoading && past.length === 0 && cfPrevious.length === 0 && (
              <div
                className="rounded-lg border p-6 text-center italic text-sm"
                style={{
                  borderColor: 'var(--border-default)',
                  backgroundColor: 'var(--bg-surface)',
                  color: 'var(--text-muted)',
                }}
              >
                No past contests available.
              </div>
            )}
          </section>
        </main>
      </div>
    </ProtectedRoute>
  );
}
