import { Request, Response, NextFunction } from 'express';
import { prisma } from '../../lib/prisma.js';
import { sendError } from '../../utils/response.js';

export function validateApplication(checkOwnership = true) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const { applicationId } = req.params;

    if (!applicationId) {
      return sendError(res, 'Application ID is required', 400);
    }

    const application = await prisma.application.findUnique({
      where: { id: applicationId },
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
        creator: {
          select: {
            id: true,
            name: true,
            username: true,
            avatar: true,
            instagramFollowers: true,
            engagementRate: true,
          },
        },
      },
    });

    if (!application) {
      return sendError(res, 'Application not found', 404);
    }

    if (checkOwnership) {
      const { userId, userType } = res.locals;
      const isCreatorOwner = userType === 'creator' && application.creatorId === userId;
      const isVenueOwner = userType === 'venue' && application.campaign.venueId === userId;

      if (!isCreatorOwner && !isVenueOwner) {
        return sendError(res, 'You do not have access to this application', 403);
      }
    }

    res.locals.application = application;
    next();
  };
}

