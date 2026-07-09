'use client';

import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';

import api from '../../lib/axios';
import { useAuthStore } from '../../store/authStore';

interface ProfileSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ProfileSettingsModal({ isOpen, onClose }: ProfileSettingsModalProps) {
  const { user, setUser } = useAuthStore();
  const [cfHandle, setCfHandle] = useState('');
  const [lcUsername, setLcUsername] = useState('');
  const [ccHandle, setCcHandle] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (user) {
      setCfHandle(user.codeforcesHandle || '');
      setLcUsername(user.leetcodeUsername || '');
      setCcHandle(user.codechefHandle || '');
    }
  }, [user, isOpen]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen || !user) return null;

  const handleSave = async () => {
    setSaving(true);
    setError('');
    try {
      const { data } = await api.put('/api/auth/profile', {
        codeforcesHandle: cfHandle || null,
        leetcodeUsername: lcUsername || null,
        codechefHandle: ccHandle || null,
      });
      setUser(data.user);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
      />

      {/* Modal */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        transition={{ duration: 0.2 }}
        className="relative w-full max-w-md overflow-hidden rounded-lg shadow-2xl flex flex-col"
        style={{
          backgroundColor: 'var(--bg-surface)',
          border: '1px solid var(--border-default)',
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-5 py-3 shrink-0"
          style={{
            borderBottom: '1px solid var(--border-subtle)',
            backgroundColor: 'var(--bg-elevated)',
          }}
        >
          <h2
            className="font-bold text-sm tracking-wider"
            style={{ fontFamily: 'var(--font-syne), Syne, sans-serif' }}
          >
            EDIT PROFILE
          </h2>
          <button
            onClick={onClose}
            className="p-1 rounded transition-colors duration-150"
            style={{ color: 'var(--text-muted)' }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = 'var(--text-primary)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = 'var(--text-muted)';
            }}
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="flex flex-col gap-5 p-5" style={{ backgroundColor: 'var(--bg-primary)' }}>
          {error && (
            <div className="p-3 rounded text-xs text-red-500 bg-red-500/10 border border-red-500/20 font-mono">
              {error}
            </div>
          )}

          {/* Codeforces Handle */}
          <div className="flex flex-col gap-1.5">
            <label
              className="text-[10px] font-bold tracking-widest uppercase"
              style={{
                fontFamily: "'Space Mono', monospace",
                color: 'var(--text-muted)',
              }}
            >
              CODEFORCES HANDLE
            </label>
            <input
              type="text"
              value={cfHandle}
              onChange={(e) => setCfHandle(e.target.value)}
              placeholder="e.g. tourist"
              className="w-full px-3 py-2 rounded text-sm outline-none transition-colors"
              style={{
                fontFamily: "'Space Mono', monospace",
                backgroundColor: 'var(--bg-surface)',
                border: '1px solid var(--border-default)',
                color: 'var(--text-primary)',
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = 'var(--accent)';
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = 'var(--border-default)';
              }}
            />
          </div>

          {/* LeetCode Username */}
          <div className="flex flex-col gap-1.5">
            <label
              className="text-[10px] font-bold tracking-widest uppercase"
              style={{
                fontFamily: "'Space Mono', monospace",
                color: 'var(--text-muted)',
              }}
            >
              LEETCODE USERNAME
            </label>
            <input
              type="text"
              value={lcUsername}
              onChange={(e) => setLcUsername(e.target.value)}
              placeholder="e.g. awice"
              className="w-full px-3 py-2 rounded text-sm outline-none transition-colors"
              style={{
                fontFamily: "'Space Mono', monospace",
                backgroundColor: 'var(--bg-surface)',
                border: '1px solid var(--border-default)',
                color: 'var(--text-primary)',
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = 'var(--accent)';
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = 'var(--border-default)';
              }}
            />
          </div>

          {/* CodeChef Handle */}
          <div className="flex flex-col gap-1.5">
            <label
              className="text-[10px] font-bold tracking-widest uppercase flex items-center justify-between"
              style={{
                fontFamily: "'Space Mono', monospace",
                color: 'var(--text-muted)',
              }}
            >
              CODECHEF HANDLE
            </label>
            <input
              type="text"
              value={ccHandle}
              onChange={(e) => setCcHandle(e.target.value)}
              placeholder="e.g. codechef_user"
              className="w-full px-3 py-2 rounded text-sm outline-none transition-colors"
              style={{
                fontFamily: "'Space Mono', monospace",
                backgroundColor: 'var(--bg-surface)',
                border: '1px solid var(--border-default)',
                color: 'var(--text-primary)',
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = 'var(--accent)';
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = 'var(--border-default)';
              }}
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end pt-2">
            <button
              onClick={handleSave}
              disabled={saving}
              className="text-xs px-5 py-1.5 rounded font-bold tracking-wider transition-all duration-200 disabled:opacity-50"
              style={{
                fontFamily: "'Space Mono', monospace",
                backgroundColor: saved ? 'var(--green)' : 'var(--accent)',
                color: '#0a0a0a',
              }}
              onMouseEnter={(e) => {
                if (!saved && !saving) e.currentTarget.style.boxShadow = '0 0 15px rgba(232, 255, 90, 0.3)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              {saving ? 'SAVING...' : saved ? '✓ SAVED' : 'SAVE PROFILE'}
            </button>
          </div>
        </div>
      </motion.div>
    </div>,
    document.body,
  );
}
