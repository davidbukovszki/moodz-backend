import { Request, Response } from 'express';
import { prisma } from '../../lib/prisma.js';
import { sendSuccess, sendError } from '../../utils/response.js';
import { updateVenueSchema } from '../../validations/venue/venue.validation.js';

export function getVenueProfile() {
  return async (req: Request, res: Response) => {
    const { venueId } = req.params;

    const venue = await prisma.venue.findUnique({
      where: { id: venueId },
      select: {
        id: true,
        companyName: true,
        category: true,
        description: true,
        logo: true,
        address: true,
        city: true,
        website: true,
        instagramHandle: true,
        facebookHandle: true,
        tiktokHandle: true,
        rating: true,
        totalCampaigns: true,
        responseTime: true,
        createdAt: true,
      },
    });

    if (!venue) {
      return sendError(res, 'Venue not found', 404);
    }

    const reviewStats = await prisma.review.aggregate({
      where: { revieweeId: venueId, reviewerType: 'creator' },
      _avg: { rating: true },
      _count: true,
    });

    return sendSuccess(res, {
      venue,
      stats: {
        averageRating: reviewStats._avg.rating,
        totalReviews: reviewStats._count,
      },
    });
  };
}

export function updateVenueProfile() {
  return async (req: Request, res: Response) => {
    const { userId } = res.locals;

    const result = updateVenueSchema.safeParse(req.body);
    if (!result.success) {
      return sendError(res, result.error.errors[0].message, 400);
    }

    const venue = await prisma.venue.update({
      where: { id: userId },
      data: result.data,
      select: {
        id: true,
        email: true,
        companyName: true,
        category: true,
        description: true,
        logo: true,
        address: true,
        city: true,
        phone: true,
        website: true,
        instagramHandle: true,
        facebookHandle: true,
        tiktokHandle: true,
        status: true,
        rating: true,
        totalCampaigns: true,
        credits: true,
      },
    });

    return sendSuccess(res, { venue });
  };
}

export function getVenueStats() {
  return async (_req: Request, res: Response) => {
    const { userId } = res.locals;

    const [campaigns, applications, reach] = await Promise.all([
      prisma.campaign.count({ where: { venueId: userId, status: 'active' } }),
      prisma.application.count({
        where: { campaign: { venueId: userId } },
      }),
      prisma.campaign.aggregate({
        where: { venueId: userId },
        _sum: { totalReach: true },
      }),
    ]);

    const acceptedCreators = await prisma.application.count({
      where: {
        campaign: { venueId: userId },
        status: { in: ['accepted', 'completed'] },
      },
    });

    return sendSuccess(res, {
      stats: {
        activeCampaigns: campaigns,
        totalApplications: applications,
        totalCreators: acceptedCreators,
        totalReach: reach._sum.totalReach || 0,
      },
    });
  };
}

export function getVenueActivity() {
  return async (_req: Request, res: Response) => {
    const { userId } = res.locals;

    const activities = await prisma.activityLog.findMany({
      where: { venueId: userId },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });

    return sendSuccess(res, { activities });
  };
}

export function getVenueReviews() {
  return async (req: Request, res: Response) => {
    const { userId } = res.locals;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;

    const [reviews, total] = await Promise.all([
      prisma.review.findMany({
        where: { revieweeId: userId, reviewerType: 'creator' },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          reviewer: {
            select: {
              id: true,
              name: true,
              username: true,
              avatar: true,
            },
          },
          application: {
            select: {
              id: true,
              campaign: {
                select: {
                  id: true,
                  title: true,
                },
              },
            },
          },
        },
      }),
      prisma.review.count({ where: { revieweeId: userId, reviewerType: 'creator' } }),
    ]);

    const ratingStats = await prisma.review.groupBy({
      by: ['rating'],
      where: { revieweeId: userId, reviewerType: 'creator' },
      _count: true,
    });

    const ratingDistribution = [5, 4, 3, 2, 1].map((stars) => ({
      stars,
      count: ratingStats.find((r) => r.rating === stars)?._count || 0,
    }));

    const avgRating = await prisma.review.aggregate({
      where: { revieweeId: userId, reviewerType: 'creator' },
      _avg: { rating: true },
    });

    return sendSuccess(res, {
      reviews,
      ratingDistribution,
      averageRating: avgRating._avg.rating || 0,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  };
}

