import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const PlacementDriveCreateSchema = z.object({
  company: z.string().min(1).max(160),
  role: z.string().min(1).max(160),
  description: z.string().max(8000).optional(),
  packageLpa: z.number().nonnegative().max(100000).optional(),
  minLevel: z.string().max(40).optional(),
  jobType: z.string().max(40).optional(),
  skills: z.array(z.string().max(60)).max(40).optional(),
  location: z.string().max(160).optional(),
  scope: z.enum(['institute_only', 'public']).optional(),
  // Loose date string — browser date inputs send YYYY-MM-DD.
  closesAt: z.string().max(40).optional(),
});
export class PlacementDriveCreateDto extends createZodDto(PlacementDriveCreateSchema) {}
