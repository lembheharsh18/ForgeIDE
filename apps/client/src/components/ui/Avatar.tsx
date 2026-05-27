// ── Avatar Component ──────────────────────────────

import clsx from 'clsx';
import Image from 'next/image';

interface AvatarProps {
  username: string;
  url?: string | null;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

export function Avatar({ username, url, size = 'md', className }: AvatarProps) {
  const initials = username.slice(0, 2).toUpperCase();

  const sizeClass = {
    sm: 'w-6 h-6 text-[10px]',
    md: 'w-8 h-8 text-xs',
    lg: 'w-12 h-12 text-sm',
    xl: 'w-20 h-20 text-xl border-2 border-accent',
  }[size];

  return (
    <div
      className={clsx(
        'relative rounded-full flex items-center justify-center shrink-0 overflow-hidden bg-bg-elevated border border-border-default',
        sizeClass,
        className,
      )}
    >
      {url ? (
        <Image src={url} alt={username} fill className="object-cover" />
      ) : (
        <span className="font-mono font-bold text-text-muted">{initials}</span>
      )}
    </div>
  );
}
