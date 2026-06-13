// ── Spinner Component ────────────────────────────

interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const SIZE_MAP = {
  sm: 16,
  md: 24,
  lg: 40,
} as const;

export function Spinner({ size = 'md', className = '' }: SpinnerProps) {
  const px = SIZE_MAP[size];

  return (
    <div
      className={`inline-block animate-spin rounded-full ${className}`}
      style={{
        width: `${px}px`,
        height: `${px}px`,
        borderWidth: size === 'sm' ? '1.5px' : '2px',
        borderStyle: 'solid',
        borderColor: 'var(--border-default)',
        borderTopColor: 'var(--accent)',
      }}
      role="status"
      aria-label="Loading"
    />
  );
}
