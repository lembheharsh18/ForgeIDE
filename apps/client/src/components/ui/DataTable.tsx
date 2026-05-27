// ── DataTable Component ─────────────────────────

import clsx from 'clsx';
import type { ReactNode } from 'react';

export interface Column<T> {
  key: string;
  header: string;
  sortable?: boolean;
  render: (item: T) => ReactNode;
}

interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  sortKey?: string;
  sortOrder?: 'asc' | 'desc';
  onSort?: (key: string) => void;
  isLoading?: boolean;
  emptyMessage?: string;
}

export function DataTable<T extends { id: string | number }>({
  data,
  columns,
  sortKey,
  sortOrder,
  onSort,
  isLoading,
  emptyMessage = 'No data available',
}: DataTableProps<T>) {
  return (
    <div className="w-full overflow-x-auto border border-border-default rounded-lg bg-bg-surface">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="border-b border-border-subtle bg-bg-elevated">
            {columns.map((col) => (
              <th
                key={col.key}
                onClick={() => col.sortable && onSort?.(col.key)}
                className={clsx(
                  'px-4 py-3 text-[10px] font-mono font-bold tracking-wider text-text-muted uppercase whitespace-nowrap',
                  col.sortable && 'cursor-pointer hover:text-text-primary transition-colors',
                )}
              >
                <div className="flex items-center gap-1">
                  {col.header}
                  {col.sortable && sortKey === col.key && (
                    <span className="text-accent">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                  )}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {isLoading ? (
            <tr>
              <td
                colSpan={columns.length}
                className="px-4 py-8 text-center text-text-muted text-sm italic"
              >
                Loading data...
              </td>
            </tr>
          ) : data.length === 0 ? (
            <tr>
              <td
                colSpan={columns.length}
                className="px-4 py-8 text-center text-text-muted text-sm italic"
              >
                {emptyMessage}
              </td>
            </tr>
          ) : (
            data.map((row, i) => (
              <tr
                key={row.id}
                className={clsx(
                  'border-b border-border-subtle transition-colors hover:bg-[rgba(255,255,255,0.02)]',
                  i === data.length - 1 && 'border-b-0',
                )}
              >
                {columns.map((col) => (
                  <td key={`${row.id}-${col.key}`} className="px-4 py-3 text-sm">
                    {col.render(row)}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
