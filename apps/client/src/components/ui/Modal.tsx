'use client';

// ── Modal Component ───────────────────────────────

import { motion } from 'framer-motion';
import { useEffect } from 'react';
import { createPortal } from 'react-dom';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  maxWidth?: string;
}

export function Modal({ isOpen, onClose, title, children, maxWidth = 'max-w-2xl' }: ModalProps) {
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

      {/* Modal Content */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        transition={{ duration: 0.2 }}
        className={`relative w-full ${maxWidth} bg-bg-surface border border-border-default rounded-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh]`}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-border-subtle bg-bg-elevated shrink-0">
          <h2 className="font-sans font-bold text-text-primary">{title}</h2>
          <button
            onClick={onClose}
            aria-label="Close modal"
            className="p-1 rounded hover:bg-bg-primary text-text-muted transition-colors"
          >
            ✕
          </button>
        </div>
        <div className="flex-1 overflow-auto p-4 bg-bg-primary">{children}</div>
      </motion.div>
    </div>,
    document.body,
  );
}
