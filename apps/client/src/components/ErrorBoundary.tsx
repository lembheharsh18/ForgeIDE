'use client';

import React from 'react';

// ── Error Boundary (Class Component) ─────────────

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo): void {
    console.error('[Forge IDE] Runtime error:', error, info);
  }

  render(): React.ReactNode {
    if (this.state.hasError && this.state.error) {
      const errorMessage = this.state.error.message || 'Unknown error';
      const stack = this.state.error.stack || '';
      const stackLines = stack.split('\n').slice(0, 5).join('\n');

      return (
        <main
          className="min-h-screen flex flex-col items-center justify-center px-6"
          style={{ backgroundColor: 'var(--bg-primary)' }}
        >
          <div className="flex flex-col items-center text-center max-w-lg">
            <h1
              className="text-3xl font-bold mb-6 tracking-wider"
              style={{ fontFamily: 'var(--font-syne), Syne, sans-serif' }}
            >
              RUNTIME ERROR
            </h1>

            {/* Error message */}
            <div
              className="text-left w-full p-4 rounded mb-4"
              style={{
                fontFamily: "'Space Mono', monospace",
                fontSize: '12px',
                lineHeight: 1.6,
                backgroundColor: 'var(--bg-surface)',
                border: '1px solid var(--red)',
                color: 'var(--red)',
              }}
            >
              <p>{errorMessage}</p>
            </div>

            {/* Stack trace */}
            {stackLines && (
              <pre
                className="text-left w-full p-4 rounded mb-8 overflow-x-auto"
                style={{
                  fontFamily: "'Space Mono', monospace",
                  fontSize: '10px',
                  lineHeight: 1.5,
                  backgroundColor: 'var(--bg-surface)',
                  border: '1px solid var(--border-default)',
                  color: 'var(--text-muted)',
                  margin: 0,
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                }}
              >
                {stackLines}
              </pre>
            )}

            {/* Actions */}
            <div className="flex gap-3">
              <button
                onClick={() => window.location.reload()}
                className="px-6 py-2.5 rounded text-sm font-bold tracking-wider transition-all duration-200"
                style={{
                  fontFamily: "'Space Mono', monospace",
                  backgroundColor: 'var(--accent)',
                  color: '#0a0a0a',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.boxShadow = '0 0 20px rgba(232, 255, 90, 0.4)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                ⟳ RELOAD PAGE
              </button>
              <a
                href="/"
                className="px-6 py-2.5 rounded text-sm tracking-wider transition-all duration-200"
                style={{
                  fontFamily: "'Space Mono', monospace",
                  border: '1px solid var(--border-default)',
                  color: 'var(--text-primary)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = 'var(--accent)';
                  e.currentTarget.style.color = 'var(--accent)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'var(--border-default)';
                  e.currentTarget.style.color = 'var(--text-primary)';
                }}
              >
                → HOME
              </a>
            </div>
          </div>
        </main>
      );
    }

    return this.props.children;
  }
}
