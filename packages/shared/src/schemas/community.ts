import { z } from 'zod';

// Built-in sub-communities surfaced in the UI as chips. Free-form is also
// allowed at the DB level — these are recommendations, not a hard set.
export const DEFAULT_SUBREDDITS = [
  'general',
  'internships',
  'placements',
  'freelance',
  'academic',
  'rant',
  'ama',
  'showcase',
  'help',
] as const;
export type Subreddit = (typeof DEFAULT_SUBREDDITS)[number];

const SUBREDDIT_REGEX = /^[a-z0-9_-]{2,30}$/;

export const CommunityPostCreateSchema = z.object({
  title: z.string().max(200).optional().nullable(),
  body: z.string().min(1).max(5000),
  tags: z.array(z.string().max(40)).max(10).default([]),
  isAnonymous: z.boolean().default(false),
  visibility: z.enum(['public', 'college_only']).default('public'),
  subreddit: z
    .string()
    .toLowerCase()
    .regex(SUBREDDIT_REGEX, 'Subreddit must be lowercase letters, digits, _ or - (2–30 chars).')
    .default('general'),
});
export type CommunityPostCreateInput = z.infer<typeof CommunityPostCreateSchema>;

export const CommunityVoteSchema = z.object({
  value: z.union([z.literal(-1), z.literal(1)]),
});

export const CommunityCommentCreateSchema = z.object({
  body: z.string().min(1).max(2000),
  isAnonymous: z.boolean().default(false),
  parentCommentId: z.string().optional().nullable(),
});
export type CommunityCommentCreateInput = z.infer<typeof CommunityCommentCreateSchema>;

export const COMMUNITY_SORT_VALUES = ['hot', 'new', 'top'] as const;
export type CommunitySort = (typeof COMMUNITY_SORT_VALUES)[number];
