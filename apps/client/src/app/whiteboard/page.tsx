'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useRef, useState, Suspense } from 'react';

import { ProtectedRoute } from '../../components/layout/ProtectedRoute';
import { Topbar } from '../../components/layout/Topbar';
import { useEditorStore } from '../../store/editorStore';

// ── Types ────────────────────────────────────────

type Tool = 'pen' | 'eraser' | 'rectangle' | 'line' | 'text';

interface Point {
  x: number;
  y: number;
}

interface DrawAction {
  tool: Tool;
  color: string;
  strokeWidth: number;
  points?: Point[];
  startPoint?: Point;
  endPoint?: Point;
  text?: string;
}

// ── Color Palette ────────────────────────────────

const COLORS = [
  '#f0f0f0',
  '#ff4545',
  '#ff8c42',
  '#fbbf24',
  '#39ff8a',
  '#5a9eff',
  '#c792ea',
  '#e8ff5a',
];

const DARK_COLORS = [
  '#f0f0f0',
  '#ff4545',
  '#ff8c42',
  '#fbbf24',
  '#39ff8a',
  '#5a9eff',
  '#c792ea',
  '#e8ff5a',
];

const LIGHT_COLORS = [
  '#0a0a0a',
  '#d32f2f',
  '#e65100',
  '#f57f17',
  '#2e7d32',
  '#1565c0',
  '#7b1fa2',
  '#827717',
];

// ── Tool Icons (SVG paths) ───────────────────────

const ToolIcon = ({ tool, size = 18 }: { tool: Tool; size?: number }) => {
  const icons: Record<Tool, React.ReactNode> = {
    pen: (
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
      </svg>
    ),
    eraser: (
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="m7 21-4.3-4.3c-1-1-1-2.5 0-3.4l9.6-9.6c1-1 2.5-1 3.4 0l5.6 5.6c1 1 1 2.5 0 3.4L13 21" />
        <path d="M22 21H7" />
        <path d="m5 11 9 9" />
      </svg>
    ),
    rectangle: (
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <rect x="3" y="3" width="18" height="18" rx="2" />
      </svg>
    ),
    line: (
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <line x1="5" y1="19" x2="19" y2="5" />
      </svg>
    ),
    text: (
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <polyline points="4 7 4 4 20 4 20 7" />
        <line x1="9" y1="20" x2="15" y2="20" />
        <line x1="12" y1="4" x2="12" y2="20" />
      </svg>
    ),
  };
  return <>{icons[tool]}</>;
};

// ── Generate Room Code ───────────────────────────

function generateRoomCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

// ── Canvas Whiteboard Component ──────────────────

