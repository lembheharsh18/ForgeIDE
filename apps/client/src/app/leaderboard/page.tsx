'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { useEffect, useState } from 'react';

import { ProtectedRoute } from '../../components/layout/ProtectedRoute';
import { Avatar } from '../../components/ui/Avatar';
import api from '../../lib/axios';
import { useAuthStore } from '../../store/authStore';

type SortKey = 'rating' | 'solved' | 'rank';
type PlatformFilter = 'ALL' | 'CODEFORCES' | 'LEETCODE' | 'CODECHEF' | 'GFG';

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

interface LeaderboardResponse {
  source: string;
  message: string;
  sort: SortKey;
  platform: PlatformFilter;
  entries: LeaderboardEntry[];
}

const sortOptions: Array<{ value: SortKey; label: string }> = [
  { value: 'rating', label: 'Aggregated rating' },
  { value: 'solved', label: 'Problems solved' },
  { value: 'rank', label: 'Rank' },
];

const platformOptions: Array<{ value: PlatformFilter; label: string }> = [
  { value: 'ALL', label: 'All platforms' },
  { value: 'CODEFORCES', label: 'Codeforces' },
  { value: 'LEETCODE', label: 'LeetCode' },
  { value: 'CODECHEF', label: 'CodeChef' },
  { value: 'GFG', label: 'GFG' },
];

export default function LeaderboardPage() {
  const { user } = useAuthStore();
  const [sort, setSort] = useState<SortKey>('rating');
  const [platform, setPlatform] = useState<PlatformFilter>('ALL');
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [source, setSource] = useState('LOCAL_LEADERBOARD_FALLBACK');
  const [sourceMessage, setSourceMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      setIsLoading(true);
      try {
        const res = await api.get<LeaderboardResponse>('/api/leaderboard', {
          params: { sort, platform },
        });
        setLeaderboard(res.data.entries);
        setSource(res.data.source);
        setSourceMessage(res.data.message);
      } catch (err) {
        console.error('Failed to fetch leaderboard', err);
        setLeaderboard([]);
        setSourceMessage('Unable to load leaderboard data.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchLeaderboard();
  }, [sort, platform]);

  const maxScore = leaderboard.length > 0 ? Math.max(...leaderboard.map((e) => e.score), 1) : 1;

  const getRankColor = (rank: number) => {
    if (rank === 1) return 'text-[#e8ff5a]';
    if (rank === 2) return 'text-[#aaaaaa]';
    if (rank === 3) return 'text-[#ff8c42]';
    return 'text-text-muted';
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-bg-primary p-8 font-sans">
        <div className="mx-auto flex max-w-6xl flex-col gap-8">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-text-primary">LEADERBOARD</h1>
              <p className="mt-2 text-sm text-text-muted">
                Full all-platform leaderboard view. Current data source is flagged below.
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <label className="flex flex-col gap-1">
                <span className="font-mono text-[10px] uppercase tracking-widest text-text-muted">
                  Sort
                </span>
                <select
                  value={sort}
                  onChange={(e) => setSort(e.target.value as SortKey)}
                  className="rounded border border-border-default bg-bg-surface px-3 py-2 text-sm text-text-primary outline-none focus:border-accent"
                >
                  {sortOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="flex flex-col gap-1">
                <span className="font-mono text-[10px] uppercase tracking-widest text-text-muted">
                  Platform
                </span>
                <select
                  value={platform}
                  onChange={(e) => setPlatform(e.target.value as PlatformFilter)}
                  className="rounded border border-border-default bg-bg-surface px-3 py-2 text-sm text-text-primary outline-none focus:border-accent"
                >
                  {platformOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </div>

          <div className="rounded border border-border-default bg-bg-surface p-4">
            <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
              <span className="w-fit rounded border border-border-subtle px-2 py-1 font-mono text-[10px] uppercase tracking-widest text-text-muted">
                {source}
              </span>
              <span className="text-xs text-text-muted">{sourceMessage}</span>
            </div>
          </div>

          <div className="flex flex-col overflow-hidden rounded-lg border border-border-default bg-bg-surface">
            <div className="grid grid-cols-[80px_1fr_120px_120px_150px] items-center border-b border-border-subtle bg-bg-elevated px-6 py-4">
              <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-text-muted">
                Rank
              </span>
              <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-text-muted">
                User
              </span>
              <span className="text-right font-mono text-[10px] font-bold uppercase tracking-wider text-text-muted">
                Rating
              </span>
              <span className="text-center font-mono text-[10px] font-bold uppercase tracking-wider text-text-muted">
                Solved
              </span>
              <span className="text-right font-mono text-[10px] font-bold uppercase tracking-wider text-text-muted">
                Last active
              </span>
            </div>

            {isLoading ? (
              <div className="p-12 text-center text-text-muted italic">Loading leaderboard...</div>
            ) : leaderboard.length === 0 ? (
              <div className="p-12 text-center text-text-muted italic">
                No leaderboard entries match this filter.
              </div>
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
                    className={`grid grid-cols-[80px_1fr_120px_120px_150px] items-center border-b border-border-subtle px-6 py-4 transition-colors hover:bg-[rgba(255,255,255,0.02)] ${
                      isCurrentUser ? 'border-y border-accent bg-[rgba(232,255,90,0.03)]' : ''
                    }`}
                  >
                    <span className={`font-mono text-xl font-bold ${rankColor}`}>
                      #{entry.rank}
                    </span>

                    <div className="flex items-center gap-4">
                      <Avatar username={entry.username} url={entry.avatarUrl} size="md" />
                      <div className="flex flex-col">
                        <Link
                          href={`/club/profile/${entry.username}`}
                          className="text-sm font-bold text-text-primary transition-colors hover:text-accent"
                        >
                          {entry.username}
                        </Link>
                        {entry.codeforcesHandle && (
                          <a
                            href={`https://codeforces.com/profile/${entry.codeforcesHandle}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-mono text-[10px] text-blue hover:underline"
                          >
                            CF: {entry.codeforcesHandle}
                          </a>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-col items-end justify-center pr-4">
                      <span className="font-mono text-lg font-bold text-[#39ff8a]">
                        {entry.score}
                      </span>
                      <div className="mt-1 h-0.5 w-full overflow-hidden rounded bg-bg-elevated">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${(entry.score / maxScore) * 100}%` }}
                          transition={{
                            duration: 0.5,
                            ease: 'easeOut',
                            delay: index * 0.04 + 0.4,
                          }}
                          className="h-full bg-accent"
                        />
                      </div>
                    </div>

                    <span className="text-center font-mono text-text-muted">
                      {entry.solvedCount}
                    </span>

                    <span className="text-right font-mono text-[10px] uppercase text-text-muted">
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
    </ProtectedRoute>
  );
}
