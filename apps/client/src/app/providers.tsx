'use client';

import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { Toaster } from 'react-hot-toast';

import { ErrorBoundary } from '../components/ErrorBoundary';
import { GlobalEffects } from '../components/layout/GlobalEffects';
import { AuthProvider } from '../components/providers/AuthProvider';
import { QueryProvider } from '../components/providers/QueryProvider';

// ── Theme Context ────────────────────────────────

type Theme = 'dark' | 'light';

interface ThemeContextValue {
  theme: Theme;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: 'dark',
  toggleTheme: () => {},
});

export const useTheme = () => useContext(ThemeContext);

// ── Theme Provider ───────────────────────────────

function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>('dark');

  // Initialize theme from localStorage
  useEffect(() => {
    const stored = localStorage.getItem('forge_theme') as Theme | null;
    const initial = stored || 'dark';
    setTheme(initial);
    document.documentElement.setAttribute('data-theme', initial === 'light' ? 'light' : '');
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme((prev) => {
      const next = prev === 'dark' ? 'light' : 'dark';
      localStorage.setItem('forge_theme', next);
      document.documentElement.setAttribute('data-theme', next === 'light' ? 'light' : '');
      // Set cookie for SSR hydration (1 year)
      document.cookie = `forge_theme=${next};path=/;max-age=${365 * 24 * 60 * 60};samesite=strict`;
      return next;
    });
  }, []);

  return <ThemeContext.Provider value={{ theme, toggleTheme }}>{children}</ThemeContext.Provider>;
}

// ── Root Providers ───────────────────────────────

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <QueryProvider>
        <AuthProvider>
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
        </AuthProvider>
      </QueryProvider>
    </ThemeProvider>
  );
}
