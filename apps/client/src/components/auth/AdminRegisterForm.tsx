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

const adminRegisterSchema = z
  .object({
    username: z
      .string()
      .min(3, 'Username must be at least 3 characters')
      .max(20, 'Username must be at most 20 characters')
      .regex(/^[a-zA-Z0-9_]+$/, 'Username must be alphanumeric'),
    email: z.string().email('Invalid email address'),
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(/[A-Z]/, 'Must contain at least 1 uppercase letter')
      .regex(/[0-9]/, 'Must contain at least 1 number'),
    confirmPassword: z.string().min(1, 'Please confirm your password'),
    inviteCode: z.string().min(1, 'Invite code is required'),
    codeforcesHandle: z.string().min(1, 'Codeforces handle is required'),
    codechefHandle: z.string().min(1, 'CodeChef handle is required'),
    leetcodeUsername: z.string().min(1, 'LeetCode username is required'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

type AdminRegisterFormData = z.infer<typeof adminRegisterSchema>;

// ── AdminRegisterForm Component ──────────────────

export function AdminRegisterForm() {
  const router = useRouter();
  const { setAuth } = useAuthStore();
  const [step, setStep] = useState<1 | 2>(1);
  const [showPassword, setShowPassword] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    trigger,
    formState: { errors, isSubmitting },
  } = useForm<AdminRegisterFormData>({
    resolver: zodResolver(adminRegisterSchema),
    defaultValues: {
      username: '',
      email: '',
      password: '',
      confirmPassword: '',
      inviteCode: '',
      codeforcesHandle: '',
      codechefHandle: '',
      leetcodeUsername: '',
    },
  });

  const handleNextStep = async () => {
    const isValid = await trigger([
      'username',
      'email',
      'password',
      'confirmPassword',
      'inviteCode',
    ]);
    if (isValid) setStep(2);
  };

  const onSubmit = async (data: AdminRegisterFormData) => {
    setServerError(null);
    try {
      const res = await api.post('/api/auth/register-admin', {
        username: data.username,
        email: data.email,
        password: data.password,
        inviteCode: data.inviteCode,
        codeforcesHandle: data.codeforcesHandle,
        codechefHandle: data.codechefHandle,
        leetcodeUsername: data.leetcodeUsername,
      });
      setAuth(res.data.user, res.data.accessToken);
      router.push('/admin/contests/add');
    } catch (err: any) {
      const msg =
        err.response?.data?.message || err.response?.data?.error || 'Registration failed.';
      setServerError(msg);
    }
  };

  const inputStyle = (hasError: boolean) => ({
    backgroundColor: 'var(--bg-elevated)',
    border: `1px solid ${hasError ? '#ff4545' : 'var(--border-default)'}`,
    color: 'var(--text-primary)',
    fontFamily: 'var(--font-space-mono), Space Mono, monospace',
  });

  const labelStyle = {
    color: 'var(--text-secondary)',
    fontFamily: 'var(--font-space-mono), Space Mono, monospace',
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
        <div className="flex items-center justify-center gap-3 mb-6">
          <div className="relative">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#ff8c42' }} />
            <div
              className="absolute inset-0 w-3 h-3 rounded-full animate-ping"
              style={{ backgroundColor: '#ff8c42', opacity: 0.4 }}
            />
          </div>
          <h1
            className="text-xl font-bold tracking-widest"
            style={{ fontFamily: 'var(--font-syne), Syne, sans-serif' }}
          >
            FORGE <span style={{ color: '#ff8c42' }}>ADMIN</span>
          </h1>
        </div>

        {/* Heading */}
        <h2
          className="text-2xl font-bold text-center mb-2"
          style={{ fontFamily: 'var(--font-syne), Syne, sans-serif' }}
        >
          Admin Registration
        </h2>
        <p className="text-center mb-4 text-sm" style={labelStyle}>
          Create an admin account with invite code
        </p>

        {/* Step Indicator */}
        <div className="flex items-center justify-center gap-2 mb-6">
          <div
            className="flex items-center justify-center w-6 h-6 rounded-full text-[10px] font-bold"
            style={{
              backgroundColor: '#ff8c42',
              color: '#0a0a0a',
              fontFamily: 'var(--font-space-mono), Space Mono, monospace',
            }}
          >
            1
          </div>
          <div
            className="h-px flex-1 max-w-[60px]"
            style={{ backgroundColor: step === 2 ? '#ff8c42' : 'var(--border-default)' }}
          />
          <div
            className="flex items-center justify-center w-6 h-6 rounded-full text-[10px] font-bold"
            style={{
              backgroundColor: step === 2 ? '#ff8c42' : 'var(--bg-elevated)',
              color: step === 2 ? '#0a0a0a' : 'var(--text-muted)',
              border: step === 2 ? 'none' : '1px solid var(--border-default)',
              fontFamily: 'var(--font-space-mono), Space Mono, monospace',
            }}
          >
            2
          </div>
        </div>

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
          {step === 1 ? (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-5"
            >
              {/* Invite Code */}
              <div>
                <label
                  htmlFor="admin-invite"
                  className="block mb-2 text-xs tracking-wider uppercase"
                  style={labelStyle}
                >
                  <span style={{ color: '#ff8c42' }}>●</span> Invite Code
                </label>
                <input
                  id="admin-invite"
                  type="password"
                  {...register('inviteCode')}
                  className="w-full px-4 py-3 rounded-md text-[13px] outline-none transition-all duration-200"
                  style={inputStyle(!!errors.inviteCode)}
                  onFocus={(e) => {
                    if (!errors.inviteCode) e.target.style.borderColor = '#ff8c42';
                  }}
                  onBlur={(e) => {
                    if (!errors.inviteCode) e.target.style.borderColor = 'var(--border-default)';
                  }}
                  placeholder="Enter invite code"
                />
                {errors.inviteCode && (
                  <p className="mt-1 text-xs" style={{ color: '#ff4545' }}>
                    {errors.inviteCode.message}
                  </p>
                )}
              </div>

              {/* Username */}
              <div>
                <label
                  htmlFor="admin-username"
                  className="block mb-2 text-xs tracking-wider uppercase"
                  style={labelStyle}
                >
                  Username
                </label>
                <input
                  id="admin-username"
                  type="text"
                  autoComplete="username"
                  {...register('username')}
                  className="w-full px-4 py-3 rounded-md text-[13px] outline-none transition-all duration-200"
                  style={inputStyle(!!errors.username)}
                  onFocus={(e) => {
                    if (!errors.username) e.target.style.borderColor = '#ff8c42';
                  }}
                  onBlur={(e) => {
                    if (!errors.username) e.target.style.borderColor = 'var(--border-default)';
                  }}
                  placeholder="admin_username"
                />
                {errors.username && (
                  <p className="mt-1 text-xs" style={{ color: '#ff4545' }}>
                    {errors.username.message}
                  </p>
                )}
              </div>

              {/* Email */}
              <div>
                <label
                  htmlFor="admin-email"
                  className="block mb-2 text-xs tracking-wider uppercase"
                  style={labelStyle}
                >
                  Email
                </label>
                <input
                  id="admin-email"
                  type="email"
                  autoComplete="email"
                  {...register('email')}
                  className="w-full px-4 py-3 rounded-md text-[13px] outline-none transition-all duration-200"
                  style={inputStyle(!!errors.email)}
                  onFocus={(e) => {
                    if (!errors.email) e.target.style.borderColor = '#ff8c42';
                  }}
                  onBlur={(e) => {
                    if (!errors.email) e.target.style.borderColor = 'var(--border-default)';
                  }}
                  placeholder="admin@example.com"
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
                  htmlFor="admin-password"
                  className="block mb-2 text-xs tracking-wider uppercase"
                  style={labelStyle}
                >
                  Password
                </label>
                <div className="relative">
                  <input
                    id="admin-password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    {...register('password')}
                    className="w-full px-4 py-3 pr-12 rounded-md text-[13px] outline-none transition-all duration-200"
                    style={inputStyle(!!errors.password)}
                    onFocus={(e) => {
                      if (!errors.password) e.target.style.borderColor = '#ff8c42';
                    }}
                    onBlur={(e) => {
                      if (!errors.password) e.target.style.borderColor = 'var(--border-default)';
                    }}
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-xs"
                    style={{
                      color: 'var(--text-muted)',
                      fontFamily: 'var(--font-space-mono), Space Mono, monospace',
                    }}
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

              {/* Confirm */}
              <div>
                <label
                  htmlFor="admin-confirm"
                  className="block mb-2 text-xs tracking-wider uppercase"
                  style={labelStyle}
                >
                  Confirm Password
                </label>
                <input
                  id="admin-confirm"
                  type="password"
                  autoComplete="new-password"
                  {...register('confirmPassword')}
                  className="w-full px-4 py-3 rounded-md text-[13px] outline-none transition-all duration-200"
                  style={inputStyle(!!errors.confirmPassword)}
                  placeholder="••••••••"
                />
                {errors.confirmPassword && (
                  <p className="mt-1 text-xs" style={{ color: '#ff4545' }}>
                    {errors.confirmPassword.message}
                  </p>
                )}
              </div>

              <button
                type="button"
                onClick={handleNextStep}
                className="w-full py-3 rounded-md text-sm font-bold tracking-widest uppercase transition-all duration-200"
                style={{
                  backgroundColor: '#ff8c42',
                  color: '#0a0a0a',
                  fontFamily: 'var(--font-space-mono), Space Mono, monospace',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.boxShadow = '0 0 20px rgba(255, 140, 66, 0.4)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                NEXT → LINK HANDLES
              </button>
            </motion.div>
          ) : (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-5"
            >
              {/* CF Handle */}
              <div>
                <label
                  htmlFor="admin-cf"
                  className="block mb-2 text-xs tracking-wider uppercase"
                  style={labelStyle}
                >
                  <span style={{ color: '#3b5998' }}>●</span> Codeforces Handle
                </label>
                <input
                  id="admin-cf"
                  type="text"
                  {...register('codeforcesHandle')}
                  className="w-full px-4 py-3 rounded-md text-[13px] outline-none transition-all duration-200"
                  style={inputStyle(!!errors.codeforcesHandle)}
                  placeholder="tourist"
                />
                {errors.codeforcesHandle && (
                  <p className="mt-1 text-xs" style={{ color: '#ff4545' }}>
                    {errors.codeforcesHandle.message}
                  </p>
                )}
              </div>

              {/* CC Handle */}
              <div>
                <label
                  htmlFor="admin-cc"
                  className="block mb-2 text-xs tracking-wider uppercase"
                  style={labelStyle}
                >
                  <span style={{ color: '#5B4638' }}>●</span> CodeChef Handle
                </label>
                <input
                  id="admin-cc"
                  type="text"
                  {...register('codechefHandle')}
                  className="w-full px-4 py-3 rounded-md text-[13px] outline-none transition-all duration-200"
                  style={inputStyle(!!errors.codechefHandle)}
                  placeholder="your_codechef_id"
                />
                {errors.codechefHandle && (
                  <p className="mt-1 text-xs" style={{ color: '#ff4545' }}>
                    {errors.codechefHandle.message}
                  </p>
                )}
              </div>

              {/* LC Username */}
              <div>
                <label
                  htmlFor="admin-lc"
                  className="block mb-2 text-xs tracking-wider uppercase"
                  style={labelStyle}
                >
                  <span style={{ color: '#ffa116' }}>●</span> LeetCode Username
                </label>
                <input
                  id="admin-lc"
                  type="text"
                  {...register('leetcodeUsername')}
                  className="w-full px-4 py-3 rounded-md text-[13px] outline-none transition-all duration-200"
                  style={inputStyle(!!errors.leetcodeUsername)}
                  placeholder="your_leetcode_id"
                />
                {errors.leetcodeUsername && (
                  <p className="mt-1 text-xs" style={{ color: '#ff4545' }}>
                    {errors.leetcodeUsername.message}
                  </p>
                )}
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="flex-1 py-3 rounded-md text-sm tracking-widest uppercase"
                  style={{
                    border: '1px solid var(--border-default)',
                    color: 'var(--text-primary)',
                    fontFamily: 'var(--font-space-mono), Space Mono, monospace',
                  }}
                >
                  ← BACK
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-[2] py-3 rounded-md text-sm font-bold tracking-widest uppercase disabled:opacity-50"
                  style={{
                    backgroundColor: '#ff8c42',
                    color: '#0a0a0a',
                    fontFamily: 'var(--font-space-mono), Space Mono, monospace',
                  }}
                  onMouseEnter={(e) => {
                    if (!isSubmitting)
                      e.currentTarget.style.boxShadow = '0 0 20px rgba(255, 140, 66, 0.4)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                >
                  {isSubmitting ? 'CREATING...' : 'CREATE ADMIN'}
                </button>
              </div>
            </motion.div>
          )}
        </form>

        {/* Links */}
        <div className="mt-6 space-y-2">
          <p
            className="text-center text-sm"
            style={{
              color: 'var(--text-secondary)',
              fontFamily: 'var(--font-space-mono), Space Mono, monospace',
            }}
          >
            Already have an admin account?{' '}
            <Link
              href="/admin/login"
              className="transition-colors duration-200"
              style={{ color: '#ff8c42' }}
              onMouseEnter={(e) => (e.currentTarget.style.textDecoration = 'underline')}
              onMouseLeave={(e) => (e.currentTarget.style.textDecoration = 'none')}
            >
              Sign in
            </Link>
          </p>
          <p
            className="text-center text-[11px]"
            style={{
              color: 'var(--text-muted)',
              fontFamily: 'var(--font-space-mono), Space Mono, monospace',
            }}
          >
            Not an admin?{' '}
            <Link
              href="/register"
              style={{ color: 'var(--accent)' }}
              onMouseEnter={(e) => (e.currentTarget.style.textDecoration = 'underline')}
              onMouseLeave={(e) => (e.currentTarget.style.textDecoration = 'none')}
            >
              User register
            </Link>
          </p>
        </div>
      </div>
    </motion.div>
  );
}
