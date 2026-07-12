'use client';

import {
  LiveKitRoom,
  RoomAudioRenderer,
  ControlBar,
  ParticipantTile,
  useTracks,
  GridLayout,
} from '@livekit/components-react';
import '@livekit/components-styles';
import { Track } from 'livekit-client';
import { useEffect, useState } from 'react';

import api from '../../lib/axios';

interface VoiceRoomProps {
  roomId: string;
}

export function VoiceRoom({ roomId }: VoiceRoomProps) {
  const [token, setToken] = useState('');
  const [error, setError] = useState('');

  const serverUrl = process.env.NEXT_PUBLIC_LIVEKIT_URL;

  useEffect(() => {
    let mounted = true;

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
  }, [roomId]);

  if (error) {
    return (
      <div className="p-4 bg-red-500/10 text-red-500 rounded text-sm font-mono text-center">
        {error}
        <br />
        <span className="text-xs opacity-75 mt-1 block">
          (Make sure LIVEKIT_API_KEY is set on the server)
        </span>
      </div>
    );
  }

  if (!token) {
    return (
      <div className="flex items-center justify-center p-4">
        <div className="animate-pulse h-4 w-32 bg-bg-elevated rounded" />
      </div>
    );
  }

  return (
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
        backgroundColor: 'var(--bg-surface)',
      }}
    >
      <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
        <ActiveParticipants />
      </div>
      <div className="border-t border-border-subtle p-2">
        <ControlBar variation="minimal" controls={{ camera: false, screenShare: false }} />
      </div>
      <RoomAudioRenderer />
    </LiveKitRoom>
  );
}

function ActiveParticipants() {
  const tracks = useTracks([Track.Source.Microphone]);

  return (
    <GridLayout tracks={tracks} style={{ height: '100%' }}>
      <ParticipantTile />
    </GridLayout>
  );
}
