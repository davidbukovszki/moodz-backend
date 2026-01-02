import { z } from 'zod';

export const updateVenueSchema = z.object({
  companyName: z.string().min(2).optional(),
  description: z.string().max(1000).optional(),
  logo: z.string().url().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  phone: z.string().optional(),
  website: z.string().url().optional(),
  instagramHandle: z.string().optional(),
  facebookHandle: z.string().optional(),
  tiktokHandle: z.string().optional(),
});

export type UpdateVenueInput = z.infer<typeof updateVenueSchema>;

