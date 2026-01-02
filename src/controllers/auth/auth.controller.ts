import { Request, Response } from 'express';
import { prisma } from '../../lib/prisma.js';
import { hashPassword, comparePassword } from '../../utils/password.js';
import { generateTokens, verifyRefreshToken } from '../../utils/jwt.js';
import { sendSuccess, sendError, sendCreated } from '../../utils/response.js';
import {
  creatorRegisterSchema,
  venueRegisterSchema,
  loginSchema,
  refreshTokenSchema,
} from '../../validations/auth/auth.validation.js';

export function registerCreator() {
  return async (req: Request, res: Response) => {
    const result = creatorRegisterSchema.safeParse(req.body);
    
    if (!result.success) {
      return sendError(res, result.error.errors[0].message, 400);
    }

    const { email, password, ...data } = result.data;

    const existingCreator = await prisma.creator.findFirst({
      where: {
        OR: [{ email }, { username: data.username }],
      },
    });

    if (existingCreator) {
      return sendError(res, 'Email or username already exists', 409);
    }

    const hashedPassword = await hashPassword(password);

    const creator = await prisma.creator.create({
      data: {
        email,
        password: hashedPassword,
        ...data,
      },
      select: {
        id: true,
        email: true,
        name: true,
        username: true,
        city: true,
        status: true,
        createdAt: true,
      },
    });

    const tokens = generateTokens({ userId: creator.id, userType: 'creator' });

    return sendCreated(res, { creator, ...tokens });
  };
}

export function registerVenue() {
  return async (req: Request, res: Response) => {
    const result = venueRegisterSchema.safeParse(req.body);
    
    if (!result.success) {
      return sendError(res, result.error.errors[0].message, 400);
    }

    const { email, password, ...data } = result.data;

    const existingVenue = await prisma.venue.findUnique({
      where: { email },
    });

    if (existingVenue) {
      return sendError(res, 'Email already exists', 409);
    }

    const hashedPassword = await hashPassword(password);

    const venue = await prisma.venue.create({
      data: {
        email,
        password: hashedPassword,
        ...data,
      },
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
        status: true,
        credits: true,
        createdAt: true,
      },
    });

    const tokens = generateTokens({ userId: venue.id, userType: 'venue' });

    return sendCreated(res, { venue, ...tokens });
  };
}

export function loginCreator() {
  return async (req: Request, res: Response) => {
    const result = loginSchema.safeParse(req.body);
    
    if (!result.success) {
      return sendError(res, result.error.errors[0].message, 400);
    }

    const { email, password } = result.data;

    const creator = await prisma.creator.findUnique({
      where: { email },
    });

    if (!creator) {
      return sendError(res, 'Invalid email or password', 401);
    }

    const isValidPassword = await comparePassword(password, creator.password);

    if (!isValidPassword) {
      return sendError(res, 'Invalid email or password', 401);
    }

    const tokens = generateTokens({ userId: creator.id, userType: 'creator' });

    const { password: _, ...creatorWithoutPassword } = creator;

    return sendSuccess(res, { creator: creatorWithoutPassword, ...tokens });
  };
}

export function loginVenue() {
  return async (req: Request, res: Response) => {
    const result = loginSchema.safeParse(req.body);
    
    if (!result.success) {
      return sendError(res, result.error.errors[0].message, 400);
    }

    const { email, password } = result.data;

    const venue = await prisma.venue.findUnique({
      where: { email },
    });

    if (!venue) {
      return sendError(res, 'Invalid email or password', 401);
    }

    const isValidPassword = await comparePassword(password, venue.password);

    if (!isValidPassword) {
      return sendError(res, 'Invalid email or password', 401);
    }

    const tokens = generateTokens({ userId: venue.id, userType: 'venue' });

    const { password: _, ...venueWithoutPassword } = venue;

    return sendSuccess(res, { venue: venueWithoutPassword, ...tokens });
  };
}

export function refreshToken() {
  return async (req: Request, res: Response) => {
    const result = refreshTokenSchema.safeParse(req.body);
    
    if (!result.success) {
      return sendError(res, result.error.errors[0].message, 400);
    }

    try {
      const payload = verifyRefreshToken(result.data.refreshToken);
      const tokens = generateTokens(payload);
      return sendSuccess(res, tokens);
    } catch {
      return sendError(res, 'Invalid refresh token', 401);
    }
  };
}

export function getMe() {
  return async (_req: Request, res: Response) => {
    const { userId, userType } = res.locals;

    if (userType === 'creator') {
      const creator = await prisma.creator.findUnique({
        where: { id: userId },
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
          createdAt: true,
        },
      });

      if (!creator) {
        return sendError(res, 'Creator not found', 404);
      }

      return sendSuccess(res, { creator, userType: 'creator' });
    }

    const venue = await prisma.venue.findUnique({
      where: { id: userId },
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
        responseTime: true,
        credits: true,
        createdAt: true,
      },
    });

    if (!venue) {
      return sendError(res, 'Venue not found', 404);
    }

    return sendSuccess(res, { venue, userType: 'venue' });
  };
}

