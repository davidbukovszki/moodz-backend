import { Request, Response } from 'express';
import { prisma } from '../../lib/prisma.js';
import { sendSuccess, sendError, sendCreated, sendNoContent } from '../../utils/response.js';
import {
  createCampaignSchema,
  updateCampaignSchema,
  updateCampaignStatusSchema,
  campaignQuerySchema,
} from '../../validations/campaign/campaign.validation.js';
import { Prisma } from '@prisma/client';

export function getCampaigns() {
  return async (req: Request, res: Response) => {
    const queryResult = campaignQuerySchema.safeParse(req.query);

    if (!queryResult.success) {
      return sendError(res, queryResult.error.errors[0].message, 400);
    }

    const { status, category, city, minValue, maxValue, search, page, limit, sortBy } = queryResult.data;

    const where: Prisma.CampaignWhereInput = {
      ...(status && { status }),
      ...(category && { category }),
      ...(city && { location: { contains: city, mode: 'insensitive' } }),
      ...(minValue && { offerValue: { gte: minValue } }),
      ...(maxValue && { offerValue: { lte: maxValue } }),
      ...(search && {
        OR: [
          { title: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
          { offerDescription: { contains: search, mode: 'insensitive' } },
        ],
      }),
    };

    const orderBy: Prisma.CampaignOrderByWithRelationInput = (() => {
      switch (sortBy) {
        case 'ending':
          return { endDate: 'asc' };
        case 'value':
          return { offerValue: 'desc' };
        case 'popular':
          return { totalApplicants: 'desc' };
        default:
          return { createdAt: 'desc' };
      }
    })();

    const [campaigns, total] = await Promise.all([
      prisma.campaign.findMany({
        where,
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
        include: {
          venue: {
            select: {
              id: true,
              companyName: true,
              logo: true,
              rating: true,
            },
          },
        },
      }),
      prisma.campaign.count({ where }),
    ]);

    return sendSuccess(res, {
      campaigns,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  };
}

export function getCampaign() {
  return async (_req: Request, res: Response) => {
    const { campaign } = res.locals;
    return sendSuccess(res, { campaign });
  };
}

export function createCampaign() {
  return async (req: Request, res: Response) => {
    const result = createCampaignSchema.safeParse(req.body);

    if (!result.success) {
      return sendError(res, result.error.errors[0].message, 400);
    }

    const { userId } = res.locals;

    const campaign = await prisma.campaign.create({
      data: {
        ...result.data,
        venueId: userId,
        startDate: new Date(result.data.startDate),
        endDate: result.data.endDate ? new Date(result.data.endDate) : null,
        scheduleLaunchDate: result.data.scheduleLaunchDate 
          ? new Date(result.data.scheduleLaunchDate) 
          : null,
      },
      include: {
        venue: {
          select: {
            id: true,
            companyName: true,
            logo: true,
          },
        },
      },
    });

    await prisma.venue.update({
      where: { id: userId },
      data: { totalCampaigns: { increment: 1 } },
    });

    return sendCreated(res, { campaign });
  };
}

export function updateCampaign() {
  return async (req: Request, res: Response) => {
    const result = updateCampaignSchema.safeParse(req.body);

    if (!result.success) {
      return sendError(res, result.error.errors[0].message, 400);
    }

    const { campaign: existingCampaign } = res.locals;

    const updateData: Prisma.CampaignUpdateInput = {
      ...result.data,
      ...(result.data.startDate && { startDate: new Date(result.data.startDate) }),
      ...(result.data.endDate && { endDate: new Date(result.data.endDate) }),
      ...(result.data.scheduleLaunchDate && { 
        scheduleLaunchDate: new Date(result.data.scheduleLaunchDate) 
      }),
    };

    const campaign = await prisma.campaign.update({
      where: { id: existingCampaign.id },
      data: updateData,
      include: {
        venue: {
          select: {
            id: true,
            companyName: true,
            logo: true,
          },
        },
      },
    });

    return sendSuccess(res, { campaign });
  };
}

export function updateCampaignStatus() {
  return async (req: Request, res: Response) => {
    const result = updateCampaignStatusSchema.safeParse(req.body);

    if (!result.success) {
      return sendError(res, result.error.errors[0].message, 400);
    }

    const { campaign: existingCampaign } = res.locals;
    const { status } = result.data;

    const campaign = await prisma.campaign.update({
      where: { id: existingCampaign.id },
      data: { status },
      include: {
        venue: {
          select: {
            id: true,
            companyName: true,
            logo: true,
          },
        },
      },
    });

    return sendSuccess(res, { campaign });
  };
}

export function deleteCampaign() {
  return async (_req: Request, res: Response) => {
    const { campaign, userId } = res.locals;

    await prisma.campaign.delete({
      where: { id: campaign.id },
    });

    await prisma.venue.update({
      where: { id: userId },
      data: { totalCampaigns: { decrement: 1 } },
    });

    return sendNoContent(res);
  };
}

export function getVenueCampaigns() {
  return async (req: Request, res: Response) => {
    const { userId } = res.locals;
    const queryResult = campaignQuerySchema.safeParse(req.query);

    if (!queryResult.success) {
      return sendError(res, queryResult.error.errors[0].message, 400);
    }

    const { status, page, limit } = queryResult.data;

    const where: Prisma.CampaignWhereInput = {
      venueId: userId,
      ...(status && { status }),
    };

    const [campaigns, total] = await Promise.all([
      prisma.campaign.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.campaign.count({ where }),
    ]);

    return sendSuccess(res, {
      campaigns,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  };
}

