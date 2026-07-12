'use client';

import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { motion } from 'framer-motion';

import api from '../../lib/axios';

interface Contest {
  id: number;
  name: string;
  type: string;
  phase: string;
  startTimeSeconds: number;
  durationSeconds: number;
}

export function ContestReminders() {
  const { data, isLoading, error } = useQuery<{
    upcoming: Contest[];
    previous: Contest[];
  }>({
    queryKey: ['contest-reminders'],
    queryFn: async () => {
      const res = await api.get('/api/reminders/contests');
      return res.data;
    },
    refetchInterval: 5 * 60 * 1000, // 5 min
  });

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-6 w-1/3 bg-[var(--bg-elevated)] rounded"></div>
        <div className="h-24 bg-[var(--bg-elevated)] rounded"></div>
        <div className="h-24 bg-[var(--bg-elevated)] rounded"></div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="text-[var(--text-muted)] text-sm border border-[var(--border-subtle)] p-4 rounded-lg bg-[var(--bg-surface)]">
        Failed to load contest reminders.
      </div>
    );
  }

  const formatTime = (seconds: number) => {
    return format(new Date(seconds * 1000), 'MMM d, yyyy h:mm a');
  };

  const getDuration = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    return `${hrs}h ${mins}m`;
  };

  return (
    <div className="space-y-8">
      {/* Upcoming Contests */}
      <div>
        <h3 className="text-sm font-bold tracking-widest uppercase text-[var(--text-secondary)] mb-4 font-mono">
          <span className="text-[var(--accent)] mr-2">●</span>
          Upcoming CF Contests
        </h3>
        {data.upcoming.length === 0 ? (
          <p className="text-xs text-[var(--text-muted)]">No upcoming contests scheduled.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {data.upcoming.map((contest, i) => (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                key={contest.id}
                className="p-4 rounded-lg border transition-all duration-300 hover:-translate-y-1"
                style={{
                  backgroundColor: 'var(--bg-surface)',
                  borderColor: 'var(--border-subtle)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = 'var(--accent)';
                  e.currentTarget.style.boxShadow = '0 8px 30px rgba(232, 255, 90, 0.05)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'var(--border-subtle)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                <h4 className="font-bold text-sm truncate mb-2" title={contest.name}>
                  {contest.name}
                </h4>
                <div className="flex flex-col gap-1 text-[11px] text-[var(--text-muted)] font-mono">
                  <div className="flex justify-between">
                    <span>Date:</span>
                    <span className="text-[var(--text-primary)]">
                      {formatTime(contest.startTimeSeconds)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Duration:</span>
                    <span className="text-[var(--text-primary)]">
                      {getDuration(contest.durationSeconds)}
                    </span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Previous Contests */}
      <div>
        <h3 className="text-sm font-bold tracking-widest uppercase text-[var(--text-secondary)] mb-4 font-mono">
          Previous CF Contests
        </h3>
        {data.previous.length === 0 ? (
          <p className="text-xs text-[var(--text-muted)]">No previous contests found.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 opacity-70">
            {data.previous.map((contest, i) => (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + i * 0.1 }}
                key={contest.id}
                className="p-4 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)]"
              >
                <h4
                  className="font-bold text-sm truncate mb-2 text-[var(--text-secondary)]"
                  title={contest.name}
                >
                  {contest.name}
                </h4>
                <div className="flex flex-col gap-1 text-[11px] text-[var(--text-muted)] font-mono">
                  <div className="flex justify-between">
                    <span>Ended:</span>
                    <span>{formatTime(contest.startTimeSeconds)}</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
