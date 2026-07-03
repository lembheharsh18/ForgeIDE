'use client';

// ── Profile Page ─────────────────────────────────

import { motion } from 'framer-motion';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';

import { ProtectedRoute } from '../../../../components/layout/ProtectedRoute';
import { Avatar } from '../../../../components/ui/Avatar';
import { Badge, type BadgeVariant } from '../../../../components/ui/Badge';
import { DataTable } from '../../../../components/ui/DataTable';
import api from '../../../../lib/axios';

interface ProfileData {
  id: string;
  username: string;
  avatarUrl: string | null;
  codeforcesHandle: string | null;
  createdAt: string;
  leaderboard: {
    score: number;
    solvedCount: number;
    rank: number;
  } | null;
  solvedProblems: Array<{
    id: string;
    title: string;
    platform: string;
    difficulty: string;
  }>;
  submissions: Array<{
    id: string;
    problem: { title: string };
    verdict: string;
    language: string;
    timeMs: number | null;
    memoryKb: number | null;
    createdAt: string;
  }>;
}

interface ActivityData {
  date: string;
  count: number;
}

export default function ProfilePage() {
  const params = useParams();
  const username = params.username as string;

  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [activity, setActivity] = useState<ActivityData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const [profRes, actRes] = await Promise.all([
          api.get(`/api/users/${username}`),
          api.get(`/api/users/${username}/activity`),
        ]);
        setProfile(profRes.data);
        setActivity(actRes.data);
      } catch (err) {
        console.error('Failed to fetch profile', err);
      } finally {
        setIsLoading(false);
      }
    };
    if (username) fetchProfile();
  }, [username]);

  // Heatmap generation
  const generateHeatmap = () => {
    const weeks = 52;
    const days = 7;
    const grid = Array.from({ length: weeks }, () => Array(days).fill(0));

    // Map activity data to date map
    const activityMap = new Map(activity.map((a) => [a.date, a.count]));

    // Fill grid based on last 52 weeks ending today
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Calculate start date (52 weeks ago, aligned to Sunday)
    const startDate = new Date(today);
    startDate.setDate(today.getDate() - (weeks * days - 1) - today.getDay());

    for (let w = 0; w < weeks; w++) {
      for (let d = 0; d < days; d++) {
        const date = new Date(startDate);
        date.setDate(startDate.getDate() + (w * days + d));
        // We skip future dates
        if (date > today) {
          grid[w][d] = -1; // -1 means future/empty cell
          continue;
        }

        const dateStr = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}`;
        const count = activityMap.get(dateStr) || 0;
        grid[w][d] = count;
      }
    }

    return { grid, startDate };
  };

  const getHeatmapColor = (count: number) => {
    if (count === -1) return 'bg-transparent';
    if (count === 0) return 'bg-[#1a1a1a]';
    if (count <= 2) return 'bg-[rgba(232,255,90,0.2)]';
    if (count <= 5) return 'bg-[rgba(232,255,90,0.5)]';
    return 'bg-[#e8ff5a]';
  };

  if (isLoading) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-bg-primary flex items-center justify-center">
          <span className="text-text-muted italic">Loading profile...</span>
        </div>
      </ProtectedRoute>
    );
  }

  if (!profile) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-bg-primary flex items-center justify-center">
          <span className="text-red font-bold">User not found.</span>
        </div>
      </ProtectedRoute>
    );
  }

  const { grid } = generateHeatmap();

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-bg-primary p-8 font-sans">
        <div className="max-w-5xl mx-auto flex flex-col gap-12">
          {/* Header */}
          <div className="flex items-center gap-6">
            <Avatar username={profile.username} url={profile.avatarUrl} size="xl" />
            <div className="flex flex-col gap-1">
              <h1 className="text-3xl font-bold tracking-tight text-text-primary">
                {profile.username}
              </h1>
              <div className="flex flex-wrap items-center gap-4 text-xs font-mono">
                {profile.codeforcesHandle && (
                  <a
                    href={`https://codeforces.com/profile/${profile.codeforcesHandle}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue hover:underline flex items-center gap-1"
                  >
                    CF: {profile.codeforcesHandle} ↗
                  </a>
                )}
                <span className="text-text-muted">
                  Member since{' '}
                  {new Date(profile.createdAt).toLocaleDateString(undefined, {
                    month: 'long',
                    year: 'numeric',
                  })}
                </span>
              </div>
            </div>
          </div>

          {/* Stats Row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-bg-surface border border-border-default rounded-lg p-6 flex flex-col justify-between h-32"
            >
              <span className="text-xs font-mono font-bold tracking-wider text-text-muted">
                SOLVED
              </span>
              <span className="font-mono font-bold text-4xl text-[#39ff8a]">
                {profile.leaderboard?.solvedCount || 0}
              </span>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-bg-surface border border-border-default rounded-lg p-6 flex flex-col justify-between h-32"
            >
              <span className="text-xs font-mono font-bold tracking-wider text-text-muted">
                RANK
              </span>
              <span className="font-mono font-bold text-4xl text-accent">
                {profile.leaderboard?.rank ? `#${profile.leaderboard.rank}` : '-'}
              </span>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-bg-surface border border-border-default rounded-lg p-6 flex flex-col justify-between h-32"
            >
              <span className="text-xs font-mono font-bold tracking-wider text-text-muted">
                SCORE
              </span>
              <span className="font-mono font-bold text-4xl text-text-primary">
                {profile.leaderboard?.score || 0}
              </span>
            </motion.div>
          </div>

          {/* Contribution Heatmap */}
          <div className="flex flex-col gap-4">
            <h2 className="text-sm font-mono font-bold tracking-widest text-text-muted uppercase">
              CONTRIBUTIONS
            </h2>
            <div className="bg-bg-surface border border-border-default rounded-lg p-6 overflow-x-auto custom-scrollbar">
              <div className="flex gap-1 min-w-max">
                {grid.map((week, w) => (
                  <div key={w} className="flex flex-col gap-1">
                    {week.map((count, d) => (
                      <div
                        key={d}
                        title={
                          count > 0 ? `${count} submissions` : count === 0 ? 'No submissions' : ''
                        }
                        className={`w-3 h-3 rounded-sm ${getHeatmapColor(count)} ${count !== -1 && 'hover:ring-1 ring-white/50 transition-all'}`}
                      />
                    ))}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Recent Submissions */}
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-mono font-bold tracking-widest text-text-muted uppercase">
                RECENT SUBMISSIONS
              </h2>
              <Link
                href={`/club/submissions?user=${profile.username}`}
                className="text-xs font-mono text-accent hover:underline"
              >
                VIEW ALL →
              </Link>
            </div>
            {profile.submissions.length === 0 ? (
              <div className="bg-bg-surface border border-border-default rounded-lg p-8 text-center text-text-muted italic">
                No recent submissions.
              </div>
            ) : (
              <DataTable
                data={profile.submissions}
                columns={[
                  {
                    key: 'problem',
                    header: 'Problem',
                    render: (s) => (
                      <span className="font-bold text-text-primary">{s.problem.title}</span>
                    ),
                  },
                  {
                    key: 'verdict',
                    header: 'Verdict',
                    render: (s) => (
                      <Badge variant={`verdict-${s.verdict}` as BadgeVariant} label={s.verdict} />
                    ),
                  },
                  {
                    key: 'language',
                    header: 'Language',
                    render: (s) => (
                      <span className="font-mono text-xs text-text-muted">{s.language}</span>
                    ),
                  },
                  {
                    key: 'submitted',
                    header: 'Submitted',
                    render: (s) => (
                      <span className="font-mono text-xs text-text-muted">
                        {new Date(s.createdAt).toLocaleDateString()}
                      </span>
                    ),
                  },
                ]}
              />
            )}
          </div>

          {/* Solved Problems */}
          <div className="flex flex-col gap-4">
            <h2 className="text-sm font-mono font-bold tracking-widest text-text-muted uppercase">
              SOLVED PROBLEMS
            </h2>
            {profile.solvedProblems.length === 0 ? (
              <div className="bg-bg-surface border border-border-default rounded-lg p-8 text-center text-text-muted italic">
                No problems solved yet.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {profile.solvedProblems.map((p) => (
                  <Link
                    key={p.id}
                    href={`/ide?problem=${p.id}`}
                    className="bg-bg-surface border border-border-default rounded-lg p-4 hover:border-border-subtle transition-colors flex flex-col gap-2"
                  >
                    <span className="font-bold text-sm text-text-primary truncate">{p.title}</span>
                    <div className="flex items-center gap-2">
                      <Badge
                        variant={`platform-${p.platform}` as BadgeVariant}
                        label={p.platform}
                      />
                      <Badge
                        variant={`difficulty-${p.difficulty.toUpperCase()}` as BadgeVariant}
                        label={p.difficulty}
                      />
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
