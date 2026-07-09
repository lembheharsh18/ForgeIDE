'use client';

import { motion } from 'framer-motion';
import { useEffect, useState, useRef } from 'react';
import { io, Socket } from 'socket.io-client';

import { ProtectedRoute } from '../../components/layout/ProtectedRoute';
import { Topbar } from '../../components/layout/Topbar';
import { Whiteboard } from '../../components/community/Whiteboard';
import { VoiceRoom } from '../../components/community/VoiceRoom';
import api from '../../lib/axios';
import { useAuthStore } from '../../store/authStore';

interface Room {
  id: string;
  name: string;
  description: string | null;
}

interface Message {
  id: string;
  roomId: string;
  userId: string;
  content: string;
  deletedAt: string | null;
  createdAt: string;
  user: {
    username: string;
    avatarUrl: string | null;
    role: string;
  };
}

export default function CommunityPage() {
  const { user, accessToken } = useAuthStore();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [activeRoom, setActiveRoom] = useState<Room | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [input, setInput] = useState('');
  const [loadingRooms, setLoadingRooms] = useState(true);
  const [showVoice, setShowVoice] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Fetch Rooms
  useEffect(() => {
    api.get('/api/chat/rooms')
      .then(res => {
        setRooms(res.data.data);
        if (res.data.data.length > 0) {
          setActiveRoom(res.data.data[0]);
        }
      })
      .catch(console.error)
      .finally(() => setLoadingRooms(false));
  }, []);

  // Connect Socket & Join Room
  useEffect(() => {
    if (!accessToken || !activeRoom) return;

    const newSocket = io(
      process.env.NEXT_PUBLIC_SOCKET_URL || 'ws://localhost:4000',
      {
        namespace: '/chat',
        auth: { token: accessToken },
        transports: ['websocket'],
      }
    );

    setSocket(newSocket);

    newSocket.on('connect', () => {
      newSocket.emit('join-room', activeRoom.id);
    });

    newSocket.on('new-message', (msg: Message) => {
      setMessages(prev => [...prev, msg]);
    });

    newSocket.on('message-deleted', (msgId: string) => {
      setMessages(prev => prev.map(m => 
        m.id === msgId ? { ...m, deletedAt: new Date().toISOString() } : m
      ));
    });

    // Fetch message history for the active room
    api.get(`/api/chat/rooms/${activeRoom.id}/messages`)
      .then(res => {
        if (res.data.success) {
          setMessages(res.data.data);
        }
      })
      .catch(console.error);

    return () => {
      newSocket.emit('leave-room', activeRoom.id);
      newSocket.disconnect();
    };
  }, [accessToken, activeRoom?.id]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !socket || !activeRoom) return;

    socket.emit('send-message', { roomId: activeRoom.id, content: input });
    setInput('');
  };

  const handleDelete = (msgId: string) => {
    if (!socket || user?.role !== 'ADMIN') return;
    socket.emit('delete-message', msgId);
  };

  return (
    <ProtectedRoute>
      <main className="min-h-screen flex flex-col bg-bg-primary text-text-primary h-screen overflow-hidden">
        <Topbar />

        <div className="flex flex-1 overflow-hidden" style={{ height: 'calc(100vh - 48px)' }}>
          {/* Sidebar */}
          <div className="w-64 border-r border-border-subtle bg-bg-surface flex flex-col flex-shrink-0">
            <div className="p-4 border-b border-border-subtle">
              <h2 className="font-syne font-bold text-sm tracking-wider">ROOMS</h2>
            </div>
            <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-2">
              {loadingRooms ? (
                <div className="animate-pulse h-10 bg-bg-elevated rounded w-full" />
              ) : (
                rooms.map(room => (
                  <button
                    key={room.id}
                    onClick={() => setActiveRoom(room)}
                    className="flex flex-col text-left px-3 py-2 rounded transition-colors"
                    style={{
                      backgroundColor: activeRoom?.id === room.id ? 'var(--bg-hover)' : 'transparent',
                      border: `1px solid ${activeRoom?.id === room.id ? 'var(--border-default)' : 'transparent'}`,
                    }}
                  >
                    <span className="font-mono text-xs font-bold" style={{ color: activeRoom?.id === room.id ? 'var(--accent)' : 'var(--text-primary)' }}>
                      # {room.name}
                    </span>
                    {room.description && (
                      <span className="text-[10px] text-text-muted truncate mt-0.5 font-mono">
                        {room.description}
                      </span>
                    )}
                  </button>
                ))
              )}
            </div>
          </div>

          {/* Whiteboard Area */}
          <div className="flex-1 bg-[#121212] flex flex-col relative overflow-hidden">
             {activeRoom && socket ? (
               <Whiteboard socket={socket} roomId={activeRoom.id} />
             ) : (
               <div className="flex-1 flex items-center justify-center text-text-muted font-mono">
                 Select a room to join the whiteboard
               </div>
             )}
          </div>

          {/* Chat Area */}
          <div className="w-[400px] border-l border-border-subtle flex flex-col bg-bg-primary flex-shrink-0">
            {/* Chat Header */}
            <div className="h-14 border-b border-border-subtle bg-bg-surface flex items-center justify-between px-6 flex-shrink-0">
              <h2 className="font-syne font-bold text-lg tracking-wide flex items-center gap-2">
                <span className="text-text-muted">#</span>
                {activeRoom?.name || 'Loading...'}
              </h2>
              {activeRoom && (
                <button
                  onClick={() => setShowVoice(!showVoice)}
                  className="text-[10px] font-mono font-bold uppercase tracking-wider px-3 py-1.5 rounded transition-colors"
                  style={{
                    backgroundColor: showVoice ? 'var(--accent)' : 'var(--bg-elevated)',
                    color: showVoice ? '#0a0a0a' : 'var(--text-primary)',
                  }}
                >
                  {showVoice ? 'Leave Voice' : 'Join Voice'}
                </button>
              )}
            </div>

            {/* Voice Room */}
            {showVoice && activeRoom && (
              <div className="h-64 border-b border-border-subtle flex-shrink-0">
                <VoiceRoom roomId={activeRoom.id} />
              </div>
            )}

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-4">
              {messages.map((msg, idx) => {
                const isMe = msg.userId === user?.id;
                const showHeader = idx === 0 || messages[idx - 1].userId !== msg.userId;

                return (
                  <motion.div 
                    key={msg.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                  >
                    {showHeader && (
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-mono text-xs font-bold" style={{ color: isMe ? 'var(--accent)' : 'var(--text-primary)' }}>
                          {msg.user.username}
                        </span>
                        {msg.user.role === 'ADMIN' && (
                          <span className="text-[9px] px-1.5 py-0.5 rounded bg-red-500/10 text-red-500 font-mono">
                            ADMIN
                          </span>
                        )}
                        <span className="text-[10px] text-text-muted font-mono ml-1">
                          {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    )}
                    
                    <div className="relative group max-w-[70%]">
                      <div 
                        className="px-4 py-2 rounded-lg text-sm font-mono leading-relaxed break-words"
                        style={{
                          backgroundColor: msg.deletedAt ? 'var(--bg-elevated)' : (isMe ? 'rgba(232, 255, 90, 0.1)' : 'var(--bg-surface)'),
                          border: `1px solid ${msg.deletedAt ? 'var(--border-subtle)' : (isMe ? 'rgba(232, 255, 90, 0.2)' : 'var(--border-default)')}`,
                          color: msg.deletedAt ? 'var(--text-muted)' : 'var(--text-primary)',
                        }}
                      >
                        {msg.deletedAt ? <em className="italic text-xs text-text-muted">This message was deleted.</em> : msg.content}
                      </div>

                      {/* Admin Delete Button */}
                      {!msg.deletedAt && user?.role === 'ADMIN' && (
                        <button
                          onClick={() => handleDelete(msg.id)}
                          className="absolute top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-full hover:bg-bg-hover text-text-muted hover:text-red-500"
                          style={{ [isMe ? 'left' : 'right']: '-36px' }}
                          title="Delete message"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  </motion.div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Box */}
            <div className="p-4 bg-bg-surface border-t border-border-subtle flex-shrink-0">
              <form onSubmit={handleSend} className="flex items-center gap-3">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder={`Message #${activeRoom?.name || 'room'}...`}
                  className="flex-1 bg-bg-elevated border border-border-default rounded px-4 py-2.5 text-sm font-mono outline-none transition-colors"
                  onFocus={(e) => e.target.style.borderColor = 'var(--accent)'}
                  onBlur={(e) => e.target.style.borderColor = 'var(--border-default)'}
                />
                <button
                  type="submit"
                  disabled={!input.trim()}
                  className="px-6 py-2.5 rounded font-bold font-mono text-sm transition-all duration-200 disabled:opacity-50"
                  style={{
                    backgroundColor: 'var(--accent)',
                    color: '#0a0a0a',
                  }}
                >
                  SEND
                </button>
              </form>
            </div>
          </div>
        </div>
      </main>
    </ProtectedRoute>
  );
}
