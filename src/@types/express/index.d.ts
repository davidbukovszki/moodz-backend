import type { Creator, Venue, Campaign, Application, Review, Conversation } from '@prisma/client';

declare global {
  namespace Express {
    interface Locals {
      userId?: string;
      userType?: 'creator' | 'venue';
      creator?: Creator;
      venue?: Venue;
      campaign?: Campaign;
      application?: Application;
      review?: Review;
      conversation?: Conversation;
    }
  }
}

export {};

