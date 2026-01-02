import { Request, Response } from 'express';
import { prisma } from '../../lib/prisma.js';
import { sendSuccess, sendError, sendNoContent } from '../../utils/response.js';
import { NotificationType, SenderType } from '@prisma/client';

export function getNotifications() {
  return async (req: Request, res: Response) => {
    const { userId, userType } = res.locals;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const unreadOnly = req.query.unreadOnly === 'true';

    const where = {
      userId,
      userType: userType as SenderType,
      ...(unreadOnly && { read: false }),
    };

    const [notifications, total, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.notification.count({ where }),
      prisma.notification.count({
        where: { userId, userType: userType as SenderType, read: false },
      }),
    ]);

    return sendSuccess(res, {
      notifications,
      unreadCount,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  };
}

export function markAsRead() {
  return async (req: Request, res: Response) => {
    const { userId, userType } = res.locals;
    const { id } = req.params;

    const notification = await prisma.notification.findFirst({
      where: { id, userId, userType: userType as SenderType },
    });

    if (!notification) {
      return sendError(res, 'Notification not found', 404);
    }

    await prisma.notification.update({
      where: { id },
      data: { read: true },
    });

    return sendNoContent(res);
  };
}

export function markAllAsRead() {
  return async (req: Request, res: Response) => {
    const { userId, userType } = res.locals;

    await prisma.notification.updateMany({
      where: { userId, userType: userType as SenderType, read: false },
      data: { read: true },
    });

    return sendNoContent(res);
  };
}

// Helper function to create notifications - used by other controllers
export async function createNotification(data: {
  userId: string;
  userType: SenderType;
  type: NotificationType;
  title: string;
  message: string;
  data?: Record<string, unknown>;
}) {
  return prisma.notification.create({
    data: {
      userId: data.userId,
      userType: data.userType,
      type: data.type,
      title: data.title,
      message: data.message,
      data: data.data,
    },
  });
}

