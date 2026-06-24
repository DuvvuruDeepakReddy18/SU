import { z } from 'zod';

// Start an AI mock interview — for one of your skills, or a free-text topic.
export const StartAiScreenSchema = z
  .object({
    skillId: z.string().optional(),
    topic: z.string().trim().min(2).max(80).optional(),
  })
  .refine((d) => !!d.skillId || !!d.topic, { message: 'Pick a skill or enter a topic.' });
export type StartAiScreenInput = z.infer<typeof StartAiScreenSchema>;

export const AiScreenAnswerSchema = z.object({
  answer: z.string().trim().min(1).max(4000),
});
export type AiScreenAnswerInput = z.infer<typeof AiScreenAnswerSchema>;
