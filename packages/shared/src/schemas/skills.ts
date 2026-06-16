import { z } from 'zod';

export const ClaimSkillSchema = z.object({
  skillId: z.string().cuid(),
  selfRatedLevel: z.number().int().min(1).max(5),
});
export type ClaimSkillInput = z.infer<typeof ClaimSkillSchema>;

// Claim a skill not in the catalog — creates it (find-or-create by name) then
// claims it. Lets students add niche/custom skills the curated list misses.
export const ClaimCustomSkillSchema = z.object({
  name: z.string().min(2).max(60),
  selfRatedLevel: z.number().int().min(1).max(5),
});
export type ClaimCustomSkillInput = z.infer<typeof ClaimCustomSkillSchema>;

export const UpdateUserSkillSchema = z.object({
  selfRatedLevel: z.number().int().min(1).max(5),
});
export type UpdateUserSkillInput = z.infer<typeof UpdateUserSkillSchema>;

export const SkillsCatalogQuerySchema = z.object({
  q: z.string().max(100).optional(),
  category: z.string().max(100).optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(50),
});