function WhiteboardCanvas({ roomId }: { roomId: string }) {
  const theme = useEditorStore((s) => s.theme);
  const isDark = theme === 'dark';

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [tool, setTool] = useState<Tool>('pen');
  const [color, setColor] = useState(isDark ? '#f0f0f0' : '#0a0a0a');
  const [strokeWidth, setStrokeWidth] = useState(2);
  const [isDrawing, setIsDrawing] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [textInput, setTextInput] = useState('');
  const [textPosition, setTextPosition] = useState<Point | null>(null);
  const [copied, setCopied] = useState(false);

  const actionsRef = useRef<DrawAction[]>([]);
  const currentPointsRef = useRef<Point[]>([]);
  const startPointRef = useRef<Point | null>(null);

  const palette = isDark ? DARK_COLORS : LIGHT_COLORS;

  // Update color when theme changes
  useEffect(() => {
    setColor(isDark ? '#f0f0f0' : '#0a0a0a');
  }, [isDark]);

  // ── Canvas Sizing ─────────────────────────────

  const resizeCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const rect = container.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;

    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    canvas.style.width = `${rect.width}px`;
    canvas.style.height = `${rect.height}px`;

    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.scale(dpr, dpr);
      redrawCanvas();
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    return () => window.removeEventListener('resize', resizeCanvas);
  }, [resizeCanvas]);

  // Redraw on theme change
  useEffect(() => {
    redrawCanvas();
  }, [isDark]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Drawing Functions ─────────────────────────

  const getCanvasPoint = (e: React.MouseEvent): Point => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    ctx.clearRect(0, 0, rect.width, rect.height);
  };

  const drawAction = (ctx: CanvasRenderingContext2D, action: DrawAction) => {
    ctx.strokeStyle = action.color;
    ctx.fillStyle = action.color;
    ctx.lineWidth = action.strokeWidth;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    if (action.tool === 'eraser') {
      ctx.strokeStyle = isDark ? '#0a0a0a' : '#f5f5f0';
      ctx.lineWidth = action.strokeWidth * 5;
    }

    switch (action.tool) {
      case 'pen':
      case 'eraser':
        if (action.points && action.points.length > 0) {
          ctx.beginPath();
          ctx.moveTo(action.points[0].x, action.points[0].y);
          for (let i = 1; i < action.points.length; i++) {
            ctx.lineTo(action.points[i].x, action.points[i].y);
          }
          ctx.stroke();
        }
        break;

      case 'rectangle':
        if (action.startPoint && action.endPoint) {
          const w = action.endPoint.x - action.startPoint.x;
          const h = action.endPoint.y - action.startPoint.y;
          ctx.beginPath();
          ctx.strokeRect(action.startPoint.x, action.startPoint.y, w, h);
        }
        break;

      case 'line':
        if (action.startPoint && action.endPoint) {
          ctx.beginPath();
          ctx.moveTo(action.startPoint.x, action.startPoint.y);
          ctx.lineTo(action.endPoint.x, action.endPoint.y);
          ctx.stroke();
        }
        break;

      case 'text':
        if (action.startPoint && action.text) {
          ctx.font = `${Math.max(action.strokeWidth * 6, 14)}px 'Space Mono', monospace`;
          ctx.fillText(action.text, action.startPoint.x, action.startPoint.y);
        }
        break;
    }
  };

  const redrawCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    clearCanvas();
    actionsRef.current.forEach((action) => drawAction(ctx, action));
  };

  // ── Mouse Handlers ────────────────────────────

  const handleMouseDown = (e: React.MouseEvent) => {
    const point = getCanvasPoint(e);

    if (tool === 'text') {
      setTextPosition(point);
      return;
    }

    setIsDrawing(true);

    if (tool === 'pen' || tool === 'eraser') {
      currentPointsRef.current = [point];
    } else {
      startPointRef.current = point;
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDrawing) return;
    const point = getCanvasPoint(e);
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    if (tool === 'pen' || tool === 'eraser') {
      currentPointsRef.current.push(point);

      // Draw incrementally
      const points = currentPointsRef.current;
      if (points.length >= 2) {
        ctx.strokeStyle = tool === 'eraser' ? (isDark ? '#0a0a0a' : '#f5f5f0') : color;
        ctx.lineWidth = tool === 'eraser' ? strokeWidth * 5 : strokeWidth;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.beginPath();
        ctx.moveTo(points[points.length - 2].x, points[points.length - 2].y);
        ctx.lineTo(points[points.length - 1].x, points[points.length - 1].y);
        ctx.stroke();
      }
    } else {
      // For shapes, redraw everything + preview
      redrawCanvas();
      const preview: DrawAction = {
        tool,
        color,
        strokeWidth,
        startPoint: startPointRef.current!,
        endPoint: point,
      };
      drawAction(ctx, preview);
    }
  };

  const handleMouseUp = (e: React.MouseEvent) => {
    if (!isDrawing) return;
    setIsDrawing(false);

    const point = getCanvasPoint(e);

    if (tool === 'pen' || tool === 'eraser') {
      actionsRef.current.push({
        tool,
        color,
        strokeWidth,
        points: [...currentPointsRef.current],
      });
      currentPointsRef.current = [];
    } else {
      actionsRef.current.push({
        tool,
        color,
        strokeWidth,
        startPoint: startPointRef.current!,
        endPoint: point,
      });
      startPointRef.current = null;
    }
  };

  const handleTextSubmit = () => {
    if (!textInput.trim() || !textPosition) return;
    actionsRef.current.push({
      tool: 'text',
      color,
      strokeWidth,
      startPoint: textPosition,
      text: textInput,
    });
    setTextInput('');
    setTextPosition(null);
    redrawCanvas();
  };

  const handleUndo = () => {
    actionsRef.current.pop();
    redrawCanvas();
  };

  const handleClear = () => {
    actionsRef.current = [];
    clearCanvas();
  };

  const handleCopyCode = async () => {
    await navigator.clipboard.writeText(roomId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // ── Tool Button ───────────────────────────────

  const ToolButton = ({ t, label }: { t: Tool; label: string }) => (
    <button
      onClick={() => setTool(t)}
      title={label}
      className="flex items-center justify-center w-9 h-9 rounded-lg transition-all duration-200"
      style={{
        backgroundColor:
          tool === t
            ? isDark
              ? 'var(--accent)'
              : 'var(--accent)'
            : isDark
              ? 'var(--bg-elevated)'
              : 'var(--bg-elevated)',
        color: tool === t ? '#0a0a0a' : isDark ? 'var(--text-primary)' : 'var(--text-primary)',
        border: `1px solid ${tool === t ? 'var(--accent)' : 'var(--border-default)'}`,
      }}
    >
      <ToolIcon tool={t} size={16} />
    </button>
  );

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Toolbar */}
      <div
        className="flex items-center justify-between px-4 py-2 gap-3 shrink-0"
        style={{
          backgroundColor: 'var(--bg-surface)',
          borderBottom: '1px solid var(--border-subtle)',
        }}
      >
        {/* Left: Room info */}
        <div className="flex items-center gap-3">
          <button
            onClick={handleCopyCode}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg font-mono text-xs font-bold tracking-wider transition-all duration-200"
            style={{
              backgroundColor: 'var(--bg-elevated)',
              border: '1px solid var(--border-default)',
              color: 'var(--accent)',
            }}
            title="Copy room code"
          >
            <span style={{ color: 'var(--text-muted)' }}>ROOM</span>
            {roomId}
            <span className="text-[10px]">{copied ? '✓' : '📋'}</span>
          </button>
        </div>

        {/* Center: Tools */}
        <div className="flex items-center gap-1.5">
          <ToolButton t="pen" label="Pen" />
          <ToolButton t="eraser" label="Eraser" />
          <ToolButton t="rectangle" label="Rectangle" />
          <ToolButton t="line" label="Line" />
          <ToolButton t="text" label="Text" />

          {/* Separator */}
          <div className="w-px h-6 mx-1.5" style={{ backgroundColor: 'var(--border-default)' }} />

          {/* Color picker */}
          <div className="relative">
            <button
              onClick={() => setShowColorPicker(!showColorPicker)}
              className="w-9 h-9 rounded-lg flex items-center justify-center transition-all duration-200"
              style={{
                backgroundColor: 'var(--bg-elevated)',
                border: '1px solid var(--border-default)',
              }}
              title="Pick color"
            >
              <div
                className="w-5 h-5 rounded-full border-2"
                style={{
                  backgroundColor: color,
                  borderColor: isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)',
                }}
              />
            </button>

            <AnimatePresence>
              {showColorPicker && (
                <motion.div
                  initial={{ opacity: 0, y: -4, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -4, scale: 0.95 }}
                  transition={{ duration: 0.15 }}
                  className="absolute top-full mt-2 left-1/2 -translate-x-1/2 p-2 rounded-lg grid grid-cols-4 gap-1.5 z-50"
                  style={{
                    backgroundColor: 'var(--bg-elevated)',
                    border: '1px solid var(--border-default)',
                    boxShadow: '0 8px 30px rgba(0,0,0,0.3)',
                  }}
                >
                  {palette.map((c) => (
                    <button
                      key={c}
                      onClick={() => {
                        setColor(c);
                        setShowColorPicker(false);
                      }}
                      className="w-7 h-7 rounded-full transition-transform duration-150 hover:scale-110"
                      style={{
                        backgroundColor: c,
                        border: color === c ? '2px solid var(--accent)' : '2px solid transparent',
                        boxShadow: color === c ? '0 0 8px rgba(232, 255, 90, 0.4)' : 'none',
                      }}
                    />
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Stroke width */}
          <div className="flex items-center gap-2 ml-1">
            <input
              type="range"
              min={1}
              max={12}
              value={strokeWidth}
              onChange={(e) => setStrokeWidth(Number(e.target.value))}
              className="w-20 h-1 accent-[var(--accent)] cursor-pointer"
              title={`Stroke: ${strokeWidth}px`}
            />
            <span
              className="font-mono text-[10px] w-5 text-center"
              style={{ color: 'var(--text-muted)' }}
            >
              {strokeWidth}
            </span>
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={handleUndo}
            className="px-3 py-1.5 rounded-lg font-mono text-[10px] font-bold uppercase tracking-wider transition-all duration-200"
            style={{
              backgroundColor: 'var(--bg-elevated)',
              border: '1px solid var(--border-default)',
              color: 'var(--text-primary)',
            }}
            title="Undo (removes last stroke)"
          >
            ↩ Undo
          </button>
          <button
            onClick={handleClear}
            className="px-3 py-1.5 rounded-lg font-mono text-[10px] font-bold uppercase tracking-wider transition-all duration-200"
            style={{
              backgroundColor: 'rgba(255, 69, 69, 0.1)',
              border: '1px solid rgba(255, 69, 69, 0.3)',
              color: '#ff4545',
            }}
            title="Clear canvas"
          >
            ✕ Clear
          </button>
        </div>
      </div>

      {/* Canvas */}
      <div
        ref={containerRef}
        className="flex-1 relative cursor-crosshair"
        style={{
          backgroundColor: isDark ? '#0a0a0a' : '#f5f5f0',
        }}
      >
        <canvas
          ref={canvasRef}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={() => {
            if (isDrawing) {
              setIsDrawing(false);
              if (tool === 'pen' || tool === 'eraser') {
                actionsRef.current.push({
                  tool,
                  color,
                  strokeWidth,
                  points: [...currentPointsRef.current],
                });
                currentPointsRef.current = [];
              }
            }
          }}
          className="absolute inset-0"
        />

        {/* Text input overlay */}
        <AnimatePresence>
          {textPosition && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="absolute z-20"
              style={{
                left: textPosition.x,
                top: textPosition.y - 36,
              }}
            >
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleTextSubmit();
                }}
                className="flex items-center gap-2"
              >
                <input
                  autoFocus
                  type="text"
                  value={textInput}
                  onChange={(e) => setTextInput(e.target.value)}
                  placeholder="Type here..."
                  className="px-3 py-1.5 rounded-lg text-sm font-mono outline-none"
                  style={{
                    backgroundColor: 'var(--bg-elevated)',
                    border: '1px solid var(--accent)',
                    color: 'var(--text-primary)',
                    minWidth: '200px',
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Escape') {
                      setTextPosition(null);
                      setTextInput('');
                    }
                  }}
                />
                <button
                  type="submit"
                  className="px-3 py-1.5 rounded-lg font-mono text-xs font-bold"
                  style={{
                    backgroundColor: 'var(--accent)',
                    color: '#0a0a0a',
                  }}
                >
                  OK
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setTextPosition(null);
                    setTextInput('');
                  }}
                  className="px-2 py-1.5 rounded-lg font-mono text-xs"
                  style={{ color: 'var(--text-muted)' }}
                >
                  ✕
                </button>
              </form>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Grid dots pattern (subtle) */}
        <div
          className="absolute inset-0 pointer-events-none opacity-[0.03]"
          style={{
            backgroundImage: `radial-gradient(circle, ${isDark ? '#fff' : '#000'} 1px, transparent 1px)`,
            backgroundSize: '24px 24px',
          }}
        />
      </div>
    </div>
  );
}

