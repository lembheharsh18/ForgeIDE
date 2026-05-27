// ── Badge Component ───────────────────────────────

import clsx from 'clsx';
import { forwardRef } from 'react';

export type BadgeVariant =
  | 'verdict-AC'
  | 'verdict-WA'
  | 'verdict-TLE'
  | 'verdict-CE'
  | 'verdict-RE'
  | 'verdict-PENDING'
  | 'platform-CF'
  | 'platform-ATCODER'
  | 'platform-LEETCODE'
  | 'platform-CUSTOM'
  | 'difficulty-EASY'
  | 'difficulty-MED'
  | 'difficulty-HARD'
  | 'tag-dp'
  | 'tag-graphs'
  | 'tag-greedy'
  | 'tag-trees'
  | 'tag-math'
  | 'tag-strings'
  | 'tag-geometry'
  | 'tag-implementation'
  | 'default';

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  label: string;
}

export const Badge = forwardRef<HTMLSpanElement, BadgeProps>(
  ({ variant = 'default', label, className, ...props }, ref) => {
    const getStyles = (): string => {
      if (variant.startsWith('verdict-')) {
        const v = variant.replace('verdict-', '');
        if (v === 'AC' || v === 'ACCEPTED')
          return 'bg-[rgba(57,255,138,0.15)] text-[#39ff8a] border-[#39ff8a]';
        if (v === 'WA') return 'bg-[rgba(255,69,69,0.15)] text-[#ff4545] border-[#ff4545]';
        if (v === 'TLE') return 'bg-[rgba(251,191,36,0.15)] text-[#fbbf24] border-[#fbbf24]';
        if (v === 'CE') return 'bg-[rgba(255,140,66,0.15)] text-[#ff8c42] border-[#ff8c42]';
        return 'bg-bg-elevated text-text-muted border-border-default';
      }

      if (variant.startsWith('platform-')) {
        const p = variant.replace('platform-', '');
        if (p === 'CF' || p === 'CODEFORCES')
          return 'bg-[rgba(96,165,250,0.15)] text-[#60a5fa] border-[#60a5fa]';
        if (p === 'ATCODER') return 'bg-[rgba(255,140,66,0.15)] text-[#ff8c42] border-[#ff8c42]';
        if (p === 'LEETCODE') return 'bg-[rgba(251,191,36,0.15)] text-[#fbbf24] border-[#fbbf24]';
        return 'bg-[rgba(57,255,138,0.15)] text-[#39ff8a] border-[#39ff8a]';
      }

      if (variant.startsWith('difficulty-')) {
        const d = variant.replace('difficulty-', '');
        if (d === 'EASY') return 'bg-[rgba(57,255,138,0.1)] text-[#39ff8a] border-transparent';
        if (d === 'MED') return 'bg-[rgba(251,191,36,0.1)] text-[#fbbf24] border-transparent';
        if (d === 'HARD') return 'bg-[rgba(255,69,69,0.1)] text-[#ff4545] border-transparent';
      }

      if (variant.startsWith('tag-')) {
        const t = variant.replace('tag-', '');
        if (t === 'dp') return 'bg-[rgba(96,165,250,0.15)] text-[#60a5fa] border-transparent';
        if (t === 'graphs') return 'bg-[rgba(57,255,138,0.15)] text-[#39ff8a] border-transparent';
        if (t === 'greedy') return 'bg-[rgba(255,140,66,0.15)] text-[#ff8c42] border-transparent';
        if (t === 'trees') return 'bg-[rgba(251,191,36,0.15)] text-[#fbbf24] border-transparent';
        if (t === 'math') return 'bg-[rgba(167,139,250,0.15)] text-[#a78bfa] border-transparent';
        return 'bg-bg-elevated text-text-primary border-transparent';
      }

      return 'bg-bg-elevated text-text-primary border-border-default';
    };

    return (
      <span
        ref={ref}
        className={clsx(
          'inline-flex items-center justify-center px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wider font-mono border border-solid',
          getStyles(),
          className,
        )}
        {...props}
      >
        {label}
      </span>
    );
  },
);
Badge.displayName = 'Badge';
