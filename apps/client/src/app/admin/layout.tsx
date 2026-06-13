import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Admin — Forge IDE',
  description: 'Admin panel for managing problems, contests, and club settings.',
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
