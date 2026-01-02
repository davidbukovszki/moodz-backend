import { z } from 'zod';

export const createConversationSchema = z.object({
  applicationId: z.string().uuid().optional(),
  recipientId: z.string().uuid(),
  recipientType: z.enum(['creator', 'venue']),
  message: z.string().min(1).max(2000),
});

export const sendMessageSchema = z.object({
  content: z.string().min(1).max(2000),
  attachmentUrl: z.string().url().optional(),
  attachmentType: z.enum(['image', 'file']).optional(),
});

export const conversationQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});

export type CreateConversationInput = z.infer<typeof createConversationSchema>;
export type SendMessageInput = z.infer<typeof sendMessageSchema>;
export type ConversationQueryInput = z.infer<typeof conversationQuerySchema>;

