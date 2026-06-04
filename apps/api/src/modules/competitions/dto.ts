import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const CompetitionCreateSchema = z.object({
  title: z.string().min(1).max(160),
  category: z.string().min(1).max(60),
  description: z.string().min(1).max(8000),
  prizes: z.string().max(2000).optional(),
  // Loose date strings — converted with new Date() in the service.
  startsAt: z.string().min(1).max(40),
  endsAt: z.string().min(1).max(40),
  bannerUrl: z.string().max(500).optional(),
});
export class CompetitionCreateDto extends createZodDto(CompetitionCreateSchema) {}

export const CompetitionEnterSchema = z.object({
  submissionUrl: z.string().max(500).optional(),
});
export class CompetitionEnterDto extends createZodDto(CompetitionEnterSchema) {}
