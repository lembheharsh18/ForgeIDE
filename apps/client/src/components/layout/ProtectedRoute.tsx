'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

import { useAuthStore } from '../../store/authStore';

// ── ProtectedRoute ───────────────────────────────
// Redirects unauthenticated users to /login.
// Shows a loading spinner while session is being restored.

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace('/login');
    }
  }, [isAuthenticated, isLoading, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg-primary">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="w-10 h-10 rounded-full border-2 border-border-subtle" />
            <div className="absolute inset-0 w-10 h-10 rounded-full border-2 border-accent border-t-transparent animate-spin" />
          </div>
          <p className="text-text-muted font-mono text-sm tracking-wider">LOADING...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return <>{children}</>;
}
