import { z } from 'zod';
import { SUPPORTED_LANGUAGES } from '../constants';

export const SubmissionCreateSchema = z.object({
  problemId: z.string().cuid(),
  language: z.enum(SUPPORTED_LANGUAGES),
  code: z.string().min(1).max(50_000),
});
export type SubmissionCreateInput = z.infer<typeof SubmissionCreateSchema>;

// MCQ / case-study answer: pick one option by index.
export const McqSubmissionSchema = z.object({
  problemId: z.string().cuid(),
  selectedOption: z.number().int().min(0).max(25),
});
export type McqSubmissionInput = z.infer<typeof McqSubmissionSchema>;

export const ProblemsQuerySchema = z.object({
  topic: z.string().optional(),
  difficulty: z.enum(['easy', 'medium', 'hard']).optional(),
  q: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(50).default(20),
});

// What we store in Submission.aiFeedback after Claude reviews a passing solution.
export const AiFeedbackSchema = z.object({
  correctness: z.string(),
  timeComplexity: z.string(),
  spaceComplexity: z.string(),
  style: z.string(),
  suggestions: z.array(z.string()).default([]),
  rating: z.number().int().min(1).max(10),
});
export type AiFeedback = z.infer<typeof AiFeedbackSchema>;
