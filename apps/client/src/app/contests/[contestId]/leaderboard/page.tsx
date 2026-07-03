'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';

import { ProtectedRoute } from '../../../../components/layout/ProtectedRoute';

export default function ContestLeaderboardPage() {
  const params = useParams();
  const contestId = params?.contestId as string;

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-bg-primary p-8 font-sans text-text-primary">
        <div className="mx-auto flex max-w-5xl flex-col gap-6">
          <div>
            <Link
              href="/contests"
              className="font-mono text-xs uppercase tracking-wider text-text-muted hover:text-accent"
            >
              Back to contests
            </Link>
            <h1 className="mt-4 text-3xl font-bold tracking-tight">Contest Leaderboard</h1>
            <p className="mt-2 text-sm text-text-muted">Contest ID: {contestId}</p>
          </div>

          <section className="rounded-lg border border-border-default bg-bg-surface p-5">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <h2 className="font-mono text-xs font-bold uppercase tracking-widest text-text-muted">
                Contest-specific standings
              </h2>
              <span className="w-fit rounded border border-border-subtle px-2 py-1 font-mono text-[10px] uppercase tracking-widest text-text-muted">
                UNBACKED
              </span>
            </div>
            <div className="mt-6 rounded border border-dashed border-border-subtle p-8 text-sm text-text-muted">
              ContestLeaderboardEntry data is not built yet. This page is intentionally separate
              from the global all-platform leaderboard.
            </div>
          </section>
        </div>
      </div>
    </ProtectedRoute>
  );
}
