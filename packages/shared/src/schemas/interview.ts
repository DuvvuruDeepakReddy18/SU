import { z } from 'zod';

// Booking an L4 expert interview. A skill is required — the whole point is to
// verify one specific skill to L4, and the interviewer can only award L4 when
// the booking names the skill.
export const BookInterviewSchema = z.object({
  skillId: z.string().min(1, 'Pick the skill you want verified.'),
  scheduledAt: z.string().datetime(),
  notes: z.string().max(500).optional(),
});
export type BookInterviewInput = z.infer<typeof BookInterviewSchema>;
