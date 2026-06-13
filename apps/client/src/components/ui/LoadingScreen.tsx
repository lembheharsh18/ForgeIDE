'use client';

import { motion, useReducedMotion } from 'framer-motion';
import { useEffect, useState } from 'react';

// ── Loading Screen ───────────────────────────────

export function LoadingScreen() {
  const [progress, setProgress] = useState(0);
  const prefersReducedMotion = useReducedMotion();

  useEffect(() => {
    if (prefersReducedMotion) {
      setProgress(100);
      return;
    }

    const start = Date.now();
    const duration = 1500;

    const frame = () => {
      const elapsed = Date.now() - start;
      const pct = Math.min((elapsed / duration) * 100, 100);
      setProgress(pct);
      if (pct < 100) requestAnimationFrame(frame);
    };

    requestAnimationFrame(frame);
  }, [prefersReducedMotion]);

  return (
    <div
      className="fixed inset-0 z-[9999] flex flex-col items-center justify-center"
      style={{ backgroundColor: 'var(--bg-primary)' }}
    >
      {/* Logo dots */}
      <div className="flex items-center gap-2 mb-8">
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            className="w-2.5 h-2.5 rounded-full"
            style={{ backgroundColor: 'var(--accent)' }}
            initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{
              delay: i * 0.15,
              duration: 0.3,
              type: 'spring',
              damping: 12,
            }}
          />
        ))}
      </div>

      {/* Status text */}
      <motion.p
        initial={prefersReducedMotion ? undefined : { opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="text-xs tracking-[2px] mb-6"
        style={{
          fontFamily: "'Space Mono', monospace",
          color: 'var(--text-muted)',
        }}
      >
        INITIALIZING FORGE...
      </motion.p>

      {/* Progress bar */}
      <div
        className="w-48 h-[2px] rounded-full overflow-hidden"
        style={{ backgroundColor: 'var(--bg-elevated)' }}
      >
        <motion.div
          className="h-full rounded-full"
          style={{
            backgroundColor: 'var(--accent)',
            width: `${progress}%`,
          }}
          transition={{ duration: 0.05 }}
        />
      </div>
    </div>
  );
}
