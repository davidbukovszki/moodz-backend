import { z } from 'zod';
import { DealType, CampaignStatus, ContentType, RecurringFrequency } from '@prisma/client';

export const createCampaignSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters').max(100),
  description: z.string().min(10, 'Description must be at least 10 characters').max(1000),
  coverImage: z.string().url().optional(),
  category: z.string().min(1, 'Category is required'),
  dealType: z.nativeEnum(DealType),
  offerDescription: z.string().min(5, 'Offer description is required').max(200),
  offerValue: z.number().min(0, 'Offer value must be positive'),
  discountAmount: z.string().optional(),
  couponCode: z.string().optional(),
  address: z.string().optional(),
  location: z.string().min(1, 'Location is required'),
  startDate: z.string().datetime(),
  endDate: z.string().datetime().optional(),
  spotsTotal: z.number().int().min(1, 'Must have at least 1 spot'),
  maxApplications: z.number().int().optional(),
  unlimitedApplications: z.boolean().optional(),
  minFollowers: z.number().int().optional(),
  minEngagementRate: z.number().optional(),
  targetFollowerRanges: z.array(z.string()).optional(),
  targetInfluencerFields: z.array(z.string()).optional(),
  requiredPlatforms: z.array(z.nativeEnum(ContentType)).min(1, 'At least one platform is required'),
  requiresPhoto: z.boolean().optional(),
  requiresVideo: z.boolean().optional(),
  enableAISelection: z.boolean().optional(),
  aiConditions: z.string().optional(),
  enableSchedule: z.boolean().optional(),
  scheduleLaunchDate: z.string().datetime().optional(),
  enableRecurring: z.boolean().optional(),
  recurringFrequency: z.nativeEnum(RecurringFrequency).optional(),
  tags: z.array(z.string()).optional(),
});

export const updateCampaignSchema = createCampaignSchema.partial().extend({
  status: z.nativeEnum(CampaignStatus).optional(),
});

export const campaignQuerySchema = z.object({
  status: z.nativeEnum(CampaignStatus).optional(),
  category: z.string().optional(),
  city: z.string().optional(),
  minValue: z.coerce.number().optional(),
  maxValue: z.coerce.number().optional(),
  search: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
  sortBy: z.enum(['newest', 'ending', 'value', 'popular']).default('newest'),
});

export type CreateCampaignInput = z.infer<typeof createCampaignSchema>;
export type UpdateCampaignInput = z.infer<typeof updateCampaignSchema>;
export type CampaignQueryInput = z.infer<typeof campaignQuerySchema>;

