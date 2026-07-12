'use client';

import { GoogleOAuthProvider } from '@react-oauth/google';
import { useEffect, useState } from 'react';
import { Toaster } from 'react-hot-toast';

import { ErrorBoundary } from '../components/ErrorBoundary';
import { GlobalEffects } from '../components/layout/GlobalEffects';
import { AuthProvider } from '../components/providers/AuthProvider';
import { QueryProvider } from '../components/providers/QueryProvider';
import { useEditorStore } from '../store/editorStore';

// ── Theme Sync ───────────────────────────────────
// Reads the stored theme on mount and applies the
// data-theme attribute. All further toggling goes
// through editorStore.setTheme().

function ThemeSync({ children }: { children: React.ReactNode }) {
  const theme = useEditorStore((s) => s.theme);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Apply data-theme attribute whenever theme changes (after mount)
  useEffect(() => {
    if (!mounted) return;
    document.documentElement.setAttribute('data-theme', theme === 'light' ? 'light' : '');
  }, [theme, mounted]);

  return <>{children}</>;
}

// ── Root Providers ───────────────────────────────

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <GoogleOAuthProvider clientId={process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || ''}>
      <QueryProvider>
        <AuthProvider>
          <ThemeSync>
            <ErrorBoundary>{children}</ErrorBoundary>
            <GlobalEffects />
            <Toaster
              position="bottom-right"
              toastOptions={{
                style: {
                  background: 'var(--bg-elevated)',
                  border: '1px solid var(--border-default)',
                  color: 'var(--text-primary)',
                  fontFamily: "'Space Mono', monospace",
                  fontSize: '11px',
                  letterSpacing: '0.5px',
                },
                success: {
                  iconTheme: {
                    primary: '#39ff8a',
                    secondary: '#0a0a0a',
                  },
                },
                error: {
                  iconTheme: {
                    primary: '#ff4545',
                    secondary: '#0a0a0a',
                  },
                },
              }}
            />
          </ThemeSync>
        </AuthProvider>
      </QueryProvider>
    </GoogleOAuthProvider>
  );
}
