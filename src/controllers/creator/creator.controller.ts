import { Request, Response } from 'express';
import { prisma } from '../../lib/prisma.js';
import { sendSuccess, sendError, sendCreated, sendNoContent } from '../../utils/response.js';
import { updateCreatorSchema } from '../../validations/creator/creator.validation.js';

export function getCreatorProfile() {
  return async (req: Request, res: Response) => {
    const { creatorId } = req.params;

    const creator = await prisma.creator.findUnique({
      where: { id: creatorId },
      select: {
        id: true,
        name: true,
        username: true,
        bio: true,
        avatar: true,
        city: true,
        instagramHandle: true,
        instagramFollowers: true,
        tiktokHandle: true,
        tiktokFollowers: true,
        engagementRate: true,
        createdAt: true,
        _count: {
          select: {
            applications: { where: { status: 'completed' } },
          },
        },
      },
    });

    if (!creator) {
      return sendError(res, 'Creator not found', 404);
    }

    const stats = await prisma.application.aggregate({
      where: { creatorId, status: 'completed' },
      _count: true,
    });

    const reviewStats = await prisma.review.aggregate({
      where: { revieweeId: creatorId, reviewerType: 'venue' },
      _avg: { rating: true },
      _count: true,
    });

    return sendSuccess(res, {
      creator,
      stats: {
        completedCampaigns: stats._count,
        averageRating: reviewStats._avg.rating,
        totalReviews: reviewStats._count,
      },
    });
  };
}

export function updateCreatorProfile() {
  return async (req: Request, res: Response) => {
    const { userId } = res.locals;

    const result = updateCreatorSchema.safeParse(req.body);
    if (!result.success) {
      return sendError(res, result.error.errors[0].message, 400);
    }

    const creator = await prisma.creator.update({
      where: { id: userId },
      data: result.data,
      select: {
        id: true,
        email: true,
        name: true,
        username: true,
        bio: true,
        avatar: true,
        city: true,
        instagramHandle: true,
        instagramFollowers: true,
        tiktokHandle: true,
        tiktokFollowers: true,
        engagementRate: true,
        status: true,
      },
    });

    return sendSuccess(res, { creator });
  };
}

export function getCreatorStats() {
  return async (_req: Request, res: Response) => {
    const { userId } = res.locals;

    const [applications, completedValue] = await Promise.all([
      prisma.application.groupBy({
        by: ['status'],
        where: { creatorId: userId },
        _count: true,
      }),
      prisma.application.findMany({
        where: { creatorId: userId, status: 'completed' },
        include: { campaign: { select: { offerValue: true } } },
      }),
    ]);

    const totalSaved = completedValue.reduce(
      (sum, app) => sum + Number(app.campaign.offerValue),
      0
    );

    const statusCounts = applications.reduce(
      (acc, item) => ({ ...acc, [item.status]: item._count }),
      {} as Record<string, number>
    );

    return sendSuccess(res, {
      stats: {
        pending: statusCounts.pending || 0,
        accepted: statusCounts.accepted || 0,
        completed: statusCounts.completed || 0,
        rejected: statusCounts.rejected || 0,
        totalValueSaved: totalSaved,
      },
    });
  };
}

export function getFavorites() {
  return async (req: Request, res: Response) => {
    const { userId } = res.locals;

    const favorites = await prisma.favorite.findMany({
      where: { creatorId: userId },
      orderBy: { createdAt: 'desc' },
      include: {
        campaign: {
          include: {
            venue: {
              select: { id: true, companyName: true, logo: true, rating: true },
            },
          },
        },
      },
    });

    return sendSuccess(res, { favorites });
  };
}

export function addFavorite() {
  return async (req: Request, res: Response) => {
    const { campaignId } = req.params;
    const { userId } = res.locals;

    const campaign = await prisma.campaign.findUnique({
      where: { id: campaignId },
    });

    if (!campaign) {
      return sendError(res, 'Campaign not found', 404);
    }

    const existing = await prisma.favorite.findUnique({
      where: { creatorId_campaignId: { creatorId: userId, campaignId } },
    });

    if (existing) {
      return sendError(res, 'Already in favorites', 409);
    }

    const favorite = await prisma.favorite.create({
      data: { creatorId: userId, campaignId },
    });

    return sendCreated(res, { favorite });
  };
}

export function removeFavorite() {
  return async (req: Request, res: Response) => {
    const { campaignId } = req.params;
    const { userId } = res.locals;

    await prisma.favorite.delete({
      where: { creatorId_campaignId: { creatorId: userId, campaignId } },
    }).catch(() => null);

    return sendNoContent(res);
  };
}

export function getCreatorReviews() {
  return async (req: Request, res: Response) => {
    const { userId } = res.locals;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    const [reviews, total] = await Promise.all([
      prisma.review.findMany({
        where: { revieweeId: userId, reviewerType: 'venue' },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          application: {
            include: {
              campaign: {
                select: { id: true, title: true, offerDescription: true },
              },
            },
          },
        },
      }),
      prisma.review.count({
        where: { revieweeId: userId, reviewerType: 'venue' },
      }),
    ]);

    return sendSuccess(res, {
      reviews,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  };
}

