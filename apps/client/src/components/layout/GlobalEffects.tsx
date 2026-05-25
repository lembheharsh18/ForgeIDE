'use client';

import { motion } from 'framer-motion';

// ── Global Visual Effects ────────────────────────
// Scanline + grid overlay for the FORGE IDE aesthetic

export function GlobalEffects() {
  return (
    <>
      {/* Scanline */}
      <motion.div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          height: '2px',
          background: 'linear-gradient(90deg, transparent, var(--accent), transparent)',
          opacity: 0.25,
          pointerEvents: 'none',
          zIndex: 100,
        }}
        animate={{ y: ['-2px', '100vh'] }}
        transition={{
          duration: 4,
          ease: 'linear',
          repeat: Infinity,
        }}
      />

      {/* Grid overlay */}
      <div
        style={{
          position: 'fixed',
          inset: 0,
          pointerEvents: 'none',
          zIndex: 0,
          backgroundImage: `
            linear-gradient(var(--text-muted) 1px, transparent 1px),
            linear-gradient(90deg, var(--text-muted) 1px, transparent 1px)
          `,
          backgroundSize: '32px 32px',
          opacity: 0.03,
        }}
      />
    </>
  );
}
