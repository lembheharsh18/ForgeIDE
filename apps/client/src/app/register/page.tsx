import type { Metadata } from 'next';

import { RegisterForm } from '../../components/auth/RegisterForm';

export const metadata: Metadata = {
  title: 'Register — FORGE IDE',
  description: 'Create your FORGE IDE account and join the competitive coding arena.',
};

export default function RegisterPage() {
  return (
    <main
      className="min-h-screen flex items-center justify-center p-4"
      style={{ backgroundColor: 'var(--bg-primary)' }}
    >
      <RegisterForm />
    </main>
  );
}
