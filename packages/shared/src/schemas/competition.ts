import { z } from 'zod';

export const AddRoundSchema = z.object({
  name: z.string().min(1).max(120),
  advanceCount: z.number().int().positive().optional(),
});
export type AddRoundInput = z.infer<typeof AddRoundSchema>;

export const RoundStatusSchema = z.object({
  status: z.enum(['upcoming', 'active', 'closed']),
});
export type RoundStatusInput = z.infer<typeof RoundStatusSchema>;

export const AddJudgeSchema = z.object({
  userId: z.string().min(1),
});
export type AddJudgeInput = z.infer<typeof AddJudgeSchema>;

export const ScoreEntrySchema = z.object({
  entryId: z.string().min(1),
  score: z.number().int().min(0).max(100),
  feedback: z.string().max(1000).optional(),
});
export type ScoreEntryInput = z.infer<typeof ScoreEntrySchema>;
