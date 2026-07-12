'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { GoogleLogin } from '@react-oauth/google';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import api from '../../lib/axios';
import { useAuthStore } from '../../store/authStore';

// ── Validation Schema ────────────────────────────

const registerSchema = z
  .object({
    username: z
      .string()
      .min(3, 'Username must be at least 3 characters')
      .max(20, 'Username must be at most 20 characters')
      .regex(/^[a-zA-Z0-9_]+$/, 'Username must be alphanumeric (underscores allowed)'),
    email: z.string().email('Invalid email address'),
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(/[A-Z]/, 'Must contain at least 1 uppercase letter')
      .regex(/[0-9]/, 'Must contain at least 1 number'),
    confirmPassword: z.string().min(1, 'Please confirm your password'),
    codeforcesHandle: z.string().min(1, 'Codeforces handle is required'),
    codechefHandle: z.string().min(1, 'CodeChef handle is required'),
    leetcodeUsername: z.string().min(1, 'LeetCode username is required'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

type RegisterFormData = z.infer<typeof registerSchema>;

// ── RegisterForm Component ───────────────────────

export function RegisterForm() {
  const router = useRouter();
  const { setAuth } = useAuthStore();
  const [step, setStep] = useState<1 | 2>(1);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    trigger,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      username: '',
      email: '',
      password: '',
      confirmPassword: '',
      codeforcesHandle: '',
      codechefHandle: '',
      leetcodeUsername: '',
    },
  });

  const handleNextStep = async () => {
    const isValid = await trigger(['username', 'email', 'password', 'confirmPassword']);
    if (isValid) setStep(2);
  };

  const onSubmit = async (data: RegisterFormData) => {
    setServerError(null);
    try {
      const res = await api.post('/api/auth/register', {
        username: data.username,
        email: data.email,
        password: data.password,
        codeforcesHandle: data.codeforcesHandle,
        codechefHandle: data.codechefHandle,
        leetcodeUsername: data.leetcodeUsername,
      });
      setAuth(res.data.user, res.data.accessToken);
      router.push('/club');
    } catch (err: any) {
      const msg =
        err.response?.data?.message ||
        err.response?.data?.error ||
        'Registration failed. Please try again.';
      setServerError(msg);
    }
  };

  // Shared input styles
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
          Create account
        </h2>
        <p className="text-center mb-4 text-sm" style={labelStyle}>
          Join the competitive coding arena
        </p>

        {/* Step Indicator */}
        <div className="flex items-center justify-center gap-2 mb-6">
          <div
            className="flex items-center justify-center w-6 h-6 rounded-full text-[10px] font-bold transition-all duration-300"
            style={{
              backgroundColor: 'var(--accent)',
              color: '#0a0a0a',
              fontFamily: 'var(--font-space-mono), Space Mono, monospace',
            }}
          >
            1
          </div>
          <div
            className="h-px flex-1 max-w-[60px] transition-all duration-300"
            style={{
              backgroundColor: step === 2 ? 'var(--accent)' : 'var(--border-default)',
            }}
          />
          <div
            className="flex items-center justify-center w-6 h-6 rounded-full text-[10px] font-bold transition-all duration-300"
            style={{
              backgroundColor: step === 2 ? 'var(--accent)' : 'var(--bg-elevated)',
              color: step === 2 ? '#0a0a0a' : 'var(--text-muted)',
              border: step === 2 ? 'none' : '1px solid var(--border-default)',
              fontFamily: 'var(--font-space-mono), Space Mono, monospace',
            }}
          >
            2
          </div>
        </div>

        <p
          className="text-center mb-6 text-[10px] tracking-widest uppercase"
          style={{
            ...labelStyle,
            color: 'var(--text-muted)',
          }}
        >
          {step === 1 ? 'Account Info' : 'Coding Handles'}
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
          {step === 1 ? (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-5"
            >
              {/* Username */}
              <div>
                <label
                  htmlFor="register-username"
                  className="block mb-2 text-xs tracking-wider uppercase"
                  style={labelStyle}
                >
                  Username
                </label>
                <input
                  id="register-username"
                  type="text"
                  autoComplete="username"
                  {...register('username')}
                  className="w-full px-4 py-3 rounded-md text-[13px] outline-none transition-all duration-200"
                  style={inputStyle(!!errors.username)}
                  onFocus={(e) => {
                    if (!errors.username) e.target.style.borderColor = 'var(--accent)';
                  }}
                  onBlur={(e) => {
                    if (!errors.username) e.target.style.borderColor = 'var(--border-default)';
                  }}
                  placeholder="your_username"
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
                  htmlFor="register-email"
                  className="block mb-2 text-xs tracking-wider uppercase"
                  style={labelStyle}
                >
                  Email
                </label>
                <input
                  id="register-email"
                  type="email"
                  autoComplete="email"
                  {...register('email')}
                  className="w-full px-4 py-3 rounded-md text-[13px] outline-none transition-all duration-200"
                  style={inputStyle(!!errors.email)}
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
                  htmlFor="register-password"
                  className="block mb-2 text-xs tracking-wider uppercase"
                  style={labelStyle}
                >
                  Password
                </label>
                <div className="relative">
                  <input
                    id="register-password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    {...register('password')}
                    className="w-full px-4 py-3 pr-12 rounded-md text-[13px] outline-none transition-all duration-200"
                    style={inputStyle(!!errors.password)}
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

              {/* Confirm Password */}
              <div>
                <label
                  htmlFor="register-confirm"
                  className="block mb-2 text-xs tracking-wider uppercase"
                  style={labelStyle}
                >
                  Confirm Password
                </label>
                <div className="relative">
                  <input
                    id="register-confirm"
                    type={showConfirm ? 'text' : 'password'}
                    autoComplete="new-password"
                    {...register('confirmPassword')}
                    className="w-full px-4 py-3 pr-12 rounded-md text-[13px] outline-none transition-all duration-200"
                    style={inputStyle(!!errors.confirmPassword)}
                    onFocus={(e) => {
                      if (!errors.confirmPassword) e.target.style.borderColor = 'var(--accent)';
                    }}
                    onBlur={(e) => {
                      if (!errors.confirmPassword)
                        e.target.style.borderColor = 'var(--border-default)';
                    }}
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm(!showConfirm)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-xs transition-colors duration-200"
                    style={{
                      color: 'var(--text-muted)',
                      fontFamily: 'var(--font-space-mono), Space Mono, monospace',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--text-primary)')}
                    onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-muted)')}
                  >
                    {showConfirm ? 'HIDE' : 'SHOW'}
                  </button>
                </div>
                {errors.confirmPassword && (
                  <p className="mt-1 text-xs" style={{ color: '#ff4545' }}>
                    {errors.confirmPassword.message}
                  </p>
                )}
              </div>

              {/* Next Step */}
              <button
                type="button"
                onClick={handleNextStep}
                className="w-full py-3 rounded-md text-sm font-bold tracking-widest uppercase transition-all duration-200"
                style={{
                  backgroundColor: 'var(--accent)',
                  color: '#0a0a0a',
                  fontFamily: 'var(--font-space-mono), Space Mono, monospace',
                  letterSpacing: '1px',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.boxShadow = '0 0 20px rgba(232, 255, 90, 0.4)';
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
              {/* Info banner */}
              <div
                className="p-3 rounded-md text-[11px] leading-relaxed"
                style={{
                  backgroundColor: 'rgba(232, 255, 90, 0.08)',
                  border: '1px solid rgba(232, 255, 90, 0.2)',
                  color: 'var(--accent)',
                  fontFamily: 'var(--font-space-mono), Space Mono, monospace',
                }}
              >
                Link your competitive programming handles to verify your identity and enable
                leaderboard tracking.
              </div>

              {/* Codeforces Handle */}
              <div>
                <label
                  htmlFor="register-cf"
                  className="block mb-2 text-xs tracking-wider uppercase"
                  style={labelStyle}
                >
                  <span style={{ color: '#3b5998' }}>●</span> Codeforces Handle
                </label>
                <input
                  id="register-cf"
                  type="text"
                  {...register('codeforcesHandle')}
                  className="w-full px-4 py-3 rounded-md text-[13px] outline-none transition-all duration-200"
                  style={inputStyle(!!errors.codeforcesHandle)}
                  onFocus={(e) => {
                    if (!errors.codeforcesHandle) e.target.style.borderColor = '#3b5998';
                  }}
                  onBlur={(e) => {
                    if (!errors.codeforcesHandle)
                      e.target.style.borderColor = 'var(--border-default)';
                  }}
                  placeholder="tourist"
                />
                {errors.codeforcesHandle && (
                  <p className="mt-1 text-xs" style={{ color: '#ff4545' }}>
                    {errors.codeforcesHandle.message}
                  </p>
                )}
              </div>

              {/* CodeChef Handle */}
              <div>
                <label
                  htmlFor="register-cc"
                  className="block mb-2 text-xs tracking-wider uppercase"
                  style={labelStyle}
                >
                  <span style={{ color: '#5B4638' }}>●</span> CodeChef Handle
                </label>
                <input
                  id="register-cc"
                  type="text"
                  {...register('codechefHandle')}
                  className="w-full px-4 py-3 rounded-md text-[13px] outline-none transition-all duration-200"
                  style={inputStyle(!!errors.codechefHandle)}
                  onFocus={(e) => {
                    if (!errors.codechefHandle) e.target.style.borderColor = '#5B4638';
                  }}
                  onBlur={(e) => {
                    if (!errors.codechefHandle)
                      e.target.style.borderColor = 'var(--border-default)';
                  }}
                  placeholder="your_codechef_id"
                />
                {errors.codechefHandle && (
                  <p className="mt-1 text-xs" style={{ color: '#ff4545' }}>
                    {errors.codechefHandle.message}
                  </p>
                )}
              </div>

              {/* LeetCode Username */}
              <div>
                <label
                  htmlFor="register-lc"
                  className="block mb-2 text-xs tracking-wider uppercase"
                  style={labelStyle}
                >
                  <span style={{ color: '#ffa116' }}>●</span> LeetCode Username
                </label>
                <input
                  id="register-lc"
                  type="text"
                  {...register('leetcodeUsername')}
                  className="w-full px-4 py-3 rounded-md text-[13px] outline-none transition-all duration-200"
                  style={inputStyle(!!errors.leetcodeUsername)}
                  onFocus={(e) => {
                    if (!errors.leetcodeUsername) e.target.style.borderColor = '#ffa116';
                  }}
                  onBlur={(e) => {
                    if (!errors.leetcodeUsername)
                      e.target.style.borderColor = 'var(--border-default)';
                  }}
                  placeholder="your_leetcode_id"
                />
                {errors.leetcodeUsername && (
                  <p className="mt-1 text-xs" style={{ color: '#ff4545' }}>
                    {errors.leetcodeUsername.message}
                  </p>
                )}
              </div>

              {/* Buttons */}
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="flex-1 py-3 rounded-md text-sm tracking-widest uppercase transition-all duration-200"
                  style={{
                    border: '1px solid var(--border-default)',
                    color: 'var(--text-primary)',
                    fontFamily: 'var(--font-space-mono), Space Mono, monospace',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = 'var(--accent)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = 'var(--border-default)';
                  }}
                >
                  ← BACK
                </button>
                <button
                  id="register-submit"
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-[2] py-3 rounded-md text-sm font-bold tracking-widest uppercase transition-all duration-200 disabled:opacity-50"
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
                  {isSubmitting ? 'VERIFYING...' : 'CREATE ACCOUNT'}
                </button>
              </div>
            </motion.div>
          )}
        </form>

        <div className="flex items-center gap-4 my-6">
          <div className="flex-1 h-px bg-[var(--border-default)]" />
          <span className="text-xs text-[var(--text-muted)] font-mono tracking-widest">OR</span>
          <div className="flex-1 h-px bg-[var(--border-default)]" />
        </div>

        <div className="flex justify-center">
          <GoogleLogin
            onSuccess={async (credentialResponse) => {
              try {
                const res = await api.post('/api/auth/google', {
                  credential: credentialResponse.credential,
                });
                setAuth(res.data.user, res.data.accessToken);
                router.push('/club');
              } catch (err: any) {
                setServerError(err.response?.data?.message || 'Google Signup failed.');
              }
            }}
            onError={() => {
              setServerError('Google Signup failed.');
            }}
            theme="filled_black"
            text="signup_with"
            shape="rectangular"
          />
        </div>

        {/* Links */}
        <div className="mt-6 space-y-2">
          <p
            className="text-center text-sm"
            style={{
              color: 'var(--text-secondary)',
              fontFamily: 'var(--font-space-mono), Space Mono, monospace',
            }}
          >
            Already have an account?{' '}
            <Link
              href="/login"
              className="transition-colors duration-200"
              style={{ color: 'var(--accent)' }}
              onMouseEnter={(e) => (e.currentTarget.style.textDecoration = 'underline')}
              onMouseLeave={(e) => (e.currentTarget.style.textDecoration = 'none')}
            >
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </motion.div>
  );
}
