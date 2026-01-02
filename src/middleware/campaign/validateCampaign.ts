import { Request, Response, NextFunction } from 'express';
import { prisma } from '../../lib/prisma.js';
import { sendError } from '../../utils/response.js';

export function validateCampaign(checkOwnership = true) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const { campaignId } = req.params;

    if (!campaignId) {
      return sendError(res, 'Campaign ID is required', 400);
    }

    const campaign = await prisma.campaign.findUnique({
      where: { id: campaignId },
      include: {
        venue: {
          select: {
            id: true,
            companyName: true,
            logo: true,
            rating: true,
            totalCampaigns: true,
            responseTime: true,
          },
        },
      },
    });

    if (!campaign) {
      return sendError(res, 'Campaign not found', 404);
    }

    if (checkOwnership && res.locals.userType === 'venue') {
      if (campaign.venueId !== res.locals.userId) {
        return sendError(res, 'You do not own this campaign', 403);
      }
    }

    res.locals.campaign = campaign;
    next();
  };
}

