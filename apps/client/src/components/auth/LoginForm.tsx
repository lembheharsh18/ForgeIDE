'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import api from '../../lib/axios';
import { useAuthStore } from '../../store/authStore';

// ── Validation Schema ────────────────────────────

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

type LoginFormData = z.infer<typeof loginSchema>;

// ── LoginForm Component ──────────────────────────

export function LoginForm() {
  const router = useRouter();
  const { setAuth } = useAuthStore();
  const [showPassword, setShowPassword] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = async (data: LoginFormData) => {
    setServerError(null);
    try {
      const res = await api.post('/api/auth/login', data);
      setAuth(res.data.user, res.data.accessToken);
      router.push('/editor');
    } catch (err: any) {
      setServerError(err.response?.data?.message || 'Login failed. Please try again.');
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className="w-full max-w-[420px]"
    >
      <div
        className="rounded-lg p-10"
        style={{
          backgroundColor: 'var(--bg-surface)',
          border: '1px solid var(--border-subtle)',
        }}
      >
        {/* Logo */}
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="relative">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: 'var(--accent)' }} />
            <div
              className="absolute inset-0 w-3 h-3 rounded-full animate-ping"
              style={{
                backgroundColor: 'var(--accent)',
                opacity: 0.4,
              }}
            />
          </div>
          <h1
            className="text-xl font-bold tracking-widest"
            style={{ fontFamily: 'var(--font-syne), Syne, sans-serif' }}
          >
            FORGE IDE
          </h1>
        </div>

        {/* Heading */}
        <h2
          className="text-2xl font-bold text-center mb-2"
          style={{ fontFamily: 'var(--font-syne), Syne, sans-serif' }}
        >
          Welcome back
        </h2>
        <p
          className="text-center mb-8 text-sm"
          style={{
            color: 'var(--text-secondary)',
            fontFamily: 'var(--font-space-mono), Space Mono, monospace',
          }}
        >
          Sign in to continue coding
        </p>

        {/* Server Error */}
        {serverError && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="mb-6 p-3 rounded-md text-sm"
            style={{
              backgroundColor: 'rgba(255, 69, 69, 0.1)',
              border: '1px solid rgba(255, 69, 69, 0.3)',
              color: '#ff4545',
              fontFamily: 'var(--font-space-mono), Space Mono, monospace',
            }}
          >
            {serverError}
          </motion.div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          {/* Email */}
          <div>
            <label
              htmlFor="login-email"
              className="block mb-2 text-xs tracking-wider uppercase"
              style={{
                color: 'var(--text-secondary)',
                fontFamily: 'var(--font-space-mono), Space Mono, monospace',
              }}
            >
              Email
            </label>
            <input
              id="login-email"
              type="email"
              autoComplete="email"
              {...register('email')}
              className="w-full px-4 py-3 rounded-md text-[13px] outline-none transition-all duration-200"
              style={{
                backgroundColor: 'var(--bg-elevated)',
                border: `1px solid ${errors.email ? '#ff4545' : 'var(--border-default)'}`,
                color: 'var(--text-primary)',
                fontFamily: 'var(--font-space-mono), Space Mono, monospace',
              }}
              onFocus={(e) => {
                if (!errors.email) e.target.style.borderColor = 'var(--accent)';
              }}
              onBlur={(e) => {
                if (!errors.email) e.target.style.borderColor = 'var(--border-default)';
              }}
              placeholder="you@example.com"
            />
            {errors.email && (
              <p className="mt-1 text-xs" style={{ color: '#ff4545' }}>
                {errors.email.message}
              </p>
            )}
          </div>

          {/* Password */}
          <div>
            <label
              htmlFor="login-password"
              className="block mb-2 text-xs tracking-wider uppercase"
              style={{
                color: 'var(--text-secondary)',
                fontFamily: 'var(--font-space-mono), Space Mono, monospace',
              }}
            >
              Password
            </label>
            <div className="relative">
              <input
                id="login-password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                {...register('password')}
                className="w-full px-4 py-3 pr-12 rounded-md text-[13px] outline-none transition-all duration-200"
                style={{
                  backgroundColor: 'var(--bg-elevated)',
                  border: `1px solid ${errors.password ? '#ff4545' : 'var(--border-default)'}`,
                  color: 'var(--text-primary)',
                  fontFamily: 'var(--font-space-mono), Space Mono, monospace',
                }}
                onFocus={(e) => {
                  if (!errors.password) e.target.style.borderColor = 'var(--accent)';
                }}
                onBlur={(e) => {
                  if (!errors.password) e.target.style.borderColor = 'var(--border-default)';
                }}
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs transition-colors duration-200"
                style={{
                  color: 'var(--text-muted)',
                  fontFamily: 'var(--font-space-mono), Space Mono, monospace',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--text-primary)')}
                onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-muted)')}
              >
                {showPassword ? 'HIDE' : 'SHOW'}
              </button>
            </div>
            {errors.password && (
              <p className="mt-1 text-xs" style={{ color: '#ff4545' }}>
                {errors.password.message}
              </p>
            )}
          </div>

          {/* Submit */}
          <button
            id="login-submit"
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3 rounded-md text-sm font-bold tracking-widest uppercase transition-all duration-200 disabled:opacity-50"
            style={{
              backgroundColor: 'var(--accent)',
              color: '#0a0a0a',
              fontFamily: 'var(--font-space-mono), Space Mono, monospace',
              letterSpacing: '1px',
            }}
            onMouseEnter={(e) => {
              if (!isSubmitting)
                e.currentTarget.style.boxShadow = '0 0 20px rgba(232, 255, 90, 0.4)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            {isSubmitting ? 'SIGNING IN...' : 'SIGN IN'}
          </button>
        </form>

        {/* Link to Register */}
        <p
          className="text-center mt-6 text-sm"
          style={{
            color: 'var(--text-secondary)',
            fontFamily: 'var(--font-space-mono), Space Mono, monospace',
          }}
        >
          Don&apos;t have an account?{' '}
          <Link
            href="/register"
            className="transition-colors duration-200"
            style={{ color: 'var(--accent)' }}
            onMouseEnter={(e) => (e.currentTarget.style.textDecoration = 'underline')}
            onMouseLeave={(e) => (e.currentTarget.style.textDecoration = 'none')}
          >
            Register
          </Link>
        </p>
      </div>
    </motion.div>
  );
}
