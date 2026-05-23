import { z } from 'zod';

export const ClaimSkillSchema = z.object({
  skillId: z.string().cuid(),
  selfRatedLevel: z.number().int().min(1).max(5),
});
export type ClaimSkillInput = z.infer<typeof ClaimSkillSchema>;

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
