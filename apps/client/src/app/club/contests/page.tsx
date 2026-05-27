'use client';

// ── Contests Page ────────────────────────────────

import { motion } from 'framer-motion';
import Link from 'next/link';
import { useEffect, useState } from 'react';

import { ProtectedRoute } from '../../../components/layout/ProtectedRoute';
import { Badge, type BadgeVariant } from '../../../components/ui/Badge';
import { Countdown } from '../../../components/ui/Countdown';
import api from '../../../lib/axios';
import { useAuthStore } from '../../../store/authStore';

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

  const ContestCard = ({ contest, isPast }: { contest: Contest; isPast: boolean }) => (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-bg-surface border border-border-default rounded-lg p-5 flex flex-col md:flex-row md:items-center justify-between gap-6 hover:border-border-subtle transition-colors"
    >
      {/* Left */}
      <div className="flex flex-col gap-2 flex-1">
        <div className="flex items-center gap-3">
          <Badge
            variant={`platform-${contest.platform}` as BadgeVariant}
            label={contest.platform}
          />
          <h3 className="font-sans font-bold text-lg text-text-primary">{contest.name}</h3>
        </div>
        {contest.description && (
          <p className="text-sm text-text-muted line-clamp-2">{contest.description}</p>
        )}
        <div className="mt-2 flex items-center gap-4 text-xs font-mono text-text-muted">
          <span>
            {formatDate(contest.startTime)} — {formatDate(contest.endTime)}
          </span>
          <span>•</span>
          <span>{contest.participantCount} Participants</span>
        </div>
      </div>

      {/* Right */}
      <div className="flex flex-col items-end gap-4 shrink-0">
        {!isPast ? (
          <Countdown targetDate={contest.startTime} />
        ) : (
          <span className="text-sm font-mono text-text-muted italic">
            Ended {getDaysAgo(contest.endTime)}
          </span>
        )}

        <div className="flex items-center gap-3">
          {isAdmin && (
            <button className="text-[10px] font-mono font-bold tracking-wider text-text-muted hover:text-text-primary px-2">
              EDIT
            </button>
          )}
          <a
            href={contest.link}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs font-mono font-bold tracking-wider text-bg-primary bg-accent px-4 py-1.5 rounded hover:bg-[#fbbf24] transition-colors"
          >
            {isPast ? 'VIEW CONTEST ↗' : 'REGISTER ↗'}
          </a>
        </div>
      </div>
    </motion.div>
  );

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-bg-primary p-8 font-sans">
        <div className="max-w-5xl mx-auto space-y-12">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold tracking-tight text-text-primary">CONTESTS</h1>
            {isAdmin && (
              <Link
                href="/admin/contests/add"
                className="text-xs font-mono font-bold tracking-wider text-[#39ff8a] border border-[#39ff8a] px-4 py-2 rounded hover:bg-[rgba(57,255,138,0.1)] transition-colors"
              >
                + ADD CONTEST
              </Link>
            )}
          </div>

          {isLoading ? (
            <div className="text-text-muted italic">Loading contests...</div>
          ) : (
            <div className="flex flex-col gap-12">
              {/* Upcoming */}
              <section className="flex flex-col gap-6">
                <div className="flex items-center gap-3">
                  <h2 className="text-xl font-bold text-text-primary">UPCOMING</h2>
                  <span className="bg-bg-elevated text-text-muted text-xs font-mono px-2 py-0.5 rounded-full">
                    {upcoming.length}
                  </span>
                </div>
                <div className="flex flex-col gap-4">
                  {upcoming.length === 0 ? (
                    <div className="text-text-muted italic bg-bg-surface p-6 rounded-lg text-center border border-border-default">
                      No upcoming contests scheduled.
                    </div>
                  ) : (
                    upcoming.map((c) => <ContestCard key={c.id} contest={c} isPast={false} />)
                  )}
                </div>
              </section>

              {/* Past */}
              <section className="flex flex-col gap-6">
                <div className="flex items-center gap-3">
                  <h2 className="text-xl font-bold text-text-primary">PAST</h2>
                  <span className="bg-bg-elevated text-text-muted text-xs font-mono px-2 py-0.5 rounded-full">
                    {past.length}
                  </span>
                </div>
                <div className="flex flex-col gap-4">
                  {past.length === 0 ? (
                    <div className="text-text-muted italic bg-bg-surface p-6 rounded-lg text-center border border-border-default">
                      No past contests available.
                    </div>
                  ) : (
                    past.map((c) => <ContestCard key={c.id} contest={c} isPast={true} />)
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
