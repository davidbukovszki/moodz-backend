import { z } from 'zod';

export const updateCreatorSchema = z.object({
  name: z.string().min(2).optional(),
  bio: z.string().max(500).optional(),
  avatar: z.string().url().optional(),
  city: z.string().optional(),
  instagramHandle: z.string().optional(),
  tiktokHandle: z.string().optional(),
  facebookHandle: z.string().optional(),
});

export type UpdateCreatorInput = z.infer<typeof updateCreatorSchema>;

