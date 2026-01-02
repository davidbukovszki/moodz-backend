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

    const [
      totalCampaigns,
      activeCampaigns,
      totalApplications,
      reach,
      pendingApplications,
      acceptedApplications,
      completedCollaborations,
      avgRating,
    ] = await Promise.all([
      prisma.campaign.count({ where: { venueId: userId } }),
      prisma.campaign.count({ where: { venueId: userId, status: 'active' } }),
      prisma.application.count({ where: { campaign: { venueId: userId } } }),
      prisma.campaign.aggregate({ where: { venueId: userId }, _sum: { totalReach: true } }),
      prisma.application.count({ where: { campaign: { venueId: userId }, status: 'pending' } }),
      prisma.application.count({ where: { campaign: { venueId: userId }, status: 'accepted' } }),
      prisma.application.count({ where: { campaign: { venueId: userId }, status: 'completed' } }),
      prisma.review.aggregate({ where: { revieweeId: userId, reviewerType: 'creator' }, _avg: { rating: true } }),
    ]);

    return sendSuccess(res, {
      totalCampaigns,
      activeCampaigns,
      totalApplications,
      pendingApplications,
      acceptedApplications,
      completedCollaborations,
      totalReach: reach._sum.totalReach || 0,
      avgRating: avgRating._avg.rating || 0,
    });
  };
}

export function getVenueActivity() {
  return async (req: Request, res: Response) => {
    const { userId } = res.locals;
    const limit = parseInt(req.query.limit as string) || 20;

    const activities = await prisma.activityLog.findMany({
      where: { venueId: userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    return sendSuccess(res, {
      activities: activities.map((a) => ({
        id: a.id,
        action: a.message,
        type: a.type,
        metadata: a.metadata,
        createdAt: a.createdAt,
      })),
    });
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
          creatorReviewer: {
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

    // Map creatorReviewer to reviewer for consistent API response
    const mappedReviews = reviews.map((review) => ({
      ...review,
      reviewer: review.creatorReviewer,
      creatorReviewer: undefined,
    }));

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
      reviews: mappedReviews,
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

export function getVenueAnalytics() {
  return async (req: Request, res: Response) => {
    const { userId } = res.locals;
    const timeRange = (req.query.timeRange as string) || '30d';
    const fromDate = req.query.from as string;
    const toDate = req.query.to as string;

    let startDate: Date;
    const endDate = new Date();

    if (timeRange === 'custom' && fromDate && toDate) {
      startDate = new Date(fromDate);
    } else {
      switch (timeRange) {
        case '1d':
          startDate = new Date(Date.now() - 24 * 60 * 60 * 1000);
          break;
        case '7d':
          startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
          break;
        case '30d':
        default:
          startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
          break;
      }
    }

    const campaigns = await prisma.campaign.findMany({
      where: { venueId: userId },
      select: { id: true, totalReach: true, totalApplicants: true, totalAccepted: true },
    });

    const campaignIds = campaigns.map((c) => c.id);

    const totalReach = campaigns.reduce((sum, c) => sum + (c.totalReach || 0), 0);
    const totalImpressions = Math.round(totalReach * 1.2);
    const totalEngagement = Math.round(totalReach * 0.05);
    const avgEngagementRate = totalReach > 0 ? (totalEngagement / totalReach) * 100 : 0;

    const applications = await prisma.application.findMany({
      where: {
        campaignId: { in: campaignIds },
        status: { in: ['completed', 'accepted'] },
        appliedAt: { gte: startDate, lte: endDate },
      },
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            username: true,
            avatar: true,
            instagramFollowers: true,
            tiktokFollowers: true,
            engagementRate: true,
          },
        },
      },
      orderBy: { appliedAt: 'desc' },
      take: 10,
    });

    const topCreators = applications.slice(0, 5).map((app) => ({
      id: app.creator.id,
      name: app.creator.name,
      username: app.creator.username,
      avatar: app.creator.avatar,
      followers: (app.creator.instagramFollowers || 0) + (app.creator.tiktokFollowers || 0),
      engagementRate: app.creator.engagementRate || 0,
    }));

    const platformBreakdown = [
      { name: 'Instagram Post', value: 45 },
      { name: 'Instagram Reel', value: 85 },
      { name: 'Instagram Story', value: 35 },
      { name: 'TikTok', value: 65 },
    ];

    const ageDistribution = [
      { age: '18-24', percentage: 35 },
      { age: '25-34', percentage: 42 },
      { age: '35-44', percentage: 15 },
      { age: '45+', percentage: 8 },
    ];

    const dayCount = Math.ceil((endDate.getTime() - startDate.getTime()) / (24 * 60 * 60 * 1000));
    const impressionsOverTime = Array.from({ length: Math.min(dayCount, 30) }, (_, i) => {
      const date = new Date(startDate);
      date.setDate(date.getDate() + i);
      return {
        date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        value: Math.floor(totalImpressions / dayCount * (0.5 + Math.random())),
      };
    });

    return sendSuccess(res, {
      stats: {
        totalImpressions,
        uniqueReach: totalReach,
        totalEngagements: totalEngagement,
        avgEngagementRate: parseFloat(avgEngagementRate.toFixed(1)),
      },
      impressionsOverTime,
      platformBreakdown,
      ageDistribution,
      topCreators,
    });
  };
}

