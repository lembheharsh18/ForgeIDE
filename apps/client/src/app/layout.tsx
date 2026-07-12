import type { Metadata } from 'next';

import './globals.css';
import { Providers } from './providers';

// ── SEO Metadata ─────────────────────────────────

export const metadata: Metadata = {
  title: 'Coders League — Competitive Programming Hub',
  description:
    'Write, run, and debug competitive programming solutions in your browser. RC Interactor, CF integration, club leaderboards.',
  icons: {
    icon: '/favicon.ico',
  },
  keywords: ['competitive programming', 'coding', 'PICT', 'Coders League', 'IDE', 'Codeforces'],
  openGraph: {
    title: 'Coders League',
    description:
      'Write, run, and debug competitive programming solutions in your browser. RC Interactor, CF integration, club leaderboards.',
    type: 'website',
  },
};

// ── Root Layout ──────────────────────────────────

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Syne:wght@400;500;600;700;800&family=Space+Mono:ital,wght@0,400;0,700;1,400&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen bg-bg-primary text-text-primary font-sans antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
