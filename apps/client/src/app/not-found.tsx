'use client';

import { motion, useReducedMotion } from 'framer-motion';
import Link from 'next/link';
import { useEffect, useState } from 'react';

// ── Glitch animation keyframes (injected via style tag) ──

const GLITCH_CSS = `
@keyframes glitch-1 {
  0%, 100% { clip-path: inset(0 0 95% 0); transform: translate(0); }
  20% { clip-path: inset(20% 0 60% 0); transform: translate(-4px, 2px); }
  40% { clip-path: inset(60% 0 10% 0); transform: translate(4px, -1px); }
  60% { clip-path: inset(40% 0 30% 0); transform: translate(-2px, 1px); }
  80% { clip-path: inset(80% 0 5% 0); transform: translate(3px, -2px); }
}
@keyframes glitch-2 {
  0%, 100% { clip-path: inset(95% 0 0 0); transform: translate(0); opacity: 0.8; }
  25% { clip-path: inset(10% 0 70% 0); transform: translate(3px, -1px); opacity: 0.6; }
  50% { clip-path: inset(50% 0 20% 0); transform: translate(-3px, 2px); opacity: 0.9; }
  75% { clip-path: inset(30% 0 50% 0); transform: translate(2px, 1px); opacity: 0.7; }
}
@keyframes glitch-skew {
  0%, 100% { transform: skew(0deg); }
  20% { transform: skew(-1deg); }
  40% { transform: skew(0.5deg); }
  60% { transform: skew(-0.3deg); }
  80% { transform: skew(0.8deg); }
}
`;

export default function NotFound() {
  const prefersReducedMotion = useReducedMotion();
  const [glitchActive, setGlitchActive] = useState(true);

  useEffect(() => {
    if (prefersReducedMotion) return;

    // Play once on mount, then every 3 seconds
    const timeout = setTimeout(() => setGlitchActive(false), 800);
    const interval = setInterval(() => {
      setGlitchActive(true);
      setTimeout(() => setGlitchActive(false), 800);
    }, 3000);

    return () => {
      clearTimeout(timeout);
      clearInterval(interval);
    };
  }, [prefersReducedMotion]);

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: GLITCH_CSS }} />
      <main
        className="min-h-screen flex flex-col items-center justify-center relative px-6"
        style={{ backgroundColor: 'var(--bg-primary)' }}
      >
        {/* Background 404 */}
        <div
          className="absolute select-none pointer-events-none"
          style={{
            fontFamily: "'Space Mono', monospace",
            fontWeight: 700,
            fontSize: 'clamp(120px, 25vw, 200px)',
            opacity: 0.03,
            color: 'var(--text-primary)',
            lineHeight: 1,
            animation: glitchActive ? 'glitch-skew 0.3s steps(2) infinite' : 'none',
          }}
        >
          <span>404</span>
          {!prefersReducedMotion && (
            <>
              <span
                className="absolute inset-0"
                style={{
                  color: 'var(--red)',
                  animation: glitchActive ? 'glitch-1 0.3s steps(2) infinite' : 'none',
                }}
              >
                404
              </span>
              <span
                className="absolute inset-0"
                style={{
                  color: 'var(--blue)',
                  animation: glitchActive ? 'glitch-2 0.3s steps(3) infinite' : 'none',
                }}
              >
                404
              </span>
            </>
          )}
        </div>

        {/* Overlay content */}
        <motion.div
          initial={prefersReducedMotion ? undefined : { opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="relative z-10 flex flex-col items-center text-center"
        >
          <h1
            className="text-3xl font-bold mb-6 tracking-wider"
            style={{ fontFamily: 'var(--font-syne), Syne, sans-serif' }}
          >
            COMPILE ERROR
          </h1>

          {/* Error block */}
          <div
            className="text-left max-w-[400px] w-full p-4 rounded"
            style={{
              fontFamily: "'Space Mono', monospace",
              fontSize: '12px',
              lineHeight: 1.8,
              backgroundColor: 'var(--bg-surface)',
              border: '1px solid var(--red)',
              color: 'var(--red)',
            }}
          >
            <p>error: unresolved reference to &apos;/&apos; at line 404</p>
            <p style={{ color: 'var(--text-muted)', marginTop: '4px' }}>
              note: did you mean &apos;/editor&apos;?
            </p>
          </div>

          {/* CTA */}
          <Link
            href="/editor"
            className="mt-8 px-6 py-2.5 rounded text-sm tracking-wider transition-all duration-200"
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
            → RETURN TO EDITOR
          </Link>
        </motion.div>
      </main>
    </>
  );
}
