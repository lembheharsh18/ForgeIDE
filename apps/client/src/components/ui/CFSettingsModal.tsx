'use client';

// ── CF Settings Modal ────────────────────────────

import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

import { useCFSettingsStore } from '../../store/cfSettingsStore';

interface CFSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CFSettingsModal({ isOpen, onClose }: CFSettingsModalProps) {
  const { cfHandle, cfApiKey, cfApiSecret, setCFSettings, clearCFSettings, loadFromStorage } =
    useCFSettingsStore();

  const [handle, setHandle] = useState(cfHandle);
  const [apiKey, setApiKey] = useState(cfApiKey);
  const [apiSecret, setApiSecret] = useState(cfApiSecret);
  const [showSecret, setShowSecret] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    loadFromStorage();
  }, [loadFromStorage]);

  useEffect(() => {
    setHandle(cfHandle);
    setApiKey(cfApiKey);
    setApiSecret(cfApiSecret);
  }, [cfHandle, cfApiKey, cfApiSecret]);

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

  if (!isOpen) return null;

  const handleSave = () => {
    setCFSettings({ cfHandle: handle, cfApiKey: apiKey, cfApiSecret: apiSecret });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleClear = () => {
    clearCFSettings();
    setHandle('');
    setApiKey('');
    setApiSecret('');
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
            className="font-bold text-sm"
            style={{ fontFamily: 'var(--font-syne), Syne, sans-serif' }}
          >
            CF SETTINGS
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
          {/* Warning */}
          <div
            className="flex items-start gap-2 p-3 rounded text-xs leading-relaxed"
            style={{
              fontFamily: "'Space Mono', monospace",
              backgroundColor: 'rgba(251, 191, 36, 0.08)',
              border: '1px solid rgba(251, 191, 36, 0.2)',
              color: '#fbbf24',
            }}
          >
            <span className="shrink-0 text-sm">⚠</span>
            <span>
              Your CF credentials are stored locally in this browser and never sent to Forge servers
              — only directly to the Codeforces API.
            </span>
          </div>

          {/* CF Handle */}
          <div className="flex flex-col gap-1.5">
            <label
              className="text-[10px] font-bold tracking-widest uppercase"
              style={{
                fontFamily: "'Space Mono', monospace",
                color: 'var(--text-muted)',
              }}
            >
              CF HANDLE
            </label>
            <input
              type="text"
              value={handle}
              onChange={(e) => setHandle(e.target.value)}
              placeholder="your_codeforces_handle"
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

          {/* CF API Key */}
          <div className="flex flex-col gap-1.5">
            <label
              className="text-[10px] font-bold tracking-widest uppercase"
              style={{
                fontFamily: "'Space Mono', monospace",
                color: 'var(--text-muted)',
              }}
            >
              CF API KEY
            </label>
            <input
              type="text"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="Paste your API key from codeforces.com/settings/api"
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

          {/* CF API Secret */}
          <div className="flex flex-col gap-1.5">
            <label
              className="text-[10px] font-bold tracking-widest uppercase flex items-center justify-between"
              style={{
                fontFamily: "'Space Mono', monospace",
                color: 'var(--text-muted)',
              }}
            >
              CF API SECRET
              <button
                type="button"
                onClick={() => setShowSecret(!showSecret)}
                className="text-[9px] tracking-normal normal-case"
                style={{ color: 'var(--blue)' }}
              >
                {showSecret ? 'HIDE' : 'SHOW'}
              </button>
            </label>
            <input
              type={showSecret ? 'text' : 'password'}
              value={apiSecret}
              onChange={(e) => setApiSecret(e.target.value)}
              placeholder="Paste your API secret"
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
          <div className="flex items-center justify-between pt-2">
            <button
              onClick={handleClear}
              className="text-xs px-3 py-1.5 rounded transition-colors duration-150"
              style={{
                fontFamily: "'Space Mono', monospace",
                color: 'var(--red)',
                border: '1px solid var(--red)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(255, 69, 69, 0.1)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
            >
              CLEAR
            </button>
            <button
              onClick={handleSave}
              className="text-xs px-5 py-1.5 rounded font-bold tracking-wider transition-all duration-200"
              style={{
                fontFamily: "'Space Mono', monospace",
                backgroundColor: saved ? 'var(--green)' : 'var(--accent)',
                color: '#0a0a0a',
              }}
              onMouseEnter={(e) => {
                if (!saved) e.currentTarget.style.boxShadow = '0 0 15px rgba(232, 255, 90, 0.3)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              {saved ? '✓ SAVED' : 'SAVE'}
            </button>
          </div>
        </div>
      </motion.div>
    </div>,
    document.body,
  );
}
