import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Club — Forge IDE',
  description:
    'Club portal with leaderboards, contests, problems, and submission tracking for your competitive programming team.',
};

export default function ClubLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
