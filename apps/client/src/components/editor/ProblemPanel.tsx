'use client';

import DOMPurify from 'dompurify';
import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';

import { useEditorStore } from '../../store/editorStore';

// ── Problem Panel ────────────────────────────────

export function ProblemPanel() {
  const { currentProblem } = useEditorStore();
  const [expanded, setExpanded] = useState(false);

  if (!currentProblem) {
    return (
      <div
        className="flex items-center px-4 shrink-0"
        style={{
          height: '36px',
          backgroundColor: 'var(--bg-surface)',
          borderBottom: '1px solid var(--border-subtle)',
        }}
      >
        <span
          className="text-[11px]"
          style={{
            fontFamily: "'Space Mono', monospace",
            color: 'var(--text-muted)',
          }}
        >
          SCRATCH PAD — No problem loaded
        </span>
      </div>
    );
  }

  const sanitizedStatement = currentProblem.statement
    ? DOMPurify.sanitize(currentProblem.statement)
    : '';

  return (
    <motion.div
      className="shrink-0 overflow-hidden"
      style={{
        backgroundColor: 'var(--bg-surface)',
        borderBottom: '1px solid var(--border-subtle)',
      }}
      animate={{ height: expanded ? 260 : 120 }}
      transition={{ duration: 0.25, ease: 'easeInOut' }}
    >
      <div className="h-full flex flex-col">
        {/* Header */}
        <div
          className="flex items-center justify-between px-4 shrink-0"
          style={{
            height: '36px',
            borderBottom: '1px solid var(--border-subtle)',
          }}
        >
          <div className="flex items-center gap-3">
            <h2
              className="text-sm font-bold truncate max-w-[300px]"
              style={{ fontFamily: 'var(--font-syne), Syne, sans-serif' }}
            >
              {currentProblem.title}
            </h2>
            {currentProblem.timeLimit && (
              <span
                className="text-[10px] px-1.5 py-0.5 rounded"
                style={{
                  fontFamily: "'Space Mono', monospace",
                  backgroundColor: 'var(--bg-elevated)',
                  border: '1px solid var(--border-default)',
                  color: 'var(--text-secondary)',
                }}
              >
                {currentProblem.timeLimit}ms
              </span>
            )}
            {currentProblem.memoryLimit && (
              <span
                className="text-[10px] px-1.5 py-0.5 rounded"
                style={{
                  fontFamily: "'Space Mono', monospace",
                  backgroundColor: 'var(--bg-elevated)',
                  border: '1px solid var(--border-default)',
                  color: 'var(--text-secondary)',
                }}
              >
                {Math.round(currentProblem.memoryLimit / 1024)}MB
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {/* View on CF */}
            {currentProblem.link && currentProblem.platform === 'CODEFORCES' && (
              <a
                href={currentProblem.link}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[10px] px-2 py-1 rounded transition-all duration-200"
                style={{
                  fontFamily: "'Space Mono', monospace",
                  color: 'var(--blue)',
                  border: '1px solid var(--blue)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(90, 158, 255, 0.1)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }}
              >
                ↗ VIEW ON CF
              </a>
            )}

            {/* Expand/Collapse */}
            <button
              onClick={() => setExpanded(!expanded)}
              className="text-[10px] px-2 py-1 rounded transition-all duration-200"
              style={{
                fontFamily: "'Space Mono', monospace",
                color: 'var(--text-muted)',
                border: '1px solid var(--border-default)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'var(--accent)';
                e.currentTarget.style.color = 'var(--text-primary)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'var(--border-default)';
                e.currentTarget.style.color = 'var(--text-muted)';
              }}
            >
              {expanded ? '▲ COLLAPSE' : '▼ EXPAND'}
            </button>
          </div>
        </div>

        {/* Statement Content */}
        <div
          className="flex-1 overflow-y-auto px-4 py-2"
          style={{
            fontFamily: "'Space Mono', monospace",
            fontSize: '11px',
            lineHeight: '1.6',
            color: 'var(--text-secondary)',
          }}
        >
          {sanitizedStatement ? (
            <div dangerouslySetInnerHTML={{ __html: sanitizedStatement }} />
          ) : (
            <p style={{ color: 'var(--text-muted)' }}>
              {currentProblem.statement || 'No statement available.'}
            </p>
          )}
          {currentProblem.inputSpec && (
            <div className="mt-2">
              <strong style={{ color: 'var(--text-primary)' }}>Input:</strong>{' '}
              {currentProblem.inputSpec}
            </div>
          )}
          {currentProblem.outputSpec && (
            <div className="mt-1">
              <strong style={{ color: 'var(--text-primary)' }}>Output:</strong>{' '}
              {currentProblem.outputSpec}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
