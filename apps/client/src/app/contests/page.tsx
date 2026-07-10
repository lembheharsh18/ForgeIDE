'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { useEffect, useState } from 'react';

import { ProtectedRoute } from '../../components/layout/ProtectedRoute';
import { Badge, type BadgeVariant } from '../../components/ui/Badge';
import { Countdown } from '../../components/ui/Countdown';
import api from '../../lib/axios';
import { useAuthStore } from '../../store/authStore';

interface Contest {
  id: string;
  name: string;
  platform: string;
  startTime: string;
  endTime: string;
  link: string;
  description: string | null;
  participantCount: number;
}

export default function ContestsPage() {
  const { user } = useAuthStore();
  const isAdmin = user?.role === 'ADMIN';

  const [upcoming, setUpcoming] = useState<Contest[]>([]);
  const [past, setPast] = useState<Contest[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchContests = async () => {
      try {
        const res = await api.get('/api/contests');
        setUpcoming(res.data.upcoming);
        setPast(res.data.past);
      } catch (err) {
        console.error('Failed to fetch contests', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchContests();
  }, []);

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  const getDaysAgo = (dateStr: string) => {
    const days = Math.floor(
      (new Date().getTime() - new Date(dateStr).getTime()) / (1000 * 60 * 60 * 24),
    );
    return days === 0 ? 'Today' : `${days} days ago`;
  };

  const ContestCard = ({ contest, isPast }: { contest: Contest; isPast: boolean }) => {
    const isReverseCoding = (contest as any).type === 'REVERSE_CODING';

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
          <div className="mt-2 flex items-center gap-4 font-mono text-xs text-text-muted">
            <span>
              {formatDate(contest.startTime)} - {formatDate(contest.endTime)}
            </span>
            <span>{contest.participantCount} participants</span>
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
              Contest leaderboard
            </Link>
            {isAdmin && (
              <button className="px-2 font-mono text-[10px] font-bold uppercase tracking-wider text-text-muted hover:text-text-primary">
                Edit
              </button>
            )}
            {isReverseCoding ? (
              <Link
                href={`/ide?contestId=${contest.id}`}
                className="rounded bg-accent px-4 py-1.5 font-mono text-xs font-bold uppercase tracking-wider text-bg-primary transition-colors hover:bg-[#fbbf24]"
              >
                {isPast ? 'View' : 'Enter Arena'}
              </Link>
            ) : (
              <a
                href={contest.link}
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
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-bg-primary p-8 font-sans">
        <div className="mx-auto max-w-5xl space-y-12">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-text-primary">CONTESTS</h1>
              <p className="mt-2 text-sm text-text-muted">
                Club-hosted contests only. External platform reminders stay on the club home page.
              </p>
            </div>
            {isAdmin && (
              <Link
                href="/admin/contests/add"
                className="rounded border border-[#39ff8a] px-4 py-2 font-mono text-xs font-bold uppercase tracking-wider text-[#39ff8a] transition-colors hover:bg-[rgba(57,255,138,0.1)]"
              >
                + Add contest
              </Link>
            )}
          </div>

          {isLoading ? (
            <div className="text-text-muted italic">Loading contests...</div>
          ) : (
            <div className="flex flex-col gap-12">
              <section className="flex flex-col gap-6">
                <div className="flex items-center gap-3">
                  <h2 className="text-xl font-bold text-text-primary">UPCOMING</h2>
                  <span className="rounded-full bg-bg-elevated px-2 py-0.5 font-mono text-xs text-text-muted">
                    {upcoming.length}
                  </span>
                </div>
                <div className="flex flex-col gap-4">
                  {upcoming.length === 0 ? (
                    <div className="rounded-lg border border-border-default bg-bg-surface p-6 text-center text-text-muted italic">
                      No upcoming contests scheduled.
                    </div>
                  ) : (
                    upcoming.map((contest) => (
                      <ContestCard key={contest.id} contest={contest} isPast={false} />
                    ))
                  )}
                </div>
              </section>

              <section className="flex flex-col gap-6">
                <div className="flex items-center gap-3">
                  <h2 className="text-xl font-bold text-text-primary">PAST</h2>
                  <span className="rounded-full bg-bg-elevated px-2 py-0.5 font-mono text-xs text-text-muted">
                    {past.length}
                  </span>
                </div>
                <div className="flex flex-col gap-4">
                  {past.length === 0 ? (
                    <div className="rounded-lg border border-border-default bg-bg-surface p-6 text-center text-text-muted italic">
                      No past contests available.
                    </div>
                  ) : (
                    past.map((contest) => (
                      <ContestCard key={contest.id} contest={contest} isPast={true} />
                    ))
                  )}
                </div>
              </section>
            </div>
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
}
