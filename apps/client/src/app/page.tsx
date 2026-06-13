'use client';

import { motion, useReducedMotion, useInView } from 'framer-motion';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState, useCallback } from 'react';

import { useAuthStore } from '../store/authStore';

// ── Animated Code Block ──────────────────────────

const CODE_SNIPPET = `#include <bits/stdc++.h>
using namespace std;

int main() {
    int n; cin >> n;
    vector<int> a(n);
    for (auto& x : a) cin >> x;

    int lo = 0, hi = 1e9, ans = 0;
    while (lo <= hi) {
        int mid = (lo + hi) / 2;
        if (check(mid)) ans = mid, lo = mid + 1;
        else hi = mid - 1;
    }
    cout << ans << "\\n";
}`;

function TypingCodeBlock() {
  const [displayedCode, setDisplayedCode] = useState('');
  const [showVerdict, setShowVerdict] = useState(false);
  const [cursorVisible, setCursorVisible] = useState(true);
  const prefersReducedMotion = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-100px' });

  useEffect(() => {
    if (!isInView) return;
    if (prefersReducedMotion) {
      setDisplayedCode(CODE_SNIPPET);
      setShowVerdict(true);
      return;
    }

    let i = 0;
    const interval = setInterval(() => {
      if (i < CODE_SNIPPET.length) {
        setDisplayedCode(CODE_SNIPPET.slice(0, i + 1));
        i++;
      } else {
        clearInterval(interval);
        setCursorVisible(false);
        setTimeout(() => setShowVerdict(true), 400);
      }
    }, 18);

    return () => clearInterval(interval);
  }, [isInView, prefersReducedMotion]);

  // Cursor blink
  useEffect(() => {
    if (!cursorVisible) return;
    const blink = setInterval(() => {
      setCursorVisible((prev) => !prev);
    }, 530);
    return () => clearInterval(blink);
  }, [cursorVisible]);

  // Basic syntax highlighting
  const highlightCode = useCallback((code: string) => {
    return code
      .replace(
        /(#include|using|namespace|int|void|auto|while|if|else|for|return|vector|cout|cin|endl)\b/g,
        '<span style="color:#c792ea">$1</span>',
      )
      .replace(/(".*?")/g, '<span style="color:#c3e88d">$1</span>')
      .replace(/(\/\/.*)/g, '<span style="color:#555">$1</span>')
      .replace(/\b(\d+)\b/g, '<span style="color:#f78c6c">$1</span>')
      .replace(/\b(main|check|stdc|bits|std|size_t)\b/g, '<span style="color:#82aaff">$1</span>');
  }, []);

  return (
    <div ref={ref} className="w-full max-w-[640px] mx-auto">
      <div
        className="rounded-lg overflow-hidden"
        style={{
          backgroundColor: 'var(--bg-surface)',
          border: '1px solid var(--border-default)',
        }}
      >
        {/* Window bar */}
        <div
          className="flex items-center gap-2 px-4"
          style={{
            height: '36px',
            borderBottom: '1px solid var(--border-subtle)',
            backgroundColor: 'var(--bg-elevated)',
          }}
        >
          <div className="flex gap-1.5">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: '#ff4545' }} />
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: '#ff8c42' }} />
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: '#39ff8a' }} />
          </div>
          <span
            className="text-[10px] ml-2"
            style={{
              fontFamily: "'Space Mono', monospace",
              color: 'var(--text-muted)',
            }}
          >
            main.cpp
          </span>
        </div>

        {/* Code area */}
        <div className="relative p-4 overflow-x-auto" style={{ minHeight: '280px' }}>
          <pre
            className="text-[12px] leading-relaxed"
            style={{
              fontFamily: "'Space Mono', monospace",
              color: 'var(--text-secondary)',
              margin: 0,
            }}
            dangerouslySetInnerHTML={{
              __html:
                highlightCode(displayedCode) +
                (cursorVisible ? '<span style="color:var(--accent);animation:none">▌</span>' : ''),
            }}
          />

          {/* Verdict badge */}
          {showVerdict && (
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', damping: 12, stiffness: 200 }}
              className="absolute bottom-3 right-3 flex items-center gap-1.5 px-3 py-1.5 rounded"
              style={{
                fontFamily: "'Space Mono', monospace",
                fontSize: '11px',
                fontWeight: 700,
                letterSpacing: '1px',
                color: '#39ff8a',
                backgroundColor: 'rgba(57, 255, 138, 0.08)',
                border: '1px solid rgba(57, 255, 138, 0.25)',
              }}
            >
              <span
                className="w-1.5 h-1.5 rounded-full inline-block"
                style={{ backgroundColor: '#39ff8a' }}
              />
              AC — 42ms
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Feature Card ─────────────────────────────────

interface FeatureCardProps {
  icon: string;
  title: string;
  description: string;
  accentColor: string;
  index: number;
}

function FeatureCard({ icon, title, description, accentColor, index }: FeatureCardProps) {
  const prefersReducedMotion = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-60px' });

  return (
    <motion.div
      ref={ref}
      initial={prefersReducedMotion ? undefined : { opacity: 0, y: 20 }}
      animate={isInView ? { opacity: 1, y: 0 } : undefined}
      transition={{ duration: 0.4, delay: index * 0.1 }}
      className="group p-6 rounded-lg transition-all duration-200"
      style={{
        backgroundColor: 'var(--bg-surface)',
        border: '1px solid var(--border-subtle)',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = 'var(--accent)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = 'var(--border-subtle)';
      }}
    >
      <div className="text-2xl mb-3">{icon}</div>
      <h3
        className="text-sm font-bold mb-2 tracking-wider"
        style={{
          fontFamily: "'Space Mono', monospace",
          color: accentColor,
        }}
      >
        {title}
      </h3>
      <p
        className="text-xs leading-relaxed"
        style={{
          fontFamily: "'Space Mono', monospace",
          color: 'var(--text-secondary)',
        }}
      >
        {description}
      </p>
    </motion.div>
  );
}

// ── Features Data ────────────────────────────────

const FEATURES = [
  {
    icon: '⚡',
    title: 'RC INTERACTOR',
    description:
      'Test interactive problems in real-time. Play the judge role — your program responds live.',
    accentColor: 'var(--orange)',
  },
  {
    icon: '🔗',
    title: 'CF BRIDGE',
    description:
      'One-click to open any Codeforces problem in Forge. Submit directly and track your verdict.',
    accentColor: 'var(--blue)',
  },
  {
    icon: '🏆',
    title: 'CLUB PORTAL',
    description:
      'Leaderboards, contests, problem sets, and submission history — all for your team.',
    accentColor: 'var(--accent)',
  },
  {
    icon: '🌐',
    title: '5 LANGUAGES',
    description:
      'C++17, Python 3, Java 17, JavaScript, and Go. Powered by Piston for instant execution.',
    accentColor: 'var(--green)',
  },
  {
    icon: '📊',
    title: 'REAL ANALYTICS',
    description: 'Track every submission. Watch your rank climb. Heatmap of your activity history.',
    accentColor: '#c792ea',
  },
  {
    icon: '🛡',
    title: 'SANDBOXED',
    description: 'Safe, isolated execution. No installs needed. Run code directly in your browser.',
    accentColor: 'var(--text-muted)',
  },
];

// ── Landing Page ─────────────────────────────────

export default function Home() {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuthStore();
  const prefersReducedMotion = useReducedMotion();

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.replace('/editor');
    }
  }, [isAuthenticated, isLoading, router]);

  if (isLoading) return null;
  if (isAuthenticated) return null;

  const heroLetters = 'FORGE IDE'.split('');

  return (
    <main
      className="min-h-screen"
      style={{ backgroundColor: 'var(--bg-primary)', overflow: 'hidden' }}
    >
      {/* ── Hero Section ────────────────────────── */}
      <section
        className="relative flex flex-col items-center text-center px-6"
        style={{ paddingTop: '120px' }}
      >
        {/* Background glow */}
        <div
          className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full opacity-[0.03] pointer-events-none"
          style={{
            background: 'radial-gradient(circle, var(--accent) 0%, transparent 70%)',
          }}
        />

        {/* Eyebrow */}
        <motion.p
          initial={prefersReducedMotion ? undefined : { opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-xs tracking-[4px] mb-8"
          style={{
            fontFamily: "'Space Mono', monospace",
            color: 'var(--text-muted)',
          }}
        >
          COMPETITIVE PROGRAMMING · EVOLVED
        </motion.p>

        {/* Main Heading — letter by letter */}
        <h1
          className="font-extrabold leading-[0.9] mb-0"
          style={{
            fontFamily: 'var(--font-syne), Syne, sans-serif',
            fontSize: 'clamp(56px, 10vw, 96px)',
            letterSpacing: '-4px',
          }}
        >
          {heroLetters.map((letter, i) => (
            <motion.span
              key={i}
              initial={prefersReducedMotion ? undefined : { opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: 0.4,
                delay: 0.3 + i * 0.04,
                ease: 'easeOut',
              }}
              className="inline-block"
              style={letter === ' ' ? { width: '0.3em' } : undefined}
            >
              {letter === ' ' ? '\u00A0' : letter}
            </motion.span>
          ))}
        </h1>

        {/* Subheading */}
        <motion.p
          initial={prefersReducedMotion ? undefined : { opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.8 }}
          className="text-base mt-6 max-w-md"
          style={{
            fontFamily: "'Space Mono', monospace",
            color: 'var(--text-secondary)',
            lineHeight: 1.7,
          }}
        >
          Build faster. Debug smarter.
          <br />
          Win more contests.
        </motion.p>

        {/* CTA Buttons */}
        <motion.div
          initial={prefersReducedMotion ? undefined : { opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 1.0 }}
          className="flex flex-wrap gap-3 justify-center mt-12"
        >
          <Link
            href="/editor"
            className="px-8 py-3 rounded font-bold text-sm tracking-wider transition-all duration-200"
            style={{
              fontFamily: "'Space Mono', monospace",
              backgroundColor: 'var(--accent)',
              color: '#0a0a0a',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.boxShadow = '0 0 30px rgba(232, 255, 90, 0.5)';
              e.currentTarget.style.transform = 'translateY(-2px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.boxShadow = 'none';
              e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
            LAUNCH EDITOR →
          </Link>
          <Link
            href="/register"
            className="px-8 py-3 rounded text-sm tracking-wider transition-all duration-200"
            style={{
              fontFamily: "'Space Mono', monospace",
              border: '1px solid var(--border-default)',
              color: 'var(--text-primary)',
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
            JOIN CLUB →
          </Link>
        </motion.div>

        {/* Animated Code Block */}
        <motion.div
          initial={prefersReducedMotion ? undefined : { opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 1.2 }}
          className="mt-16 w-full"
        >
          <TypingCodeBlock />
        </motion.div>
      </section>

      {/* ── Features Grid ───────────────────────── */}
      <section className="max-w-5xl mx-auto px-6" style={{ marginTop: '120px' }}>
        <motion.h2
          initial={prefersReducedMotion ? undefined : { opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.4 }}
          className="text-2xl font-bold text-center mb-12 tracking-wider"
          style={{ fontFamily: 'var(--font-syne), Syne, sans-serif' }}
        >
          EVERYTHING YOU NEED
        </motion.h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {FEATURES.map((feature, i) => (
            <FeatureCard key={feature.title} {...feature} index={i} />
          ))}
        </div>
      </section>

      {/* ── Footer ──────────────────────────────── */}
      <footer
        className="mt-32"
        style={{
          backgroundColor: 'var(--bg-surface)',
          borderTop: '1px solid var(--border-subtle)',
        }}
      >
        <div className="max-w-5xl mx-auto px-6 py-10">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            {/* Logo */}
            <div className="flex items-center gap-2.5">
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: 'var(--accent)' }} />
              <span
                className="text-sm font-extrabold tracking-widest"
                style={{ fontFamily: 'var(--font-syne), Syne, sans-serif' }}
              >
                FORGE<span style={{ opacity: 0.4 }}>IDE</span>
              </span>
            </div>

            {/* Nav */}
            <nav className="flex items-center gap-6">
              {['Editor', 'Problems', 'Contests', 'Club'].map((item) => (
                <Link
                  key={item}
                  href={`/${item.toLowerCase()}`}
                  className="text-xs transition-colors duration-150"
                  style={{
                    fontFamily: "'Space Mono', monospace",
                    color: 'var(--text-muted)',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.color = 'var(--text-primary)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.color = 'var(--text-muted)';
                  }}
                >
                  {item.toUpperCase()}
                </Link>
              ))}
            </nav>

            {/* Right */}
            <p
              className="text-xs"
              style={{
                fontFamily: "'Space Mono', monospace",
                color: 'var(--text-muted)',
              }}
            >
              Built for PICT Coders League
            </p>
          </div>

          {/* Bottom bar */}
          <div
            className="text-center mt-8 pt-6"
            style={{ borderTop: '1px solid var(--border-subtle)' }}
          >
            <p
              className="text-[10px]"
              style={{
                fontFamily: "'Space Mono', monospace",
                color: 'var(--text-muted)',
              }}
            >
              © 2025 Forge IDE · MIT License
            </p>
          </div>
        </div>
      </footer>
    </main>
  );
}
