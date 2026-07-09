'use client';

import dynamic from 'next/dynamic';
import { useEffect, useState, useRef } from 'react';
import type { Socket } from 'socket.io-client';

// Excalidraw must be dynamically imported with ssr: false since it uses browser APIs
const Excalidraw = dynamic(
  () => import('@excalidraw/excalidraw').then((mod) => mod.Excalidraw),
  { ssr: false }
);

interface WhiteboardProps {
  socket: Socket | null;
  roomId: string;
}

export function Whiteboard({ socket, roomId }: WhiteboardProps) {
  const [excalidrawAPI, setExcalidrawAPI] = useState<any>(null);
  const [initialData, setInitialData] = useState<any>(null);
  const updateTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Track if a local change was made to prevent echo updates
  const isUpdatingLocally = useRef(false);

  useEffect(() => {
    if (!socket) return;

    const handleLoad = (data: any) => {
      // Only set initial data if we haven't loaded yet
      if (!initialData && data) {
        setInitialData(data);
      }
    };

    const handleUpdate = (data: any) => {
      if (excalidrawAPI && data && !isUpdatingLocally.current) {
        // Apply remote changes
        excalidrawAPI.updateScene(data);
      }
    };

    socket.on('whiteboard-load', handleLoad);
    socket.on('whiteboard-update', handleUpdate);

    return () => {
      socket.off('whiteboard-load', handleLoad);
      socket.off('whiteboard-update', handleUpdate);
    };
  }, [socket, excalidrawAPI, initialData]);

  const handleChange = (elements: any, appState: any) => {
    // We only care about elements for syncing
    if (!socket || !roomId) return;

    isUpdatingLocally.current = true;

    // Debounce the socket emission to prevent flooding
    if (updateTimeoutRef.current) {
      clearTimeout(updateTimeoutRef.current);
    }

    updateTimeoutRef.current = setTimeout(() => {
      const data = { elements };
      socket.emit('whiteboard-update', { roomId, data });
      isUpdatingLocally.current = false;
    }, 500);
  };

  return (
    <div className="w-full h-full relative" style={{ minHeight: '400px' }}>
      <Excalidraw
        excalidrawAPI={(api) => setExcalidrawAPI(api)}
        initialData={initialData}
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
          },
        }}
      />
    </div>
  );
}
