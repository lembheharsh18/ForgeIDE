'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

import { ContestReminders } from '../../components/dashboard/ContestReminders';
import { ProtectedRoute } from '../../components/layout/ProtectedRoute';
import { Topbar } from '../../components/layout/Topbar';
import { Skeleton } from '../../components/ui/Skeleton';
import api from '../../lib/axios';
import { useAuthStore } from '../../store/authStore';

interface DailyQuestion {
  title: string;
  platform: string;
  difficulty: string;
  url: string;
}

interface ContestReminder {
  title: string;
  platform: string;
  startTime: string;
  endTime?: string;
  url: string;
}

interface TopSolver {
  userId: string;
  username: string;
  avatarUrl: string | null;
  solveCount: number;
  lastSolvedAt: string;
}

interface LeaderboardPreviewEntry {
  rank: number;
  userId: string;
  username: string;
  score: number;
  solvedCount: number;
}

interface SourceList<T> {
  source: string;
  message: string;
  items: T[];
}

interface ClubHomeData {
  generatedAt: string;
  dailyQuestions: SourceList<DailyQuestion>;
  contestReminders: SourceList<ContestReminder> & { windowDays: number };
  todayTopSolvers: {
    source: string;
    message: string;
    since: string;
    solvers: TopSolver[];
  };
  leaderboardPreview: {
    source: string;
    message: string;
    entries: LeaderboardPreviewEntry[];
  };
}

const primaryLinks = [
  { label: 'Open IDE', href: '/ide', description: 'Code workspace' },
  { label: 'Contests', href: '/contests', description: 'Club contests' },
  { label: 'Leaderboard', href: '/leaderboard', description: 'Current rankings' },
  { label: 'Problems', href: '/club/problems', description: 'Practice archive' },
];

function Widget({
  title,
  source,
  message,
  isLoading,
  children,
}: {
  title: string;
  source?: string;
  message?: string;
  isLoading: boolean;
  children: React.ReactNode;
}) {
  return (
    <section className="min-h-40 rounded-lg border border-border-default bg-bg-surface p-5">
      <div className="flex items-start justify-between gap-3">
        <h2 className="font-mono text-xs font-bold uppercase tracking-widest text-text-muted">
          {title}
        </h2>
        {source && (
          <span className="rounded border border-border-subtle px-2 py-0.5 font-mono text-[9px] uppercase tracking-wider text-text-muted">
            {source}
          </span>
        )}
      </div>
      {isLoading ? (
        <div className="mt-5 space-y-3">
          <Skeleton className="h-5 w-2/3" />
          <Skeleton className="h-5 w-full" />
          <Skeleton className="h-5 w-1/2" />
        </div>
      ) : (
        <div className="mt-5">{children}</div>
      )}
      {!isLoading && message && (
        <p className="mt-4 text-xs leading-relaxed text-text-muted">{message}</p>
      )}
    </section>
  );
}

function EmptyState({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded border border-dashed border-border-subtle p-6 text-sm text-text-muted">
      {children}
    </div>
  );
}

export default function ClubHomePage() {
  const { user } = useAuthStore();
  const [homeData, setHomeData] = useState<ClubHomeData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const fetchHomeData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const res = await api.get<ClubHomeData>('/api/club/home');
        if (!cancelled) setHomeData(res.data);
      } catch {
        if (!cancelled) setError('Unable to load club home data.');
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    fetchHomeData();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-bg-primary text-text-primary">
        <Topbar />
        <main className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-6 py-8">
          <section className="flex flex-col gap-3">
            <p className="font-mono text-xs uppercase tracking-widest text-text-muted">Club Home</p>
            <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
              <div>
                <h1 className="text-3xl font-bold tracking-tight">
                  Welcome{user?.username ? `, ${user.username}` : ''}
                </h1>
                <p className="mt-2 max-w-2xl text-sm text-text-muted">
                  Daily practice, reminders, standings, and club activity in one place.
                </p>
              </div>
              {homeData?.generatedAt && (
                <span className="font-mono text-[10px] uppercase tracking-wider text-text-muted">
                  Updated {new Date(homeData.generatedAt).toLocaleTimeString()}
                </span>
              )}
            </div>
          </section>

          <nav className="grid grid-cols-1 gap-3 md:grid-cols-4">
            {primaryLinks.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-lg border border-border-default bg-bg-surface p-4 transition-colors hover:border-accent"
              >
                <span className="font-mono text-[10px] uppercase tracking-widest text-text-muted">
                  {item.description}
                </span>
                <span className="mt-2 block text-sm font-bold text-text-primary">{item.label}</span>
              </Link>
            ))}
          </nav>

          {error && (
            <div className="rounded border border-red bg-bg-surface p-4 text-sm text-red">
              {error}
            </div>
          )}

          <section className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <Widget
              title="Daily Questions"
              source={homeData?.dailyQuestions.source}
              message={homeData?.dailyQuestions.message}
              isLoading={isLoading}
            >
              {homeData?.dailyQuestions.items.length ? (
                <div className="space-y-3">
                  {homeData.dailyQuestions.items.map((question) => (
                    <a
                      key={`${question.platform}-${question.url}`}
                      href={question.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block rounded border border-border-subtle p-3 transition-colors hover:border-accent"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <span className="font-bold">{question.title}</span>
                        <span className="font-mono text-[10px] text-text-muted">
                          {question.platform}
                        </span>
                      </div>
                      <span className="mt-2 block text-xs text-text-muted">
                        {question.difficulty}
                      </span>
                    </a>
                  ))}
                </div>
              ) : (
                <EmptyState>No daily questions are available yet.</EmptyState>
              )}
            </Widget>

            <Widget title="Contest Reminders" isLoading={false}>
              <ContestReminders />
            </Widget>

            <Widget
              title="Today's Top Solver"
              source={homeData?.todayTopSolvers.source}
              message={homeData?.todayTopSolvers.message}
              isLoading={isLoading}
            >
              {homeData?.todayTopSolvers.solvers.length ? (
                <div className="space-y-3">
                  {homeData.todayTopSolvers.solvers.map((solver) => (
                    <div
                      key={solver.userId}
                      className="flex items-center justify-between rounded border border-border-subtle p-3"
                    >
                      <span className="font-bold">{solver.username}</span>
                      <span className="font-mono text-sm text-accent">
                        {solver.solveCount} accepted
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState>No accepted submissions recorded today.</EmptyState>
              )}
            </Widget>

            <Widget
              title="All-Platform Rating Preview"
              source={homeData?.leaderboardPreview.source}
              message={homeData?.leaderboardPreview.message}
              isLoading={isLoading}
            >
              {homeData?.leaderboardPreview.entries.length ? (
                <div className="space-y-2">
                  {homeData.leaderboardPreview.entries.map((entry) => (
                    <div
                      key={entry.userId}
                      className="grid grid-cols-[48px_1fr_80px] items-center rounded border border-border-subtle px-3 py-2"
                    >
                      <span className="font-mono text-sm text-text-muted">#{entry.rank}</span>
                      <span className="font-bold">{entry.username}</span>
                      <span className="text-right font-mono text-sm text-accent">
                        {entry.score}
                      </span>
                    </div>
                  ))}
                  <Link
                    href="/leaderboard"
                    className="mt-3 inline-block font-mono text-xs font-bold uppercase tracking-wider text-accent hover:underline"
                  >
                    View full leaderboard
                  </Link>
                </div>
              ) : (
                <EmptyState>No leaderboard entries are available yet.</EmptyState>
              )}
            </Widget>
          </section>
        </main>
      </div>
    </ProtectedRoute>
  );
}
