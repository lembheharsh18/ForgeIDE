'use client';

import { useEffect, useState, useRef } from 'react';

// ── Animated Number ──────────────────────────────
// Counts up from 0 to target value over duration.

interface AnimatedNumberProps {
  value: number;
  duration?: number;
  delay?: number;
  prefix?: string;
  suffix?: string;
  className?: string;
}

export function AnimatedNumber({
  value,
  duration = 800,
  delay = 0,
  prefix = '',
  suffix = '',
  className = '',
}: AnimatedNumberProps) {
  const [display, setDisplay] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const hasAnimated = useRef(false);

  useEffect(() => {
    if (hasAnimated.current) return;
    if (value === 0) return;

    hasAnimated.current = true;

    const timeout = setTimeout(() => {
      const start = Date.now();
      const frame = () => {
        const elapsed = Date.now() - start;
        const progress = Math.min(elapsed / duration, 1);
        // Ease out
        const eased = 1 - Math.pow(1 - progress, 3);
        setDisplay(Math.round(eased * value));
        if (progress < 1) requestAnimationFrame(frame);
      };
      requestAnimationFrame(frame);
    }, delay);

    return () => clearTimeout(timeout);
  }, [value, duration, delay]);

  return (
    <span ref={ref} className={className}>
      {prefix}
      {display}
      {suffix}
    </span>
  );
}
