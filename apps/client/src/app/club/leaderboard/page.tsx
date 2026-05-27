'use client';

// ── Leaderboard Page ─────────────────────────────

import { motion } from 'framer-motion';
import Link from 'next/link';
import { useEffect, useState } from 'react';

import { ProtectedRoute } from '../../../components/layout/ProtectedRoute';
import { Avatar } from '../../../components/ui/Avatar';
import api from '../../../lib/axios';
import { useAuthStore } from '../../../store/authStore';

interface LeaderboardEntry {
  rank: number;
  userId: string;
  username: string;
  avatarUrl: string | null;
  codeforcesHandle: string | null;
  score: number;
  solvedCount: number;
  updatedAt: string;
}

export default function LeaderboardPage() {
  const { user } = useAuthStore();
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        const res = await api.get('/api/leaderboard');
        setLeaderboard(res.data);
      } catch (err) {
        console.error('Failed to fetch leaderboard', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchLeaderboard();

    // Auto-refresh every 60s
    const interval = setInterval(fetchLeaderboard, 60000);
    return () => clearInterval(interval);
  }, []);

  const maxScore = leaderboard.length > 0 ? Math.max(...leaderboard.map((e) => e.score), 1) : 1;

  const getRankColor = (rank: number) => {
    if (rank === 1) return 'text-[#e8ff5a]'; // Gold (Accent)
    if (rank === 2) return 'text-[#aaaaaa]'; // Silver
    if (rank === 3) return 'text-[#ff8c42]'; // Bronze
    return 'text-text-muted';
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-bg-primary p-8 font-sans">
        <div className="max-w-6xl mx-auto flex flex-col gap-8 relative">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold tracking-tight text-text-primary">LEADERBOARD</h1>
            <span className="text-xs font-mono text-text-muted">UPDATED REAL-TIME</span>
          </div>

          <div className="bg-bg-surface border border-border-default rounded-lg overflow-hidden flex flex-col">
            {/* Table Header */}
            <div className="grid grid-cols-[80px_1fr_120px_120px_150px] items-center px-6 py-4 bg-bg-elevated border-b border-border-subtle shrink-0">
              <span className="text-[10px] font-mono font-bold text-text-muted uppercase tracking-wider">
                RANK
              </span>
              <span className="text-[10px] font-mono font-bold text-text-muted uppercase tracking-wider">
                USER
              </span>
              <span className="text-[10px] font-mono font-bold text-text-muted uppercase tracking-wider text-right">
                SCORE
              </span>
              <span className="text-[10px] font-mono font-bold text-text-muted uppercase tracking-wider text-center">
                SOLVED
              </span>
              <span className="text-[10px] font-mono font-bold text-text-muted uppercase tracking-wider text-right">
                LAST ACTIVE
              </span>
            </div>

            {/* Table Body */}
            <div className="flex flex-col">
              {isLoading ? (
                <div className="p-12 text-center text-text-muted italic">
                  Loading leaderboard...
                </div>
              ) : leaderboard.length === 0 ? (
                <div className="p-12 text-center text-text-muted italic">No data available.</div>
              ) : (
                leaderboard.map((entry, index) => {
                  const isCurrentUser = user?.id === entry.userId;
                  const rankColor = getRankColor(entry.rank);

                  return (
                    <motion.div
                      key={entry.userId}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.04 }}
                      className={`grid grid-cols-[80px_1fr_120px_120px_150px] items-center px-6 py-4 border-b border-border-subtle transition-colors hover:bg-[rgba(255,255,255,0.02)] ${isCurrentUser ? 'bg-[rgba(232,255,90,0.03)] border-accent border-y sticky bottom-0 z-10' : ''}`}
                    >
                      {/* Rank */}
                      <span className={`font-mono font-bold text-xl ${rankColor}`}>
                        #{entry.rank}
                      </span>

                      {/* User */}
                      <div className="flex items-center gap-4">
                        <Avatar username={entry.username} url={entry.avatarUrl} size="md" />
                        <div className="flex flex-col">
                          <Link
                            href={`/club/profile/${entry.username}`}
                            className="font-sans font-bold text-sm text-text-primary hover:text-accent transition-colors"
                          >
                            {entry.username}
                          </Link>
                          {entry.codeforcesHandle && (
                            <a
                              href={`https://codeforces.com/profile/${entry.codeforcesHandle}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[10px] font-mono text-blue hover:underline"
                            >
                              CF: {entry.codeforcesHandle}
                            </a>
                          )}
                        </div>
                      </div>

                      {/* Score */}
                      <div className="flex flex-col items-end justify-center pr-4">
                        <span className="font-mono font-bold text-lg text-[#39ff8a]">
                          {entry.score}
                        </span>
                        {/* Score Bar */}
                        <div className="w-full bg-bg-elevated h-0.5 mt-1 rounded overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${(entry.score / maxScore) * 100}%` }}
                            transition={{ duration: 0.5, ease: 'easeOut' }}
                            className="h-full bg-accent"
                          />
                        </div>
                      </div>

                      {/* Solved */}
                      <span className="text-center font-mono text-text-muted">
                        {entry.solvedCount}
                      </span>

                      {/* Last Active */}
                      <span className="text-right text-[10px] font-mono text-text-muted uppercase">
                        {new Date(entry.updatedAt).toLocaleDateString(undefined, {
                          month: 'short',
                          day: 'numeric',
                        })}
                      </span>
                    </motion.div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
