'use client';

import {
  LiveKitRoom,
  RoomAudioRenderer,
  ControlBar,
  ParticipantTile,
  useTracks,
  GridLayout,
  useConnectionState,
} from '@livekit/components-react';
import '@livekit/components-styles';
import { Track, ConnectionState } from 'livekit-client';
import React, { useEffect, useState } from 'react';

import api from '../../lib/axios';

// Simple error boundary to prevent full page crash if LiveKit fails
class LiveKitErrorBoundary extends React.Component<
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
          <p className="text-red-400 font-mono text-sm">Failed to connect to Voice Room.</p>
        </div>
      );
    }
    return this.props.children;
  }
}

interface VoiceRoomProps {
  roomId: string;
}

export function VoiceRoom({ roomId }: VoiceRoomProps) {
  const [token, setToken] = useState('');
  const [error, setError] = useState('');

  const serverUrl = process.env.NEXT_PUBLIC_LIVEKIT_URL;

  useEffect(() => {
    let mounted = true;

    if (!serverUrl) {
      // Don't even try to fetch token if no server URL is set
      return;
    }

    api
      .post('/api/chat/livekit-token', { roomId })
      .then((res) => {
        if (mounted && res.data.success) {
          setToken(res.data.token);
        }
      })
      .catch((err) => {
        if (mounted) {
          setError(err.response?.data?.message || 'Failed to get voice token');
        }
      });

    return () => {
      mounted = false;
    };
  }, [roomId, serverUrl]);

  if (!serverUrl) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-4 text-center">
        <div className="text-2xl mb-2">🎤</div>
        <p className="text-text-muted font-mono text-sm mb-2">Voice Chat Not Configured</p>
        <span className="text-[10px] text-text-muted opacity-60 font-mono px-4">
          LiveKit environment variables are missing.
        </span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-500/10 text-red-500 rounded text-sm font-mono text-center h-full flex flex-col items-center justify-center">
        <p>{error}</p>
        <span className="text-[10px] opacity-75 mt-2 block">
          Check server LiveKit configuration.
        </span>
      </div>
    );
  }

  if (!token) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-4">
        <div className="w-6 h-6 border-2 border-border-default border-t-accent rounded-full animate-spin mb-3"></div>
        <div className="text-[10px] font-mono text-text-muted animate-pulse">Connecting...</div>
      </div>
    );
  }

  return (
    <LiveKitErrorBoundary>
      <LiveKitRoom
        video={false}
        audio={true}
        token={token}
        serverUrl={serverUrl}
        data-lk-theme="default"
        style={{
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: 'var(--bg-primary)',
        }}
      >
        <ConnectionStatus />
        <div className="flex-1 overflow-y-auto p-4 custom-scrollbar relative">
          <ActiveParticipants />
        </div>
        <div className="border-t border-border-subtle p-2 bg-bg-surface flex justify-center">
          <ControlBar variation="minimal" controls={{ camera: false, screenShare: false }} />
        </div>
        <RoomAudioRenderer />
      </LiveKitRoom>
    </LiveKitErrorBoundary>
  );
}

function ConnectionStatus() {
  const state = useConnectionState();

  if (state === ConnectionState.Connected) return null;

  return (
    <div className="absolute top-2 left-1/2 -translate-x-1/2 z-10 px-3 py-1 rounded-full bg-bg-elevated border border-border-default shadow-lg">
      <span className="text-[10px] font-mono text-text-muted">
        {state === ConnectionState.Connecting
          ? 'Connecting...'
          : state === ConnectionState.Reconnecting
            ? 'Reconnecting...'
            : state === ConnectionState.Disconnected
              ? 'Disconnected'
              : state}
      </span>
    </div>
  );
}

function ActiveParticipants() {
  const tracks = useTracks([Track.Source.Microphone]);

  if (tracks.length === 0) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-[11px] font-mono text-text-muted italic">No one is speaking.</p>
      </div>
    );
  }

  return (
    <GridLayout tracks={tracks} style={{ height: '100%' }}>
      <ParticipantTile />
    </GridLayout>
  );
}
