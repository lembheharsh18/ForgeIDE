// ── Pagination Component ────────────────────────

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  className?: string;
}

export function Pagination({ currentPage, totalPages, onPageChange, className }: PaginationProps) {
  if (totalPages <= 1) return null;

  const handlePrev = () => {
    if (currentPage > 1) onPageChange(currentPage - 1);
  };

  const handleNext = () => {
    if (currentPage < totalPages) onPageChange(currentPage + 1);
  };

  return (
    <div className={`flex items-center gap-2 ${className || ''}`}>
      <button
        onClick={handlePrev}
        disabled={currentPage === 1}
        className="px-3 py-1 rounded bg-bg-surface border border-border-default text-text-primary text-xs disabled:opacity-50 disabled:cursor-not-allowed hover:bg-bg-elevated transition-colors"
      >
        ← PREV
      </button>
      <span className="text-text-muted text-xs font-mono">
        {currentPage} / {totalPages}
      </span>
      <button
        onClick={handleNext}
        disabled={currentPage === totalPages}
        className="px-3 py-1 rounded bg-bg-surface border border-border-default text-text-primary text-xs disabled:opacity-50 disabled:cursor-not-allowed hover:bg-bg-elevated transition-colors"
      >
        NEXT →
      </button>
    </div>
  );
}
