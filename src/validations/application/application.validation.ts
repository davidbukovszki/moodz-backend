import { z } from 'zod';
import { ApplicationStatus } from '@prisma/client';

export const createApplicationSchema = z.object({
  creatorNote: z.string().max(500).optional(),
});

export const updateApplicationSchema = z.object({
  status: z.nativeEnum(ApplicationStatus),
  venueNote: z.string().max(500).optional(),
  visitDate: z.string().datetime().optional(),
});

export const applicationQuerySchema = z.object({
  status: z.nativeEnum(ApplicationStatus).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});

export type CreateApplicationInput = z.infer<typeof createApplicationSchema>;
export type UpdateApplicationInput = z.infer<typeof updateApplicationSchema>;
export type ApplicationQueryInput = z.infer<typeof applicationQuerySchema>;

