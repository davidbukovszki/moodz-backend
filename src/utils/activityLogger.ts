import { prisma } from '../lib/prisma.js';

interface LogActivityParams {
  venueId?: string;
  creatorId?: string;
  type: string;
  message: string;
  metadata?: object;
}

export async function logActivity(params: LogActivityParams): Promise<void> {
  try {
    await prisma.activityLog.create({
      data: {
        venueId: params.venueId,
        creatorId: params.creatorId,
        type: params.type,
        message: params.message,
        metadata: params.metadata || {},
      },
    });
  } catch (error) {
    console.error('Failed to log activity:', error);
  }
}

