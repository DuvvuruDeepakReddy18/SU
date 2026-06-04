import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import { UpdateProfileSchema } from '@skillverify/shared';

export class UpdateProfileDto extends createZodDto(UpdateProfileSchema) {}

// Storage-free resume parsing: the user pastes raw resume text. Require a
// minimum length so we don't burn an AI call on a blank box, cap it so a
// giant paste can't blow up the prompt.
export const ResumeTextSchema = z.object({
  text: z.string().min(30, 'Paste at least a few lines from your resume.').max(20000),
});
export class ResumeTextDto extends createZodDto(ResumeTextSchema) {}
