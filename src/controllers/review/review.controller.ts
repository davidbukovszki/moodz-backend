import { Request, Response } from 'express';
import { prisma } from '../../lib/prisma.js';
import { sendSuccess, sendError, sendCreated } from '../../utils/response.js';
import { createReviewSchema, reviewQuerySchema } from '../../validations/review/review.validation.js';
import { Prisma, SenderType } from '@prisma/client';
import { createNotification } from '../notification/notification.controller.js';
import { logActivity } from '../../utils/activityLogger.js';

export function createReview() {
  return async (req: Request, res: Response) => {
    const { applicationId } = req.params;
    const { userId, userType } = res.locals;

    const result = createReviewSchema.safeParse(req.body);
    if (!result.success) {
      return sendError(res, result.error.errors[0].message, 400);
    }

    const application = await prisma.application.findUnique({
      where: { id: applicationId },
      include: { campaign: true },
    });

    if (!application) {
      return sendError(res, 'Application not found', 404);
    }

    if (application.status !== 'completed') {
      return sendError(res, 'Can only review completed applications', 400);
    }

    const isCreator = userType === 'creator' && application.creatorId === userId;
    const isVenue = userType === 'venue' && application.campaign.venueId === userId;

    if (!isCreator && !isVenue) {
      return sendError(res, 'You cannot review this application', 403);
    }

    const revieweeId = isCreator ? application.campaign.venueId : application.creatorId;

    const existingReview = await prisma.review.findFirst({
      where: {
        applicationId,
        reviewerId: userId,
      },
    });

    if (existingReview) {
      return sendError(res, 'You have already reviewed this application', 409);
    }

    const review = await prisma.review.create({
      data: {
        applicationId,
        reviewerId: userId,
        revieweeId,
        reviewerType: userType as SenderType,
        rating: result.data.rating,
        comment: result.data.comment,
      },
    });

    if (isCreator) {
      const venueReviews = await prisma.review.findMany({
        where: { revieweeId, reviewerType: 'creator' },
        select: { rating: true },
      });
      const avgRating = venueReviews.reduce((sum, r) => sum + r.rating, 0) / venueReviews.length;
      await prisma.venue.update({
        where: { id: revieweeId },
        data: { rating: avgRating },
      });
    }

    // Get reviewer info for notification
    const reviewerName = isCreator
      ? (await prisma.creator.findUnique({ where: { id: userId }, select: { name: true } }))?.name
      : (await prisma.venue.findUnique({ where: { id: userId }, select: { companyName: true } }))?.companyName;

    // Notify reviewee about new review
    await createNotification({
      userId: revieweeId,
      userType: isCreator ? 'venue' : 'creator',
      type: 'review_received',
      title: 'New Review',
      message: `${reviewerName || 'Someone'} left you a ${result.data.rating}-star review`,
      data: { reviewId: review.id, applicationId, rating: result.data.rating },
    });

    if (isCreator) {
      await logActivity({
        venueId: revieweeId,
        type: 'review_received',
        message: `Received a ${result.data.rating}-star review from @${(await prisma.creator.findUnique({ where: { id: userId }, select: { username: true } }))?.username || 'unknown'}`,
        metadata: { reviewId: review.id, rating: result.data.rating },
      });
    }

    return sendCreated(res, { review });
  };
}

export function getCreatorReviews() {
  return async (req: Request, res: Response) => {
    const { creatorId } = req.params;
    const queryResult = reviewQuerySchema.safeParse(req.query);

    if (!queryResult.success) {
      return sendError(res, queryResult.error.errors[0].message, 400);
    }

    const { rating, page, limit } = queryResult.data;

    const where: Prisma.ReviewWhereInput = {
      revieweeId: creatorId,
      reviewerType: 'venue',
      ...(rating && { rating }),
    };

    const [reviews, total] = await Promise.all([
      prisma.review.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
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
      prisma.review.count({ where }),
    ]);

    const stats = await prisma.review.aggregate({
      where: { revieweeId: creatorId, reviewerType: 'venue' },
      _avg: { rating: true },
      _count: true,
    });

    return sendSuccess(res, {
      reviews,
      stats: { averageRating: stats._avg.rating, totalReviews: stats._count },
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  };
}

export function getVenueReviews() {
  return async (req: Request, res: Response) => {
    const { venueId } = req.params;
    const queryResult = reviewQuerySchema.safeParse(req.query);

    if (!queryResult.success) {
      return sendError(res, queryResult.error.errors[0].message, 400);
    }

    const { rating, page, limit } = queryResult.data;

    const where: Prisma.ReviewWhereInput = {
      revieweeId: venueId,
      reviewerType: 'creator',
      ...(rating && { rating }),
    };

    const [reviews, total] = await Promise.all([
      prisma.review.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          application: {
            include: {
              creator: {
                select: { id: true, name: true, username: true, avatar: true },
              },
              campaign: {
                select: { id: true, title: true },
              },
            },
          },
        },
      }),
      prisma.review.count({ where }),
    ]);

    const stats = await prisma.review.aggregate({
      where: { revieweeId: venueId, reviewerType: 'creator' },
      _avg: { rating: true },
      _count: true,
    });

    return sendSuccess(res, {
      reviews,
      stats: { averageRating: stats._avg.rating, totalReviews: stats._count },
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  };
}

