'use client';

import dynamic from 'next/dynamic';
import React, { useEffect, useState, useRef, useCallback } from 'react';
import type { Socket } from 'socket.io-client';

// Simple error boundary to prevent full page crash if Excalidraw fails
class ExcalidrawErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="flex h-full w-full items-center justify-center p-4 text-center border border-red-500/20 bg-red-500/5 rounded">
          <p className="text-red-400 font-mono text-sm">Failed to load Whiteboard.</p>
        </div>
      );
    }
    return this.props.children;
  }
}

// Fix dynamic import format
const Excalidraw = dynamic(
  async () => {
    const mod = await import('@excalidraw/excalidraw');
    return { default: mod.Excalidraw };
  },
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full w-full items-center justify-center">
        <div className="w-6 h-6 border-2 border-border-default border-t-accent rounded-full animate-spin"></div>
      </div>
    ),
  },
);

interface WhiteboardProps {
  socket: Socket | null;
  roomId: string;
}

export function Whiteboard({ socket, roomId }: WhiteboardProps) {
  const [excalidrawAPI, setExcalidrawAPI] = useState<any>(null);
  const [initialData, setInitialData] = useState<any>(null);

  const updateTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Track if we are currently applying a remote update to prevent echo loops
  const isApplyingRemote = useRef(false);
  // Track last sent elements state string to detect real changes
  const lastSentStateRef = useRef<string>('');

  useEffect(() => {
    if (!socket) return;

    const handleLoad = (data: any) => {
      if (!initialData && data && Object.keys(data).length > 0) {
        setInitialData(data);
      }
    };

    const handleUpdate = (data: any) => {
      if (!excalidrawAPI || !data || !data.elements) return;

      // Set flag so we don't emit this back
      isApplyingRemote.current = true;

      try {
        excalidrawAPI.updateScene({
          elements: data.elements,
          commitToHistory: false, // Don't push remote changes to local undo stack
        });
      } catch (err) {
        console.error('Failed to apply whiteboard update:', err);
      } finally {
        // Reset flag after a small delay to allow excalidraw's onChange to fire
        setTimeout(() => {
          isApplyingRemote.current = false;
        }, 100);
      }
    };

    socket.on('whiteboard-load', handleLoad);
    socket.on('whiteboard-update', handleUpdate);

    return () => {
      socket.off('whiteboard-load', handleLoad);
      socket.off('whiteboard-update', handleUpdate);
    };
  }, [socket, excalidrawAPI, initialData]);

  const handleChange = useCallback(
    (elements: readonly any[], _appState: any) => {
      if (!socket || !roomId || isApplyingRemote.current) return;

      // Filter out deleted elements to reduce payload size and stringify for comparison
      const activeElements = elements.filter((el) => !el.isDeleted);
      const stateString = JSON.stringify(
        activeElements.map((el) => ({
          id: el.id,
          version: el.version,
          x: el.x,
          y: el.y,
          width: el.width,
          height: el.height,
        })),
      );

      // Only emit if something actually changed
      if (stateString === lastSentStateRef.current) return;

      lastSentStateRef.current = stateString;

      if (updateTimeoutRef.current) {
        clearTimeout(updateTimeoutRef.current);
      }

      // Debounce emission
      updateTimeoutRef.current = setTimeout(() => {
        socket.emit('whiteboard-update', {
          roomId,
          data: { elements },
        });
      }, 300);
    },
    [socket, roomId],
  );

  return (
    <div
      className="w-full h-full relative border border-border-subtle rounded-lg overflow-hidden bg-bg-surface"
      style={{ minHeight: '600px' }}
    >
      <ExcalidrawErrorBoundary>
        <Excalidraw
          excalidrawAPI={(api) => setExcalidrawAPI(api)}
          initialData={initialData || undefined}
          onChange={handleChange}
          theme="dark"
          UIOptions={{
            canvasActions: {
              changeViewBackgroundColor: false,
              clearCanvas: true,
              loadScene: false,
              saveToActiveFile: false,
              saveAsImage: true,
              export: false,
              toggleTheme: false,
            },
          }}
        />
      </ExcalidrawErrorBoundary>
    </div>
  );
}
