import { Request, Response } from 'express';
import { prisma } from '../../lib/prisma.js';
import { sendSuccess, sendError, sendCreated, sendNoContent } from '../../utils/response.js';
import {
  createApplicationSchema,
  updateApplicationSchema,
  applicationQuerySchema,
} from '../../validations/application/application.validation.js';
import { Prisma } from '@prisma/client';

export function applyToCampaign() {
  return async (req: Request, res: Response) => {
    const { campaignId } = req.params;
    const { userId } = res.locals;

    const result = createApplicationSchema.safeParse(req.body);
    if (!result.success) {
      return sendError(res, result.error.errors[0].message, 400);
    }

    const campaign = await prisma.campaign.findUnique({
      where: { id: campaignId },
    });

    if (!campaign) {
      return sendError(res, 'Campaign not found', 404);
    }

    if (campaign.status !== 'active') {
      return sendError(res, 'Campaign is not accepting applications', 400);
    }

    if (campaign.spotsUsed >= campaign.spotsTotal) {
      return sendError(res, 'Campaign is full', 400);
    }

    const existingApplication = await prisma.application.findUnique({
      where: {
        campaignId_creatorId: {
          campaignId,
          creatorId: userId,
        },
      },
    });

    if (existingApplication) {
      return sendError(res, 'You have already applied to this campaign', 409);
    }

    const application = await prisma.application.create({
      data: {
        campaignId,
        creatorId: userId,
        creatorNote: result.data.creatorNote,
      },
      include: {
        campaign: {
          select: {
            id: true,
            title: true,
            offerDescription: true,
          },
        },
      },
    });

    await prisma.campaign.update({
      where: { id: campaignId },
      data: { totalApplicants: { increment: 1 } },
    });

    return sendCreated(res, { application });
  };
}

export function getApplication() {
  return async (_req: Request, res: Response) => {
    const { application } = res.locals;
    return sendSuccess(res, { application });
  };
}

export function getCreatorApplications() {
  return async (req: Request, res: Response) => {
    const { userId } = res.locals;
    const queryResult = applicationQuerySchema.safeParse(req.query);

    if (!queryResult.success) {
      return sendError(res, queryResult.error.errors[0].message, 400);
    }

    const { status, page, limit } = queryResult.data;

    const where: Prisma.ApplicationWhereInput = {
      creatorId: userId,
      ...(status && { status }),
    };

    const [applications, total] = await Promise.all([
      prisma.application.findMany({
        where,
        orderBy: { appliedAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          campaign: {
            include: {
              venue: {
                select: {
                  id: true,
                  companyName: true,
                  logo: true,
                },
              },
            },
          },
        },
      }),
      prisma.application.count({ where }),
    ]);

    return sendSuccess(res, {
      applications,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  };
}

export function getCampaignApplications() {
  return async (req: Request, res: Response) => {
    const { campaignId } = req.params;
    const { userId } = res.locals;

    const campaign = await prisma.campaign.findUnique({
      where: { id: campaignId },
    });

    if (!campaign || campaign.venueId !== userId) {
      return sendError(res, 'Campaign not found or access denied', 404);
    }

    const queryResult = applicationQuerySchema.safeParse(req.query);
    if (!queryResult.success) {
      return sendError(res, queryResult.error.errors[0].message, 400);
    }

    const { status, page, limit } = queryResult.data;

    const where: Prisma.ApplicationWhereInput = {
      campaignId,
      ...(status && { status }),
    };

    const [applications, total] = await Promise.all([
      prisma.application.findMany({
        where,
        orderBy: { appliedAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          creator: {
            select: {
              id: true,
              name: true,
              username: true,
              avatar: true,
              instagramHandle: true,
              instagramFollowers: true,
              tiktokFollowers: true,
              engagementRate: true,
            },
          },
        },
      }),
      prisma.application.count({ where }),
    ]);

    return sendSuccess(res, {
      applications,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  };
}

export function updateApplication() {
  return async (req: Request, res: Response) => {
    const result = updateApplicationSchema.safeParse(req.body);
    if (!result.success) {
      return sendError(res, result.error.errors[0].message, 400);
    }

    const { application: existingApp } = res.locals;
    const { status, venueNote, visitDate } = result.data;

    const updateData: Prisma.ApplicationUpdateInput = {
      status,
      venueNote,
      reviewedAt: new Date(),
      ...(visitDate && { visitDate: new Date(visitDate) }),
      ...(status === 'completed' && { completedAt: new Date() }),
    };

    const application = await prisma.application.update({
      where: { id: existingApp.id },
      data: updateData,
      include: {
        campaign: true,
        creator: {
          select: {
            id: true,
            name: true,
            username: true,
          },
        },
      },
    });

    if (status === 'accepted') {
      await prisma.campaign.update({
        where: { id: existingApp.campaignId },
        data: {
          totalAccepted: { increment: 1 },
          spotsUsed: { increment: 1 },
        },
      });
    }

    return sendSuccess(res, { application });
  };
}

export function cancelApplication() {
  return async (_req: Request, res: Response) => {
    const { application } = res.locals;

    if (application.status !== 'pending') {
      return sendError(res, 'Can only cancel pending applications', 400);
    }

    await prisma.application.update({
      where: { id: application.id },
      data: { status: 'cancelled' },
    });

    await prisma.campaign.update({
      where: { id: application.campaignId },
      data: { totalApplicants: { decrement: 1 } },
    });

    return sendNoContent(res);
  };
}

