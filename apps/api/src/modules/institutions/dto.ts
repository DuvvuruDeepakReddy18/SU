import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';

export const SuggestInstitutionSchema = z.object({
  name: z.string().min(4).max(200),
  domain: z.string().min(3).max(120).optional(),
  category: z
    .enum(['engineering', 'management', 'law', 'science', 'commerce', 'arts', 'medical', 'other'])
    .optional(),
  state: z.string().max(60).optional(),
  city: z.string().max(60).optional(),
});

export class SuggestInstitutionDto extends createZodDto(SuggestInstitutionSchema) {}
