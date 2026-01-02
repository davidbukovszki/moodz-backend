import { Request, Response } from 'express';
import { prisma } from '../../lib/prisma.js';
import { sendSuccess, sendError, sendCreated } from '../../utils/response.js';
import {
  createConversationSchema,
  sendMessageSchema,
  conversationQuerySchema,
} from '../../validations/message/message.validation.js';
import { SenderType } from '@prisma/client';

export function getConversations() {
  return async (req: Request, res: Response) => {
    const { userId, userType } = res.locals;
    const queryResult = conversationQuerySchema.safeParse(req.query);

    if (!queryResult.success) {
      return sendError(res, queryResult.error.errors[0].message, 400);
    }

    const { page, limit } = queryResult.data;

    const where = userType === 'creator' 
      ? { creatorId: userId } 
      : { venueId: userId };

    const [conversations, total] = await Promise.all([
      prisma.conversation.findMany({
        where,
        orderBy: { lastMessageAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          creator: {
            select: { id: true, name: true, username: true, avatar: true },
          },
          venue: {
            select: { id: true, companyName: true, logo: true },
          },
          messages: {
            take: 1,
            orderBy: { createdAt: 'desc' },
            select: { content: true, createdAt: true, senderType: true },
          },
        },
      }),
      prisma.conversation.count({ where }),
    ]);

    return sendSuccess(res, {
      conversations,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  };
}

export function getConversation() {
  return async (req: Request, res: Response) => {
    const { conversation } = res.locals;
    const { userId, userType } = res.locals;

    const messages = await prisma.message.findMany({
      where: { conversationId: conversation.id },
      orderBy: { createdAt: 'asc' },
      take: 100,
    });

    const unreadField = userType === 'creator' ? 'creatorUnreadCount' : 'venueUnreadCount';
    await prisma.conversation.update({
      where: { id: conversation.id },
      data: { [unreadField]: 0 },
    });

    await prisma.message.updateMany({
      where: {
        conversationId: conversation.id,
        senderType: userType === 'creator' ? 'venue' : 'creator',
        isRead: false,
      },
      data: { isRead: true, readAt: new Date() },
    });

    return sendSuccess(res, { conversation, messages });
  };
}

export function startConversation() {
  return async (req: Request, res: Response) => {
    const { userId, userType } = res.locals;

    const result = createConversationSchema.safeParse(req.body);
    if (!result.success) {
      return sendError(res, result.error.errors[0].message, 400);
    }

    const { recipientId, recipientType, message, applicationId } = result.data;

    if (userType === recipientType) {
      return sendError(res, 'Cannot message same user type', 400);
    }

    const creatorId = userType === 'creator' ? userId : recipientId;
    const venueId = userType === 'venue' ? userId : recipientId;

    let conversation = await prisma.conversation.findFirst({
      where: { creatorId, venueId },
    });

    if (!conversation) {
      conversation = await prisma.conversation.create({
        data: {
          creatorId,
          venueId,
          applicationId,
          lastMessageAt: new Date(),
          creatorUnreadCount: userType === 'venue' ? 1 : 0,
          venueUnreadCount: userType === 'creator' ? 1 : 0,
        },
      });
    }

    const newMessage = await prisma.message.create({
      data: {
        conversationId: conversation.id,
        senderId: userId,
        senderType: userType as SenderType,
        content: message,
      },
    });

    const unreadField = userType === 'creator' ? 'venueUnreadCount' : 'creatorUnreadCount';
    await prisma.conversation.update({
      where: { id: conversation.id },
      data: {
        lastMessageAt: new Date(),
        [unreadField]: { increment: 1 },
      },
    });

    return sendCreated(res, { conversation, message: newMessage });
  };
}

export function sendMessage() {
  return async (req: Request, res: Response) => {
    const { conversation } = res.locals;
    const { userId, userType } = res.locals;

    const result = sendMessageSchema.safeParse(req.body);
    if (!result.success) {
      return sendError(res, result.error.errors[0].message, 400);
    }

    const message = await prisma.message.create({
      data: {
        conversationId: conversation.id,
        senderId: userId,
        senderType: userType as SenderType,
        content: result.data.content,
        attachmentUrl: result.data.attachmentUrl,
        attachmentType: result.data.attachmentType,
      },
    });

    const unreadField = userType === 'creator' ? 'venueUnreadCount' : 'creatorUnreadCount';
    await prisma.conversation.update({
      where: { id: conversation.id },
      data: {
        lastMessageAt: new Date(),
        [unreadField]: { increment: 1 },
      },
    });

    return sendCreated(res, { message });
  };
}

export function markAsRead() {
  return async (_req: Request, res: Response) => {
    const { conversation } = res.locals;
    const { userType } = res.locals;

    const unreadField = userType === 'creator' ? 'creatorUnreadCount' : 'venueUnreadCount';

    await prisma.conversation.update({
      where: { id: conversation.id },
      data: { [unreadField]: 0 },
    });

    await prisma.message.updateMany({
      where: {
        conversationId: conversation.id,
        senderType: userType === 'creator' ? 'venue' : 'creator',
        isRead: false,
      },
      data: { isRead: true, readAt: new Date() },
    });

    return sendSuccess(res, { success: true });
  };
}

