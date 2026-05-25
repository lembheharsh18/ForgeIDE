import type { Metadata } from 'next';

import { LoginForm } from '../../components/auth/LoginForm';

export const metadata: Metadata = {
  title: 'Sign In — FORGE IDE',
  description: 'Sign in to FORGE IDE to code, compete, and climb the leaderboard.',
};

export default function LoginPage() {
  return (
    <main
      className="min-h-screen flex items-center justify-center p-4"
      style={{ backgroundColor: 'var(--bg-primary)' }}
    >
      <LoginForm />
    </main>
  );
}
