import { Server, Socket } from 'socket.io';
import { prisma } from '../config/db';
import { verifyAccessToken } from '../utils/jwt';

interface ChatServerToClientEvents {
  'new-message': (msg: any) => void;
  'message-deleted': (msgId: string) => void;
  'user-joined': (username: string) => void;
  'user-left': (username: string) => void;
  'whiteboard-load': (data: any) => void;
  'whiteboard-update': (data: any) => void;
  error: (msg: string) => void;
}

interface ChatClientToServerEvents {
  'join-room': (roomId: string) => void;
  'leave-room': (roomId: string) => void;
  'send-message': (payload: { roomId: string; content: string }) => void;
  'delete-message': (msgId: string) => void; // admin only
  'whiteboard-update': (payload: { roomId: string; data: any }) => void;
}

export function initChatNamespace(io: Server) {
  const chatNs = io.of('/chat');

  chatNs.use((socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      if (!token) return next(new Error('Authentication error'));
      
      const payload = verifyAccessToken(token);
      socket.data.user = payload;
      next();
    } catch {
      next(new Error('Authentication error'));
    }
  });

  chatNs.on('connection', (socket: Socket<ChatClientToServerEvents, ChatServerToClientEvents>) => {
    const user = socket.data.user;

    socket.on('join-room', async (roomId) => {
      socket.join(roomId);
      socket.to(roomId).emit('user-joined', user.username);
      
      // Load whiteboard data for this room
      try {
        const room = await prisma.chatRoom.findUnique({
          where: { id: roomId },
          select: { whiteboardData: true }
        });
        if (room?.whiteboardData) {
          socket.emit('whiteboard-load', room.whiteboardData);
        }
      } catch (err) {
        console.error('[Chat] Error loading whiteboard:', err);
      }
    });

    socket.on('leave-room', (roomId) => {
      socket.leave(roomId);
      socket.to(roomId).emit('user-left', user.username);
    });

    socket.on('send-message', async ({ roomId, content }) => {
      try {
        if (!content || !content.trim()) return;

        const message = await prisma.chatMessage.create({
          data: {
            roomId,
            userId: user.id,
            content: content.trim(),
          },
          include: {
            user: { select: { username: true, avatarUrl: true, role: true } },
          },
        });

        chatNs.to(roomId).emit('new-message', message);
      } catch (err) {
        console.error('[Chat] Error sending message:', err);
        socket.emit('error', 'Failed to send message');
      }
    });

    socket.on('delete-message', async (msgId) => {
      try {
        if (user.role !== 'ADMIN') {
          socket.emit('error', 'Unauthorized');
          return;
        }

        const msg = await prisma.chatMessage.update({
          where: { id: msgId },
          data: { deletedAt: new Date() },
        });

        chatNs.to(msg.roomId).emit('message-deleted', msgId);
      } catch (err) {
        console.error('[Chat] Error deleting message:', err);
        socket.emit('error', 'Failed to delete message');
      }
    });

    socket.on('whiteboard-update', async ({ roomId, data }) => {
      // Broadcast to others in the room
      socket.to(roomId).emit('whiteboard-update', data);
      
      // Persist to DB (debouncing happens on client side, but we update the DB here)
      try {
        await prisma.chatRoom.update({
          where: { id: roomId },
          data: { whiteboardData: data },
        });
      } catch (err) {
        console.error('[Chat] Error saving whiteboard data:', err);
      }
    });

    socket.on('disconnecting', () => {
      for (const room of socket.rooms) {
        if (room !== socket.id) {
          socket.to(room).emit('user-left', user.username);
        }
      }
    });
  });
}
