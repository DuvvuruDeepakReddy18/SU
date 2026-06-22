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

// Booking against a generated daily slot (the report's capacity model). The
// server reserves the slot atomically and randomly pairs the panel.
export const BookSlotSchema = z.object({
  skillId: z.string().min(1, 'Pick the skill you want verified.'),
  slotId: z.string().min(1),
  notes: z.string().max(500).optional(),
});
export type BookSlotInput = z.infer<typeof BookSlotSchema>;

// Admin/ops: generate daily slots per domain for the next N days.
export const GenerateSlotsSchema = z.object({
  days: z.coerce.number().int().min(1).max(30).default(7),
  capacity: z.coerce.number().int().min(1).max(100).default(5),
  panelSize: z.coerce.number().int().min(1).max(2).default(2),
});
export type GenerateSlotsInput = z.infer<typeof GenerateSlotsSchema>;
