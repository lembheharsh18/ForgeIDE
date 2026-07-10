'use client';

import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

import { Topbar } from '../../components/layout/Topbar';
import { ProfileSettingsModal } from '../../components/ui/ProfileSettingsModal';
import api from '../../lib/axios';
import { useAuthStore } from '../../store/authStore';

interface PlatformProfile {
  cfRating: number | null;
  cfRank: string | null;
  lcRating: number | null;
  ccRating: number | null;
  ccStars: number | null;
  updatedAt: string;
}

export default function ProfilePage() {
  const { user, isAuthenticated, isLoading } = useAuthStore();
  const [platformStats, setPlatformStats] = useState<PlatformProfile | null>(null);
  const [loadingStats, setLoadingStats] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  useEffect(() => {
    if (isAuthenticated && user?.username) {
      setLoadingStats(true);
      api
        .get(`/api/users/${user.username}/platform-profiles`)
        .then((res) => setPlatformStats(res.data))
        .catch(() => {})
        .finally(() => setLoadingStats(false));
    }
  }, [isAuthenticated, user]);

  if (isLoading) return null;
  if (!isAuthenticated || !user) {
    return (
      <main className="min-h-screen bg-bg-primary text-text-primary">
        <Topbar />
        <div className="flex justify-center mt-20">Please log in to view your profile.</div>
      </main>
    );
  }

  return (
    <main className="min-h-screen flex flex-col bg-bg-primary text-text-primary">
      <Topbar />

      <div className="max-w-4xl w-full mx-auto p-6 mt-8">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col gap-6"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 bg-bg-surface border border-border-subtle rounded-lg">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-accent flex items-center justify-center text-2xl font-bold text-[#0a0a0a] font-mono">
                {user.username.slice(0, 2).toUpperCase()}
              </div>
              <div>
                <h1 className="text-2xl font-bold font-syne tracking-wider m-0">{user.username}</h1>
                <p className="text-xs text-text-muted font-mono mt-1">
                  Member since{' '}
                  {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'recently'}
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowSettings(true)}
              className="px-4 py-2 rounded text-xs font-bold tracking-wider font-mono border border-border-default transition-colors hover:border-accent hover:text-accent"
            >
              EDIT PROFILE
            </button>
          </div>

          {/* Platform Stats Grid */}
          <h2 className="text-sm font-bold font-syne tracking-widest mt-4">COMPETITIVE PROFILES</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Codeforces */}
            <div className="p-5 bg-bg-surface border border-border-subtle rounded-lg flex flex-col gap-2">
              <div className="flex items-center justify-between mb-2">
                <span className="font-mono text-[10px] tracking-widest text-[#3b5998] font-bold">
                  CODEFORCES
                </span>
                {user.codeforcesHandle && (
                  <span className="font-mono text-xs text-text-muted">{user.codeforcesHandle}</span>
                )}
              </div>
              {loadingStats ? (
                <div className="animate-pulse h-8 bg-bg-elevated rounded w-1/2" />
              ) : !user.codeforcesHandle ? (
                <div className="text-xs text-text-muted font-mono">Handle not linked</div>
              ) : (
                <>
                  <div className="text-3xl font-bold font-mono">
                    {platformStats?.cfRating || 'N/A'}
                  </div>
                  <div className="text-xs text-text-muted font-mono capitalize">
                    {platformStats?.cfRank || 'Unrated'}
                  </div>
                </>
              )}
            </div>

            {/* LeetCode */}
            <div className="p-5 bg-bg-surface border border-border-subtle rounded-lg flex flex-col gap-2">
              <div className="flex items-center justify-between mb-2">
                <span className="font-mono text-[10px] tracking-widest text-[#ffa116] font-bold">
                  LEETCODE
                </span>
                {user.leetcodeUsername && (
                  <span className="font-mono text-xs text-text-muted">{user.leetcodeUsername}</span>
                )}
              </div>
              {loadingStats ? (
                <div className="animate-pulse h-8 bg-bg-elevated rounded w-1/2" />
              ) : !user.leetcodeUsername ? (
                <div className="text-xs text-text-muted font-mono">Handle not linked</div>
              ) : (
                <>
                  <div className="text-3xl font-bold font-mono">
                    {platformStats?.lcRating || 'N/A'}
                  </div>
                  <div className="text-xs text-text-muted font-mono">Contest Rating</div>
                </>
              )}
            </div>

            {/* CodeChef */}
            <div className="p-5 bg-bg-surface border border-border-subtle rounded-lg flex flex-col gap-2">
              <div className="flex items-center justify-between mb-2">
                <span className="font-mono text-[10px] tracking-widest text-[#5B4638] font-bold">
                  CODECHEF
                </span>
                {user.codechefHandle && (
                  <span className="font-mono text-xs text-text-muted">{user.codechefHandle}</span>
                )}
              </div>
              {loadingStats ? (
                <div className="animate-pulse h-8 bg-bg-elevated rounded w-1/2" />
              ) : !user.codechefHandle ? (
                <div className="text-xs text-text-muted font-mono">Handle not linked</div>
              ) : (
                <>
                  <div className="text-3xl font-bold font-mono">
                    {platformStats?.ccRating || 'N/A'}
                  </div>
                  <div className="text-xs text-text-muted font-mono">
                    {platformStats?.ccStars ? `${platformStats.ccStars}★` : 'Unrated'}
                  </div>
                </>
              )}
            </div>
          </div>
        </motion.div>
      </div>

      <ProfileSettingsModal
        isOpen={showSettings}
        onClose={() => {
          setShowSettings(false);
          // Refresh stats on close
          setLoadingStats(true);
          api
            .get(`/api/users/${user.username}/platform-profiles`)
            .then((res) => setPlatformStats(res.data))
            .catch(() => {})
            .finally(() => setLoadingStats(false));
        }}
      />
    </main>
  );
}
