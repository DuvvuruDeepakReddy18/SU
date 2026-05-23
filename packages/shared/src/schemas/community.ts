import { z } from 'zod';

export const CommunityPostCreateSchema = z.object({
  body: z.string().min(1).max(5000),
  tags: z.array(z.string().max(40)).max(10).default([]),
  isAnonymous: z.boolean().default(false),
  visibility: z.enum(['public', 'college_only']).default('public'),
});
export type CommunityPostCreateInput = z.infer<typeof CommunityPostCreateSchema>;

export const CommunityVoteSchema = z.object({
  value: z.union([z.literal(-1), z.literal(1)]),
});
