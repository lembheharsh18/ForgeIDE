// ── Skeleton Row ─────────────────────────────────

interface SkeletonRowProps {
  columns?: number;
  className?: string;
}

export function SkeletonRow({ columns = 5, className = '' }: SkeletonRowProps) {
  return (
    <div
      className={`flex items-center gap-4 px-4 py-3 animate-pulse ${className}`}
      style={{ borderBottom: '1px solid var(--border-subtle)' }}
    >
      {Array.from({ length: columns }).map((_, i) => (
        <div
          key={i}
          className="rounded"
          style={{
            flex: i === 1 ? 3 : 1,
            height: '12px',
            backgroundColor: 'var(--bg-elevated)',
          }}
        />
      ))}
    </div>
  );
}

// ── Multiple Skeleton Rows ───────────────────────

interface SkeletonTableProps {
  rows?: number;
  columns?: number;
}

export function SkeletonTable({ rows = 8, columns = 5 }: SkeletonTableProps) {
  return (
    <div>
      {Array.from({ length: rows }).map((_, i) => (
        <SkeletonRow key={i} columns={columns} />
      ))}
    </div>
  );
}
