import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Editor — Forge IDE',
  description:
    'Write, run, and debug code with real-time execution. Supports C++, Python, Java, JavaScript, and Go.',
};

export default function EditorLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