// ── Lobby Component ──────────────────────────────

function WhiteboardLobby() {
  const router = useRouter();
  const theme = useEditorStore((s) => s.theme);
  const isDark = theme === 'dark';
  const [joinCode, setJoinCode] = useState('');
  const [error, setError] = useState('');

  const handleCreate = () => {
    const code = generateRoomCode();
    router.push(`/whiteboard?room=${code}`);
  };

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();
    const code = joinCode.trim().toUpperCase();
    if (code.length < 3) {
      setError('Room code must be at least 3 characters');
      return;
    }
    setError('');
    router.push(`/whiteboard?room=${code}`);
  };

  return (
    <div className="flex-1 flex items-center justify-center p-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="w-full max-w-md"
      >
        <div
          className="rounded-xl p-8"
          style={{
            backgroundColor: 'var(--bg-surface)',
            border: '1px solid var(--border-subtle)',
          }}
        >
          {/* Header */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-3 mb-4">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{
                  backgroundColor: 'rgba(232, 255, 90, 0.1)',
                  border: '1px solid rgba(232, 255, 90, 0.2)',
                }}
              >
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="var(--accent)"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
                </svg>
              </div>
            </div>
            <h2
              className="text-2xl font-bold tracking-tight"
              style={{ fontFamily: 'var(--font-syne), Syne, sans-serif' }}
            >
              Whiteboard
            </h2>
            <p
              className="mt-2 text-sm"
              style={{ color: 'var(--text-muted)', fontFamily: "'Space Mono', monospace" }}
            >
              Create or join a room to start drawing
            </p>
          </div>

          {/* Create Room */}
          <button
            onClick={handleCreate}
            className="w-full py-3.5 rounded-lg font-mono text-sm font-bold tracking-widest uppercase transition-all duration-200 mb-6"
            style={{
              backgroundColor: 'var(--accent)',
              color: '#0a0a0a',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.boxShadow = '0 0 25px rgba(232, 255, 90, 0.3)';
              e.currentTarget.style.transform = 'translateY(-1px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.boxShadow = 'none';
              e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
            ✦ Create New Room
          </button>

          {/* Divider */}
          <div className="flex items-center gap-4 mb-6">
            <div className="flex-1 h-px" style={{ backgroundColor: 'var(--border-default)' }} />
            <span
              className="text-xs tracking-widest"
              style={{ color: 'var(--text-muted)', fontFamily: "'Space Mono', monospace" }}
            >
              OR JOIN
            </span>
            <div className="flex-1 h-px" style={{ backgroundColor: 'var(--border-default)' }} />
          </div>

          {/* Join Room */}
          <form onSubmit={handleJoin} className="space-y-3">
            <input
              type="text"
              value={joinCode}
              onChange={(e) => {
                setJoinCode(e.target.value.toUpperCase());
                setError('');
              }}
              placeholder="ENTER ROOM CODE"
              maxLength={10}
              className="w-full px-4 py-3 rounded-lg text-center font-mono text-lg font-bold tracking-[0.3em] outline-none transition-all duration-200 uppercase"
              style={{
                backgroundColor: 'var(--bg-elevated)',
                border: `1px solid ${error ? '#ff4545' : 'var(--border-default)'}`,
                color: 'var(--text-primary)',
              }}
              onFocus={(e) => {
                if (!error) e.target.style.borderColor = 'var(--accent)';
              }}
              onBlur={(e) => {
                if (!error) e.target.style.borderColor = 'var(--border-default)';
              }}
            />
            {error && (
              <p
                className="text-xs text-center"
                style={{ color: '#ff4545', fontFamily: "'Space Mono', monospace" }}
              >
                {error}
              </p>
            )}
            <button
              type="submit"
              className="w-full py-3 rounded-lg font-mono text-sm font-bold tracking-widest uppercase transition-all duration-200"
              style={{
                backgroundColor: 'var(--bg-elevated)',
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
              Join Room →
            </button>
          </form>

          {/* Info */}
          <p
            className="mt-6 text-center text-[11px] leading-relaxed"
            style={{ color: 'var(--text-muted)', fontFamily: "'Space Mono', monospace" }}
          >
            Share the room code with others to collaborate on the same whiteboard.
          </p>
        </div>
      </motion.div>
    </div>
  );
}

// ── Inner Page Content (uses useSearchParams) ────

function WhiteboardContent() {
  const searchParams = useSearchParams();
  const roomId = searchParams.get('room');

  return (
    <div className="min-h-screen flex flex-col bg-bg-primary text-text-primary">
      <Topbar />
      {roomId ? <WhiteboardCanvas roomId={roomId} /> : <WhiteboardLobby />}
    </div>
  );
}

// ── Main Page ────────────────────────────────────

export default function WhiteboardPage() {
  return (
    <ProtectedRoute>
      <Suspense
        fallback={
          <div className="min-h-screen flex items-center justify-center bg-bg-primary">
            <div className="flex flex-col items-center gap-4">
              <div className="relative">
                <div className="w-10 h-10 rounded-full border-2 border-border-subtle" />
                <div className="absolute inset-0 w-10 h-10 rounded-full border-2 border-accent border-t-transparent animate-spin" />
              </div>
              <p className="text-text-muted font-mono text-sm tracking-wider">LOADING...</p>
            </div>
          </div>
        }
      >
        <WhiteboardContent />
      </Suspense>
    </ProtectedRoute>
  );
}
