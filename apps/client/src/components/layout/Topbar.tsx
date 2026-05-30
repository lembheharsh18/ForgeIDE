'use client';

import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState, useRef, useEffect } from 'react';

import { LANGUAGES, LANGUAGE_KEYS } from '../../config/languages';
import { useCodeExecution } from '../../hooks/useCodeExecution';
import api from '../../lib/axios';
import { useAuthStore } from '../../store/authStore';
import { useEditorStore } from '../../store/editorStore';
import { CFSettingsModal } from '../ui/CFSettingsModal';

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

  const isEditorRoute = pathname?.startsWith('/editor');
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showCFSettings, setShowCFSettings] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

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
    { label: 'EDITOR', href: '/editor' },
    { label: 'PROBLEMS', href: '/problems' },
    { label: 'CONTESTS', href: '/contests' },
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
        <Link href="/" className="flex items-center gap-2.5 group">
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

        {/* Nav pills */}
        {!isEditorRoute && (
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
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
              );
            })}
          </nav>
        )}
      </div>

      {/* ── Center: Language Tabs (editor route only) ── */}
      {isEditorRoute && (
        <div className="flex items-center gap-1">
          {LANGUAGE_KEYS.map((lang) => {
            const isActive = language === lang;
            return (
              <button
                key={lang}
                onClick={() => setLanguage(lang)}
                className="px-3 py-1 rounded text-xs transition-all duration-200"
                style={{
                  fontFamily: "'Space Mono', monospace",
                  border: `1px solid ${isActive ? 'var(--accent)' : 'var(--border-default)'}`,
                  backgroundColor: isActive ? 'var(--accent)' : 'transparent',
                  color: isActive ? '#0a0a0a' : 'var(--text-muted)',
                  fontWeight: isActive ? 700 : 400,
                }}
                onMouseEnter={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.borderColor = 'var(--accent)';
                    e.currentTarget.style.color = 'var(--text-primary)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.borderColor = 'var(--border-default)';
                    e.currentTarget.style.color = 'var(--text-muted)';
                  }
                }}
              >
                {LANGUAGES[lang].display}
              </button>
            );
          })}
        </div>
      )}

      {/* ── Right: Controls ───────────────────── */}
      <div className="flex items-center gap-2.5">
        {/* RC Mode (editor only) */}
        {isEditorRoute && (
          <button
            onClick={toggleRCMode}
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
            >
              REGISTER
            </Link>
          </div>
        )}

        {/* Theme toggle */}
        <button
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
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
          {theme === 'dark' ? '☽' : '☀'}
        </button>
      </div>

      {/* CF Settings Modal */}
      <CFSettingsModal isOpen={showCFSettings} onClose={() => setShowCFSettings(false)} />
    </header>
  );
}
