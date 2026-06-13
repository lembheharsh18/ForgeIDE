'use client';

// ── Club Dashboard ───────────────────────────────

import { motion } from 'framer-motion';
import Link from 'next/link';
import { useEffect, useState } from 'react';

import { ProtectedRoute } from '../../../components/layout/ProtectedRoute';
import { AnimatedNumber } from '../../../components/ui/AnimatedNumber';
import { Avatar } from '../../../components/ui/Avatar';
import { Badge, type BadgeVariant } from '../../../components/ui/Badge';
import { Countdown } from '../../../components/ui/Countdown';
import api from '../../../lib/axios';

interface DashboardStats {
  members: number;
  solved: number;
  rank: number;
  activeContests: number;
}

interface RecentSubmission {
  id: string;
  username: string;
  avatarUrl: string | null;
  problemTitle: string;
  verdict: string;
  createdAt: string;
}

interface UpcomingContest {
  id: string;
  name: string;
  platform: string;
  startTime: string;
}

interface ProblemOfDay {
  id: string;
  title: string;
  difficulty: string;
}

export default function ClubDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recent, setRecent] = useState<RecentSubmission[]>([]);
  const [contests, setContests] = useState<UpcomingContest[]>([]);
  const [pod, setPod] = useState<ProblemOfDay | null>(null);

  // Fetch Dashboard Data
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch recent submissions
        const resRecent = await api.get('/api/submissions/recent');
        setRecent(resRecent.data);

        // Fetch contests
        const resContests = await api.get('/api/contests');
        setContests(resContests.data.upcoming.slice(0, 3));

        // In a real app we'd fetch stats and POD from a dedicated endpoint
        // Here we simulate it by fetching leaderboard and problems
        const resLeaderboard = await api.get('/api/leaderboard');
        const membersCount = resLeaderboard.data.length;
        const totalSolved = resLeaderboard.data.reduce(
          (acc: number, cur: any) => acc + cur.solvedCount,
          0,
        );

        // Find current user's rank (mocking user as index 0 for simplicity if not found)
        // In a real app, useAuthStore to get current userId
        const myRank = resLeaderboard.data[0]?.rank || 0;

        setStats({
          members: membersCount,
          solved: totalSolved,
          rank: myRank,
          activeContests: resContests.data.upcoming.length,
        });

        // Fetch random problem
        const resProblems = await api.get('/api/problems?limit=10');
        if (resProblems.data.problems.length > 0) {
          const p =
            resProblems.data.problems[Math.floor(Math.random() * resProblems.data.problems.length)];
          setPod(p);
        }
      } catch (err) {
        console.error('Failed to fetch dashboard data', err);
      }
    };

    fetchData();
    // Auto refresh submissions every 30s
    const interval = setInterval(async () => {
      try {
        const resRecent = await api.get('/api/submissions/recent');
        setRecent(resRecent.data);
      } catch (err) {
        // ignore background refresh errors
      }
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const statCards = [
    { title: 'MEMBERS', value: stats?.members ?? 0, color: 'text-blue', prefix: '' },
    { title: 'PROBLEMS SOLVED', value: stats?.solved ?? 0, color: 'text-[#39ff8a]', prefix: '' },
    { title: 'YOUR RANK', value: stats?.rank ?? 0, color: 'text-accent', prefix: '#' },
    {
      title: 'ACTIVE CONTESTS',
      value: stats?.activeContests ?? 0,
      color: 'text-orange',
      prefix: '',
    },
  ];

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-bg-primary p-8 font-sans">
        <div className="max-w-7xl mx-auto space-y-8">
          {/* Header */}
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold tracking-tight text-text-primary">DASHBOARD</h1>
            <div className="flex gap-4">
              <Link
                href="/club/problems"
                className="text-sm font-mono text-text-muted hover:text-accent transition-colors"
              >
                PROBLEMS
              </Link>
              <Link
                href="/club/contests"
                className="text-sm font-mono text-text-muted hover:text-accent transition-colors"
              >
                CONTESTS
              </Link>
              <Link
                href="/club/leaderboard"
                className="text-sm font-mono text-text-muted hover:text-accent transition-colors"
              >
                LEADERBOARD
              </Link>
            </div>
          </div>

          {/* Stats Row */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {statCards.map((stat, i) => (
              <motion.div
                key={stat.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: i * 0.1 }}
                className="bg-bg-surface border border-border-subtle rounded-lg p-5 flex flex-col justify-between h-32"
              >
                <span className="text-xs font-mono font-bold tracking-wider text-text-muted">
                  {stat.title}
                </span>
                <span className={`font-mono font-bold text-4xl ${stat.color}`}>
                  {typeof stat.value === 'number' ? (
                    <AnimatedNumber
                      value={stat.value}
                      delay={i * 100 + 300}
                      prefix={stat.prefix || ''}
                    />
                  ) : (
                    stat.value
                  )}
                </span>
              </motion.div>
            ))}
          </div>

          {/* Main Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Left: Recent Activity Feed (60%) */}
            <div className="lg:col-span-7 xl:col-span-8 flex flex-col gap-4">
              <h2 className="text-sm font-mono font-bold tracking-widest text-text-muted">
                RECENT SUBMISSIONS
              </h2>
              <div className="bg-bg-surface border border-border-default rounded-lg flex flex-col overflow-hidden">
                {recent.length === 0 ? (
                  <div className="p-8 text-center text-text-muted italic">No recent activity</div>
                ) : (
                  recent.map((sub, i) => (
                    <div
                      key={sub.id}
                      className={`flex items-center justify-between p-4 ${i !== recent.length - 1 ? 'border-b border-border-subtle' : ''}`}
                    >
                      <div className="flex items-center gap-3">
                        <Avatar username={sub.username} url={sub.avatarUrl} size="md" />
                        <div className="flex flex-col">
                          <Link
                            href={`/club/profile/${sub.username}`}
                            className="font-mono text-xs text-accent hover:underline"
                          >
                            {sub.username}
                          </Link>
                          <span className="text-sm text-text-muted">{sub.problemTitle}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <Badge
                          variant={`verdict-${sub.verdict}` as BadgeVariant}
                          label={sub.verdict}
                        />
                        <span className="text-xs text-text-muted font-mono w-16 text-right">
                          {Math.max(
                            1,
                            Math.floor(
                              (new Date().getTime() - new Date(sub.createdAt).getTime()) / 60000,
                            ),
                          )}
                          m ago
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Right: Widgets (40%) */}
            <div className="lg:col-span-5 xl:col-span-4 flex flex-col gap-8">
              {/* Upcoming Contests */}
              <div className="flex flex-col gap-4">
                <h2 className="text-sm font-mono font-bold tracking-widest text-text-muted">
                  UPCOMING CONTESTS
                </h2>
                <div className="bg-bg-surface border border-border-default rounded-lg p-5 flex flex-col gap-5">
                  {contests.length === 0 ? (
                    <div className="text-center text-text-muted italic py-4">
                      No upcoming contests
                    </div>
                  ) : (
                    contests.map((contest) => (
                      <div
                        key={contest.id}
                        className="flex flex-col gap-2 pb-4 border-b border-border-subtle last:border-0 last:pb-0"
                      >
                        <div className="flex items-center justify-between">
                          <Badge
                            variant={`platform-${contest.platform}` as BadgeVariant}
                            label={contest.platform}
                          />
                          <Countdown targetDate={contest.startTime} />
                        </div>
                        <span className="font-bold text-text-primary text-sm truncate">
                          {contest.name}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Problem of the Day */}
              <div className="flex flex-col gap-4">
                <h2 className="text-sm font-mono font-bold tracking-widest text-text-muted">
                  SOLVE TODAY
                </h2>
                {pod ? (
                  <div className="bg-bg-surface border border-border-default rounded-lg p-5 flex flex-col gap-4 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-accent opacity-5 rounded-full -mr-16 -mt-16 transition-transform group-hover:scale-150" />
                    <Badge
                      variant={`difficulty-${pod.difficulty.toUpperCase()}` as BadgeVariant}
                      label={pod.difficulty}
                      className="w-fit"
                    />
                    <span className="font-bold text-lg text-text-primary">{pod.title}</span>
                    <Link
                      href={`/editor?problem=${pod.id}`}
                      className="mt-2 text-xs font-mono font-bold tracking-wider text-accent hover:text-[#fbbf24] transition-colors flex items-center gap-1"
                    >
                      OPEN IN FORGE IDE <span className="text-[10px]">→</span>
                    </Link>
                  </div>
                ) : (
                  <div className="bg-bg-surface border border-border-default rounded-lg p-5 text-center text-text-muted italic">
                    Loading problem...
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
