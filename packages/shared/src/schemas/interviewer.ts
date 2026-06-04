import { z } from 'zod';

// Admin invites (provisions) an interviewer. No public signup — the admin's
// vetting IS the gate, so the account is created already-active.
export const InviteInterviewerSchema = z.object({
  email: z.string().email(),
  fullName: z.string().min(2).max(120),
  bio: z.string().max(2000).optional(),
  expertise: z.array(z.string().max(60)).max(30).optional(),
});
export type InviteInterviewerInput = z.infer<typeof InviteInterviewerSchema>;

// Interviewer scores an interview. Pass → award L4 on the booked skill;
// feedback-only → recorded, no promotion.
export const ScoreInterviewSchema = z.object({
  verdict: z.enum(['pass', 'feedback_only']),
  score: z.number().int().min(0).max(100).optional(),
  notes: z.string().max(4000).optional(),
});
export type ScoreInterviewInput = z.infer<typeof ScoreInterviewSchema>;
