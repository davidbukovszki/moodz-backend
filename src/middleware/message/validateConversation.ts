import { Request, Response, NextFunction } from 'express';
import { prisma } from '../../lib/prisma.js';
import { sendError } from '../../utils/response.js';

export function validateConversation() {
  return async (req: Request, res: Response, next: NextFunction) => {
    const { conversationId } = req.params;
    const { userId, userType } = res.locals;

    if (!conversationId) {
      return sendError(res, 'Conversation ID is required', 400);
    }

    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
      include: {
        creator: {
          select: { id: true, name: true, username: true, avatar: true },
        },
        venue: {
          select: { id: true, companyName: true, logo: true },
        },
        application: {
          select: { id: true, status: true },
        },
      },
    });

    if (!conversation) {
      return sendError(res, 'Conversation not found', 404);
    }

    const isParticipant =
      (userType === 'creator' && conversation.creatorId === userId) ||
      (userType === 'venue' && conversation.venueId === userId);

    if (!isParticipant) {
      return sendError(res, 'You are not part of this conversation', 403);
    }

    res.locals.conversation = conversation;
    next();
  };
}

