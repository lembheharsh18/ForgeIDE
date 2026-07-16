'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';

import { ProtectedRoute } from '../../../../components/layout/ProtectedRoute';
import { Topbar } from '../../../../components/layout/Topbar';
import api from '../../../../lib/axios';

interface StandingsEntry {
  rank: number;
  userId: string;
  username: string;
  avatarUrl: string | null;
  solvedCount: number;
  totalPenalty: number;
  problemStatuses: {
    problemId: string;
    solved: boolean;
    timeMinutes: number | null;
  }[];
}

interface ContestLeaderboard {
  contestId: string;
  contestName: string;
  problems: { id: string; title: string }[];
  standings: StandingsEntry[];
}

export default function ContestLeaderboardPage() {
  const params = useParams();
  const contestId = params?.contestId as string;
  const [data, setData] = useState<ContestLeaderboard | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!contestId) return;

    const fetchLeaderboard = async () => {
      try {
        setIsLoading(true);
        const res = await api.get(`/api/contests/${contestId}/leaderboard`);
        setData(res.data);
      } catch (err: any) {
        setError(err.response?.data?.error || 'Failed to load leaderboard');
      } finally {
        setIsLoading(false);
      }
    };

    fetchLeaderboard();

    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchLeaderboard, 30000);
    return () => clearInterval(interval);
  }, [contestId]);

  if (isLoading && !data) {
    return (
      <ProtectedRoute>
        <div className="flex flex-col h-screen bg-bg-primary text-text-primary">
          <Topbar />
          <div className="flex-1 flex items-center justify-center">
            <div className="flex flex-col items-center gap-4">
              <div className="w-8 h-8 rounded-full border-2 border-border-subtle border-t-accent animate-spin" />
              <p className="text-text-muted font-mono text-sm">Loading standings...</p>
            </div>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  if (error || !data) {
    return (
      <ProtectedRoute>
        <div className="flex flex-col h-screen bg-bg-primary text-text-primary">
          <Topbar />
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center p-8 bg-bg-surface border border-red-500/30 rounded-lg max-w-md">
              <h2 className="text-red-500 font-bold mb-2">Error</h2>
              <p className="text-text-muted font-mono text-sm">
                {error || 'Leaderboard not found'}
              </p>
              <Link
                href="/contests"
                className="mt-6 inline-block text-accent hover:underline font-mono text-xs"
              >
                ← Back to Contests
              </Link>
            </div>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-bg-primary font-sans flex flex-col">
        <Topbar />

        <div className="flex-1 p-8">
          <div className="mx-auto max-w-6xl space-y-8">
            <div className="flex items-center justify-between">
              <div>
                <Link
                  href={`/contests/${contestId}`}
                  className="text-text-muted hover:text-text-primary transition-colors mb-2 inline-block font-mono text-xs"
                >
                  ← Back to Arena
                </Link>
                <h1 className="text-3xl font-bold tracking-tight text-text-primary font-syne">
                  {data.contestName}
                </h1>
                <p className="mt-1 text-sm text-text-muted font-mono tracking-widest uppercase">
                  Live Standings
                </p>
              </div>
            </div>

            <div className="rounded-lg border border-border-default bg-bg-surface overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-border-subtle bg-bg-elevated font-mono text-[10px] uppercase tracking-wider text-text-muted">
                      <th className="px-6 py-4 font-semibold w-16">#</th>
                      <th className="px-6 py-4 font-semibold">Participant</th>
                      <th className="px-6 py-4 font-semibold text-center w-24">=</th>
                      <th className="px-6 py-4 font-semibold text-center w-24">Penalty</th>
                      {data.problems.map((p, i) => (
                        <th
                          key={p.id}
                          className="px-4 py-4 font-semibold text-center w-20 border-l border-border-subtle/50"
                          title={p.title}
                        >
                          {String.fromCharCode(65 + i)}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {data.standings.length === 0 ? (
                      <tr>
                        <td
                          colSpan={4 + data.problems.length}
                          className="px-6 py-8 text-center text-text-muted italic font-mono text-xs"
                        >
                          No accepted submissions yet.
                        </td>
                      </tr>
                    ) : (
                      data.standings.map((entry, index) => (
                        <motion.tr
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.05 }}
                          key={entry.userId}
                          className="border-b border-border-subtle/50 hover:bg-bg-elevated transition-colors"
                        >
                          <td className="px-6 py-3 font-mono text-xs text-text-secondary">
                            {entry.rank}
                          </td>
                          <td className="px-6 py-3">
                            <div className="flex items-center gap-3">
                              {entry.avatarUrl ? (
                                <img
                                  src={entry.avatarUrl}
                                  alt={entry.username}
                                  className="w-6 h-6 rounded-full"
                                />
                              ) : (
                                <div className="w-6 h-6 rounded-full bg-border-default flex items-center justify-center text-[10px] font-bold">
                                  {entry.username[0].toUpperCase()}
                                </div>
                              )}
                              <span className="font-mono text-sm font-bold text-text-primary">
                                {entry.username}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-3 text-center font-mono text-sm font-bold text-text-primary">
                            {entry.solvedCount}
                          </td>
                          <td className="px-6 py-3 text-center font-mono text-xs text-text-muted">
                            {entry.totalPenalty}
                          </td>
                          {data.problems.map((p) => {
                            const status = entry.problemStatuses.find(
                              (ps) => ps.problemId === p.id,
                            );
                            return (
                              <td
                                key={p.id}
                                className="px-4 py-3 text-center border-l border-border-subtle/50"
                              >
                                {status?.solved ? (
                                  <div className="flex flex-col items-center">
                                    <span className="text-green-500 font-bold text-sm">+</span>
                                    <span className="text-[9px] text-text-muted font-mono">
                                      {status.timeMinutes}
                                    </span>
                                  </div>
                                ) : (
                                  <span className="text-text-muted/30 font-mono text-xs">-</span>
                                )}
                              </td>
                            );
                          })}
                        </motion.tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
