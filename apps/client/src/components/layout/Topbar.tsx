'use client';

import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState, useRef, useEffect } from 'react';

import type { Language } from '../../config/languages';
import { LANGUAGES, LANGUAGE_KEYS } from '../../config/languages';
import { useCodeExecution } from '../../hooks/useCodeExecution';
import api from '../../lib/axios';
import { useAuthStore } from '../../store/authStore';
import { useEditorStore } from '../../store/editorStore';
import { CFSettingsModal } from '../ui/CFSettingsModal';

// Safely detect Ctrl vs Cmd key based on OS
const MOD_KEY = typeof navigator !== 'undefined' && /Mac/.test(navigator.userAgent) ? '⌘' : 'Ctrl';

// ── Topbar Component ─────────────────────────────

export function Topbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isAuthenticated, clearAuth } = useAuthStore();
  const {
    language,
    setLanguage,
    theme,
    setTheme,
    rcMode,
    toggleRCMode,
    isRunning,
    code,
    stdin,
    currentProblem,
  } = useEditorStore();
  const { execute } = useCodeExecution();

  const isEditorRoute = pathname?.startsWith('/ide');
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showCFSettings, setShowCFSettings] = useState(false);
  const [mounted, setMounted] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Hydrate store + flag mounted to avoid hydration mismatch
  useEffect(() => {
    useEditorStore.getState().hydrate();
    setMounted(true);
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowUserMenu(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleLogout = async () => {
    try {
      await api.post('/api/auth/logout');
    } catch {
      // ignore
    }
    clearAuth();
    setShowUserMenu(false);
    router.push('/login');
  };

  const handleRun = () => {
    execute({
      code,
      language,
      stdin,
      problemId: currentProblem?.id,
    });
  };

  const navItems = [
    { label: 'IDE', href: '/ide' },
    { label: 'PROBLEMS', href: '/club/problems' },
    { label: 'CONTESTS', href: '/contests' },
    { label: 'LEADERBOARD', href: '/leaderboard' },
    { label: 'COMMUNITY', href: '/community' },
    { label: 'CLUB', href: '/club' },
  ];

  return (
    <header
      className="flex items-center justify-between px-4 shrink-0 select-none"
      style={{
        height: '48px',
        backgroundColor: 'var(--bg-surface)',
        borderBottom: '1px solid var(--border-subtle)',
        zIndex: 50,
      }}
    >
      {/* ── Left: Logo + Nav ──────────────────── */}
      <div className="flex items-center gap-5">
        {/* Logo */}
        <motion.div
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Link href="/" className="flex items-center gap-2.5 group" aria-label="Forge IDE Home">
            <div className="relative">
              <div
                className="w-2.5 h-2.5 rounded-full"
                style={{ backgroundColor: 'var(--accent)' }}
              />
              <motion.div
                className="absolute inset-0 w-2.5 h-2.5 rounded-full"
                style={{ backgroundColor: 'var(--accent)' }}
                animate={{ scale: [1, 1.8, 1], opacity: [0.6, 0, 0.6] }}
                transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
              />
            </div>
            <span
              className="text-sm font-extrabold tracking-widest"
              style={{ fontFamily: 'var(--font-syne), Syne, sans-serif' }}
            >
              FORGE
              <span style={{ opacity: 0.4 }}>IDE</span>
            </span>
          </Link>
        </motion.div>

        {/* Nav pills */}
        {!isEditorRoute && (
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item, idx) => {
              const isActive = pathname === item.href;
              return (
                <motion.div
                  key={item.href}
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25, delay: idx * 0.05 }}
                >
                  <Link
                    href={item.href}
                    className="px-3 py-1 rounded text-xs transition-all duration-200"
                    style={{
                      fontFamily: "'Space Mono', monospace",
                      backgroundColor: isActive ? 'var(--accent)' : 'transparent',
                      color: isActive ? '#0a0a0a' : 'var(--text-muted)',
                      fontWeight: isActive ? 700 : 400,
                    }}
                    onMouseEnter={(e) => {
                      if (!isActive) e.currentTarget.style.color = 'var(--text-primary)';
                    }}
                    onMouseLeave={(e) => {
                      if (!isActive) e.currentTarget.style.color = 'var(--text-muted)';
                    }}
                  >
                    {item.label}
                  </Link>
                </motion.div>
              );
            })}
          </nav>
        )}
      </div>

      {/* ── Center: Language Selector (editor route only) ── */}
      {isEditorRoute && (
        <div className="relative">
          <select
            aria-label="Select editor language"
            value={language}
            onChange={(e) => setLanguage(e.target.value as Language)}
            className="appearance-none rounded text-xs transition-all duration-200"
            style={{
              height: '32px',
              minWidth: '132px',
              padding: '0 30px 0 12px',
              fontFamily: "'Space Mono', monospace",
              border: '1px solid var(--accent)',
              backgroundColor: 'var(--accent)',
              color: '#0a0a0a',
              fontWeight: 700,
              cursor: 'pointer',
              outline: 'none',
            }}
          >
            {LANGUAGE_KEYS.map((lang) => (
              <option key={lang} value={lang}>
                {LANGUAGES[lang].display}
              </option>
            ))}
          </select>
          <span
            aria-hidden="true"
            className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[10px]"
            style={{ color: '#0a0a0a' }}
          >
            ▼
          </span>
        </div>
      )}

      {/* ── Right: Controls ───────────────────── */}
      <div className="flex items-center gap-2.5">
        {/* RC Mode (editor only) */}
        {isEditorRoute && (
          <button
            onClick={toggleRCMode}
            aria-label={rcMode ? 'Disable RC Mode' : 'Enable RC Mode'}
            className="flex items-center gap-1.5 px-2 py-1 rounded text-xs transition-all duration-200"
            style={{
              fontFamily: "'Space Mono', monospace",
              border: `1px solid ${rcMode ? 'var(--orange)' : 'var(--border-default)'}`,
              backgroundColor: rcMode ? 'var(--orange)' : 'transparent',
              color: rcMode ? '#0a0a0a' : 'var(--orange)',
            }}
          >
            <span
              className="inline-block w-1.5 h-1.5 rounded-full"
              style={{
                backgroundColor: rcMode ? '#0a0a0a' : 'var(--orange)',
                animation: 'pulse 2s infinite',
              }}
            />
            RC MODE
          </button>
        )}

        {/* Run button (editor only) */}
        {isEditorRoute && (
          <button
            id="run-button"
            onClick={handleRun}
            disabled={isRunning}
            aria-label={isRunning ? 'Running code' : 'Run code'}
            title={`Run code (${MOD_KEY}+Enter)`}
            className="flex items-center gap-1.5 px-4 rounded text-xs font-bold transition-all duration-200 disabled:opacity-60"
            style={{
              fontFamily: "'Space Mono', monospace",
              height: '32px',
              backgroundColor: 'var(--accent)',
              color: '#0a0a0a',
            }}
            onMouseEnter={(e) => {
              if (!isRunning) {
                e.currentTarget.style.boxShadow = '0 0 20px rgba(232, 255, 90, 0.4)';
                e.currentTarget.style.transform = 'translateY(-1px)';
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.boxShadow = 'none';
              e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
            {isRunning ? (
              <>
                <motion.span
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                >
                  ⟳
                </motion.span>
                RUNNING
              </>
            ) : (
              <>▶ RUN</>
            )}
          </button>
        )}

        {/* User avatar / auth buttons */}
        {isAuthenticated && user ? (
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center justify-center rounded-full text-xs transition-all duration-200"
              style={{
                width: '32px',
                height: '32px',
                fontFamily: "'Space Mono', monospace",
                backgroundColor: 'var(--bg-elevated)',
                border: '1px solid var(--border-default)',
                color: 'var(--text-primary)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'var(--accent)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'var(--border-default)';
              }}
            >
              {user.username.slice(0, 2).toUpperCase()}
            </button>

            <AnimatePresence>
              {showUserMenu && (
                <motion.div
                  initial={{ opacity: 0, y: -4, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -4, scale: 0.95 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 top-10 w-44 rounded-md overflow-hidden"
                  style={{
                    backgroundColor: 'var(--bg-elevated)',
                    border: '1px solid var(--border-default)',
                    zIndex: 100,
                  }}
                >
                  <div
                    className="px-3 py-2 text-xs"
                    style={{
                      fontFamily: "'Space Mono', monospace",
                      borderBottom: '1px solid var(--border-subtle)',
                      color: 'var(--text-secondary)',
                    }}
                  >
                    {user.username}
                  </div>
                  {[
                    { label: 'Profile', href: '/profile' },
                    { label: 'Club', href: '/club' },
                  ].map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      className="block px-3 py-2 text-xs transition-colors duration-150"
                      style={{
                        fontFamily: "'Space Mono', monospace",
                        color: 'var(--text-primary)',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = 'var(--bg-hover)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'transparent';
                      }}
                      onClick={() => setShowUserMenu(false)}
                    >
                      {item.label}
                    </Link>
                  ))}
                  <button
                    onClick={() => {
                      setShowUserMenu(false);
                      setShowCFSettings(true);
                    }}
                    className="w-full text-left block px-3 py-2 text-xs transition-colors duration-150"
                    style={{
                      fontFamily: "'Space Mono', monospace",
                      color: 'var(--text-primary)',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = 'var(--bg-hover)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'transparent';
                    }}
                  >
                    CF Settings
                  </button>
                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-3 py-2 text-xs transition-colors duration-150"
                    style={{
                      fontFamily: "'Space Mono', monospace",
                      color: 'var(--red)',
                      borderTop: '1px solid var(--border-subtle)',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = 'var(--bg-hover)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'transparent';
                    }}
                  >
                    Logout
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <Link
              href="/login"
              className="px-3 py-1 rounded text-xs transition-all duration-200"
              style={{
                fontFamily: "'Space Mono', monospace",
                border: '1px solid var(--border-default)',
                color: 'var(--text-primary)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'var(--accent)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'var(--border-default)';
              }}
            >
              LOGIN
            </Link>
            <Link
              href="/register"
              className="px-3 py-1 rounded text-xs font-bold transition-all duration-200"
              style={{
                fontFamily: "'Space Mono', monospace",
                backgroundColor: 'var(--accent)',
                color: '#0a0a0a',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow = '0 0 15px rgba(232, 255, 90, 0.4)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              REGISTER
            </Link>
          </div>
        )}

        {/* Theme toggle */}
        <button
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          aria-label={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
          className="flex items-center justify-center rounded transition-all duration-200"
          style={{
            width: '32px',
            height: '32px',
            backgroundColor: 'var(--bg-elevated)',
            border: '1px solid var(--border-default)',
            fontSize: '14px',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = 'var(--accent)';
            e.currentTarget.style.color = 'var(--accent)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = 'var(--border-default)';
            e.currentTarget.style.color = 'var(--text-primary)';
          }}
        >
          {mounted ? (theme === 'dark' ? '☽' : '☀') : '☽'}
        </button>
      </div>

      {/* CF Settings Modal */}
      <CFSettingsModal isOpen={showCFSettings} onClose={() => setShowCFSettings(false)} />
    </header>
  );
}
