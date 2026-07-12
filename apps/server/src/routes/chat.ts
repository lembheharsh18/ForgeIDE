import type { Request, Response } from 'express';
import { Router } from 'express';
import { AccessToken } from 'livekit-server-sdk';

import { prisma } from '../config/db';
import { requireAuth } from '../middleware/requireAuth';

const router = Router();

// GET /api/chat/rooms
// List all chat rooms
router.get('/rooms', requireAuth, async (req: Request, res: Response) => {
  try {
    let rooms = await prisma.chatRoom.findMany({
      orderBy: { createdAt: 'asc' },
    });

    if (rooms.length === 0) {
      const general = await prisma.chatRoom.create({
        data: { name: 'General', description: 'General community discussion' },
      });
      rooms = [general];
    }

    res.json({ success: true, data: rooms });
  } catch (error) {
    console.error('[Chat] Error fetching rooms:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch rooms' });
  }
});

// POST /api/chat/rooms
// Create a new chat room (any authenticated user)
router.post('/rooms', requireAuth, async (req: Request, res: Response) => {
  try {
    const { name, description } = req.body;
    if (!name || typeof name !== 'string') {
      res.status(400).json({ success: false, message: 'Invalid room name' });
      return;
    }

    const room = await prisma.chatRoom.create({
      data: { name: name.trim(), description },
    });
    res.status(201).json({ success: true, data: room });
  } catch (error: any) {
    console.error('[Chat] Error creating room:', error);
    if (error.code === 'P2002') {
      res.status(400).json({ success: false, message: 'Room name already exists' });
      return;
    }
    res.status(500).json({ success: false, message: 'Failed to create room' });
  }
});

// GET /api/chat/rooms/:roomId/messages
// Fetch recent message history (last 50 messages)
router.get('/rooms/:roomId/messages', requireAuth, async (req: Request, res: Response) => {
  try {
    const { roomId } = req.params;
    const messages = await prisma.chatMessage.findMany({
      where: { roomId },
      take: 50,
      orderBy: { createdAt: 'desc' }, // Latest first
      include: {
        user: { select: { username: true, avatarUrl: true } },
      },
    });

    // Return in chronological order
    res.json({ success: true, data: messages.reverse() });
  } catch (error) {
    console.error('[Chat] Error fetching messages:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch messages' });
  }
});

// DELETE /api/chat/messages/:msgId
// Soft-delete own message only
router.delete('/messages/:msgId', requireAuth, async (req: Request, res: Response) => {
  try {
    const { msgId } = req.params;

    // Only allow users to delete their own messages
    const message = await prisma.chatMessage.findUnique({ where: { id: msgId } });
    if (!message) {
      res.status(404).json({ success: false, message: 'Message not found' });
      return;
    }
    if (message.userId !== req.user!.userId) {
      res.status(403).json({ success: false, message: 'You can only delete your own messages' });
      return;
    }

    await prisma.chatMessage.update({
      where: { id: msgId },
      data: { deletedAt: new Date() },
    });
    res.json({ success: true, message: 'Message deleted' });
  } catch (error) {
    console.error('[Chat] Error deleting message:', error);
    res.status(500).json({ success: false, message: 'Failed to delete message' });
  }
});

// POST /api/chat/livekit-token
// Generate a LiveKit access token for voice calling
router.post('/livekit-token', requireAuth, async (req: Request, res: Response) => {
  try {
    const { roomId } = req.body;
    const user = (req as any).user;

    if (!roomId) {
      res.status(400).json({ success: false, message: 'roomId is required' });
      return;
    }

    // You need to set these in your .env
    const livekitApiKey = process.env.LIVEKIT_API_KEY;
    const livekitApiSecret = process.env.LIVEKIT_API_SECRET;

    if (!livekitApiKey || !livekitApiSecret) {
      res.status(500).json({ success: false, message: 'LiveKit credentials missing on server' });
      return;
    }

    const at = new AccessToken(livekitApiKey, livekitApiSecret, {
      identity: user.username,
      name: user.username,
    });

    // Set permissions
    at.addGrant({ roomJoin: true, room: roomId, canPublish: true, canSubscribe: true });

    const token = await at.toJwt();
    res.json({ success: true, token });
  } catch (error) {
    console.error('[Chat] Error generating livekit token:', error);
    res.status(500).json({ success: false, message: 'Failed to generate token' });
  }
});

export default router;
