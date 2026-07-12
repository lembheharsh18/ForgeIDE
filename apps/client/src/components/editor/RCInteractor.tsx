'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useRef, useState, useCallback } from 'react';
import type { Socket } from 'socket.io-client';
import { io } from 'socket.io-client';

import { useAuthStore } from '../../store/authStore';
import { useEditorStore } from '../../store/editorStore';

// ── Types ────────────────────────────────────────

type RCStatus = 'idle' | 'compiling' | 'waiting' | 'running' | 'ended';

interface TerminalMessage {
  id: string;
  data: string;
  type: 'stdout' | 'stdin' | 'error' | 'system';
  turn: number;
  timestamp: number;
}

// ── Status Config ────────────────────────────────

const STATUS_CONFIG: Record<RCStatus, { label: string; color: string; pulse: boolean }> = {
  idle: { label: 'IDLE', color: '#666666', pulse: false },
  compiling: { label: 'COMPILING...', color: '#fbbf24', pulse: true },
  waiting: { label: 'AWAITING INPUT', color: '#60a5fa', pulse: true },
  running: { label: 'RUNNING', color: '#39ff8a', pulse: true },
  ended: { label: 'EXITED', color: '#666666', pulse: false },
};

// ── RC Interactor Panel ──────────────────────────

export function RCInteractor() {
  const { accessToken } = useAuthStore();
  const { code, language, toggleRCMode } = useEditorStore();

  // Local state
  const [messages, setMessages] = useState<TerminalMessage[]>([]);
  const [status, setStatus] = useState<RCStatus>('idle');
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [inputValue, setInputValue] = useState('');
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [exitCode, setExitCode] = useState<number | null>(null);
  const [showInfo, setShowInfo] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const socketRef = useRef<Socket | null>(null);
  const terminalRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const msgIdRef = useRef(0);

  // ── Generate unique message ID ─────────────────
  const nextMsgId = useCallback(() => {
    msgIdRef.current++;
    return `msg-${msgIdRef.current}`;
  }, []);

  // ── Add message helper ─────────────────────────
  const addMessage = useCallback(
    (data: string, type: TerminalMessage['type'], turn: number) => {
      setMessages((prev) => [
        ...prev,
        {
          id: nextMsgId(),
          data,
          type,
          turn,
          timestamp: Date.now(),
        },
      ]);
    },
    [nextMsgId],
  );

  // ── Socket Setup ───────────────────────────────
  useEffect(() => {
    const wsUrl = process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:4000';

    const socket = io(`${wsUrl}/rc`, {
      auth: { token: accessToken },
      autoConnect: true,
      transports: ['websocket', 'polling'],
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      addMessage('Connected to RC Interactor', 'system', 0);
    });

    socket.on('connect_error', (err) => {
      addMessage(`Connection error: ${err.message}`, 'error', 0);
    });

    socket.on('rc:connected', (data: { sessionId: string }) => {
      setSessionId(data.sessionId);
      addMessage(`Session ready. Click START SESSION to begin.`, 'system', 0);
    });

    socket.on('rc:status', (data: { status: string }) => {
      setStatus(data.status as RCStatus);
    });

    socket.on('rc:output', (data: { data: string; type: string; turn: number }) => {
      addMessage(data.data, data.type as TerminalMessage['type'], data.turn);

      // Focus input when waiting for input
      if (data.type === 'stdout') {
        setTimeout(() => inputRef.current?.focus(), 100);
      }
    });

    socket.on('rc:ended', (data: { exitCode: number; reason?: string }) => {
      setStatus('ended');
      setExitCode(data.exitCode);
      const reasonText =
        data.reason === 'compile_error'
          ? 'Compilation Error'
          : data.reason === 'killed'
            ? 'Killed by user'
            : data.reason === 'runtime_error'
              ? 'Runtime Error'
              : data.reason === 'completed'
                ? 'Program completed'
                : `Exit code: ${data.exitCode}`;
      addMessage(`Session ended — ${reasonText}`, 'system', 0);
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
    // Only run once on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Auto-scroll terminal ──────────────────────
  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [messages.length]);

  // ── Timer ──────────────────────────────────────
  useEffect(() => {
    if (status === 'compiling' || status === 'running' || status === 'waiting') {
      if (!timerRef.current) {
        timerRef.current = setInterval(() => {
          setElapsedSeconds((prev) => prev + 1);
        }, 1000);
      }
    }

    if (status === 'ended' || status === 'idle') {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [status]);

  // ── Format Timer ───────────────────────────────
  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60)
      .toString()
      .padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  // ── Actions ────────────────────────────────────

  const handleStart = useCallback(() => {
    if (!socketRef.current || status !== 'idle') return;
    setMessages([]);
    setElapsedSeconds(0);
    setExitCode(null);
    addMessage('Starting session...', 'system', 0);
    socketRef.current.emit('rc:start', { code, language });
  }, [status, code, language, addMessage]);

  const handleSendInput = useCallback(() => {
    if (!socketRef.current || status !== 'waiting' || !inputValue.trim()) return;
    socketRef.current.emit('rc:input', { line: inputValue });
    setInputValue('');
  }, [status, inputValue]);

  const handleKill = useCallback(() => {
    if (!socketRef.current || status === 'idle' || status === 'ended') return;
    socketRef.current.emit('rc:kill');
  }, [status]);

  const handleClear = useCallback(() => {
    setMessages([]);
  }, []);

  const handleClose = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
    }
    toggleRCMode();
  }, [toggleRCMode]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        handleSendInput();
      }
    },
    [handleSendInput],
  );

  const statusCfg = STATUS_CONFIG[status];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 10 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className="flex flex-col"
      style={{
        position: isFullscreen ? 'fixed' : 'absolute',
        inset: 0,
        zIndex: isFullscreen ? 9999 : 20,
        backgroundColor: 'var(--bg-primary)',
      }}
    >
      {/* ── Header ─────────────────────────────── */}
      <div
        className="flex items-center justify-between px-4 shrink-0"
        style={{
          height: '48px',
          backgroundColor: 'var(--bg-surface)',
          borderBottom: '1px solid var(--border-subtle)',
        }}
      >
        {/* Left: Title + Status */}
        <div className="flex items-center gap-4">
          <span
            className="text-xs font-bold tracking-[1px]"
            style={{
              fontFamily: "'Space Mono', monospace",
              color: 'var(--orange)',
            }}
          >
            ⚡ RC INTERACTOR
          </span>

          {/* Status pill */}
          <div
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[9px] font-bold tracking-wider"
            style={{
              fontFamily: "'Space Mono', monospace",
              color: statusCfg.color,
              border: `1px solid ${statusCfg.color}`,
            }}
          >
            {statusCfg.pulse && (
              <motion.span
                className="inline-block w-1.5 h-1.5 rounded-full"
                style={{ backgroundColor: statusCfg.color }}
                animate={{ opacity: [0.3, 1, 0.3] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              />
            )}
            {status === 'ended' && exitCode !== null ? `EXITED [${exitCode}]` : statusCfg.label}
          </div>

          {/* Elapsed timer */}
          <span
            className="text-xs"
            style={{
              fontFamily: "'Space Mono', monospace",
              color: 'var(--text-muted)',
            }}
          >
            {formatTime(elapsedSeconds)}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="flex items-center gap-1.5 px-3 py-1 rounded text-xs transition-all duration-150"
            style={{
              fontFamily: "'Space Mono', monospace",
              border: '1px solid var(--border-default)',
              color: 'var(--text-muted)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = 'var(--text-primary)';
              e.currentTarget.style.color = 'var(--text-primary)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = 'var(--border-default)';
              e.currentTarget.style.color = 'var(--text-muted)';
            }}
          >
            {isFullscreen ? '↙ EXIT FULLSCREEN' : '↗ FULLSCREEN'}
          </button>

          <button
            onClick={handleClose}
            className="flex items-center gap-1.5 px-3 py-1 rounded text-xs transition-all duration-150"
            style={{
              fontFamily: "'Space Mono', monospace",
              border: '1px solid var(--border-default)',
              color: 'var(--text-muted)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = 'var(--red)';
              e.currentTarget.style.color = 'var(--red)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = 'var(--border-default)';
              e.currentTarget.style.color = 'var(--text-muted)';
            }}
          >
            ✕ CLOSE
          </button>
        </div>
      </div>

      {/* ── Info Banner ────────────────────────── */}
      <AnimatePresence>
        {showInfo && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div
              className="m-2 p-3 rounded flex items-start justify-between gap-2"
              style={{
                backgroundColor: 'var(--bg-elevated)',
                border: '1px solid var(--border-subtle)',
              }}
            >
              <p
                className="text-xs leading-relaxed"
                style={{
                  fontFamily: "'Space Mono', monospace",
                  color: 'var(--text-muted)',
                }}
              >
                RC Interactor simulates interactive problems. Your program runs live — type what the
                judge would send and see how your solution responds. Perfect for Codeforces
                interactive rounds.
              </p>
              <button
                onClick={() => setShowInfo(false)}
                className="text-xs shrink-0 transition-colors duration-150"
                style={{
                  fontFamily: "'Space Mono', monospace",
                  color: 'var(--text-muted)',
                }}
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
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Main Body ──────────────────────────── */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left: Code Preview (read-only) */}
        <div
          className="flex flex-col overflow-hidden"
          style={{
            width: '45%',
            borderRight: '1px solid var(--border-subtle)',
          }}
        >
          <div
            className="px-3 py-1.5 shrink-0"
            style={{
              borderBottom: '1px solid var(--border-subtle)',
              backgroundColor: 'var(--bg-surface)',
            }}
          >
            <span
              className="text-[9px] tracking-[2px] uppercase"
              style={{
                fontFamily: "'Space Mono', monospace",
                color: 'var(--text-muted)',
              }}
            >
              CODE ({language.toUpperCase()})
            </span>
          </div>
          <pre
            className="flex-1 overflow-auto p-3"
            style={{
              fontFamily: "'Space Mono', monospace",
              fontSize: '11px',
              lineHeight: '1.8',
              backgroundColor: 'var(--bg-primary)',
              color: status !== 'idle' ? 'var(--text-muted)' : 'var(--text-primary)',
              margin: 0,
              opacity: status !== 'idle' ? 0.6 : 1,
              transition: 'opacity 0.3s ease',
            }}
          >
            {code || '// No code loaded'}
          </pre>
        </div>

        {/* Right: Terminal */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <div
            className="px-3 py-1.5 shrink-0"
            style={{
              borderBottom: '1px solid var(--border-subtle)',
              backgroundColor: 'var(--bg-surface)',
            }}
          >
            <span
              className="text-[9px] tracking-[2px] uppercase"
              style={{
                fontFamily: "'Space Mono', monospace",
                color: 'var(--text-muted)',
              }}
            >
              TERMINAL
            </span>
          </div>

          {/* Messages area */}
          <div
            ref={terminalRef}
            className="flex-1 overflow-y-auto"
            style={{
              padding: '14px',
              backgroundColor: 'var(--bg-primary)',
            }}
          >
            {messages.length === 0 && (
              <p
                className="text-xs italic"
                style={{
                  fontFamily: "'Space Mono', monospace",
                  color: 'var(--text-muted)',
                }}
              >
                {'// Terminal output will appear here...'}
              </p>
            )}
            <AnimatePresence>
              {messages.map((msg) => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.15, ease: 'easeOut' }}
                  className="mb-1"
                >
                  <MessageLine msg={msg} />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          {/* Input row */}
          <div
            className="flex items-center shrink-0"
            style={{
              height: '48px',
              backgroundColor: 'var(--bg-surface)',
              borderTop: '1px solid var(--border-subtle)',
            }}
          >
            <input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={status !== 'waiting'}
              placeholder={
                status === 'waiting'
                  ? 'Send input to your program...'
                  : status === 'ended'
                    ? 'Session ended'
                    : 'Waiting...'
              }
              className="flex-1 bg-transparent border-none outline-none disabled:opacity-40"
              style={{
                fontFamily: "'Space Mono', monospace",
                fontSize: '12px',
                padding: '10px 14px',
                color: 'var(--text-primary)',
              }}
              spellCheck={false}
              autoComplete="off"
            />
            <button
              onClick={handleSendInput}
              disabled={status !== 'waiting' || !inputValue.trim()}
              className="h-full px-4 text-xs font-bold tracking-wider transition-all duration-150 disabled:opacity-30"
              style={{
                fontFamily: "'Space Mono', monospace",
                backgroundColor: 'var(--orange)',
                color: '#0a0a0a',
              }}
              onMouseEnter={(e) => {
                if (status === 'waiting') {
                  e.currentTarget.style.backgroundColor = '#ff9e5a';
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--orange)';
              }}
            >
              SEND ↵
            </button>
          </div>
        </div>
      </div>

      {/* ── Footer Buttons ─────────────────────── */}
      <div
        className="flex items-center gap-2 px-4 shrink-0"
        style={{
          height: '48px',
          backgroundColor: 'var(--bg-surface)',
          borderTop: '1px solid var(--border-subtle)',
        }}
      >
        {/* Start Session */}
        <button
          onClick={handleStart}
          disabled={status !== 'idle'}
          className="flex items-center gap-1.5 px-4 h-8 rounded text-xs font-bold tracking-wider transition-all duration-200 disabled:opacity-40"
          style={{
            fontFamily: "'Space Mono', monospace",
            backgroundColor: 'var(--accent)',
            color: '#0a0a0a',
          }}
          onMouseEnter={(e) => {
            if (status === 'idle') {
              e.currentTarget.style.boxShadow = '0 0 20px rgba(232, 255, 90, 0.4)';
            }
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.boxShadow = 'none';
          }}
        >
          ▶ START SESSION
        </button>

        {/* Kill Session */}
        <button
          onClick={handleKill}
          disabled={status === 'idle' || status === 'ended'}
          className="flex items-center gap-1.5 px-4 h-8 rounded text-xs font-bold tracking-wider transition-all duration-200 disabled:opacity-30"
          style={{
            fontFamily: "'Space Mono', monospace",
            border: '1px solid var(--red)',
            color: 'var(--red)',
            backgroundColor: 'transparent',
          }}
          onMouseEnter={(e) => {
            if (status !== 'idle' && status !== 'ended') {
              e.currentTarget.style.backgroundColor = 'rgba(255, 69, 69, 0.1)';
            }
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent';
          }}
        >
          ■ KILL SESSION
        </button>

        {/* Clear Terminal */}
        <button
          onClick={handleClear}
          className="flex items-center gap-1.5 px-3 h-8 rounded text-xs tracking-wider transition-all duration-200"
          style={{
            fontFamily: "'Space Mono', monospace",
            color: 'var(--text-muted)',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = 'var(--text-primary)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = 'var(--text-muted)';
          }}
        >
          ⟳ CLEAR
        </button>

        {/* Session ID (right) */}
        {sessionId && (
          <span
            className="ml-auto text-[9px]"
            style={{
              fontFamily: "'Space Mono', monospace",
              color: 'var(--text-muted)',
              opacity: 0.5,
            }}
          >
            {sessionId.slice(0, 8)}
          </span>
        )}
      </div>
    </motion.div>
  );
}

// ── Message Line Component ───────────────────────

function MessageLine({ msg }: { msg: TerminalMessage }) {
  const style: React.CSSProperties = {
    fontFamily: "'Space Mono', monospace",
    fontSize: '12px',
    lineHeight: '1.7',
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-all',
  };

  switch (msg.type) {
    case 'system':
      return (
        <div style={{ ...style, color: 'var(--text-muted)', fontStyle: 'italic' }}>
          {'// '}
          {msg.data}
        </div>
      );
    case 'stdout':
      return <div style={{ ...style, color: '#39ff8a' }}>{msg.data}</div>;
    case 'stdin':
      return (
        <div style={{ ...style, color: '#ff8c42' }}>
          {'> '}
          {msg.data}
        </div>
      );
    case 'error':
      return (
        <div style={{ ...style, color: '#ff4545' }}>
          {'! '}
          {msg.data}
        </div>
      );
    default:
      return <div style={style}>{msg.data}</div>;
  }
}
