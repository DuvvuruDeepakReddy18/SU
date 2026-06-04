import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import {
  CandidateSearchSchema,
  RecruiterInquirySchema,
  RecruiterJobSchema,
} from '@skillverify/shared';

export class CandidateSearchDto extends createZodDto(CandidateSearchSchema) {}
export class RecruiterInquiryDto extends createZodDto(RecruiterInquirySchema) {}
export class RecruiterJobDto extends createZodDto(RecruiterJobSchema) {}

export const SaveCandidateSchema = z.object({
  note: z.string().max(1000).optional(),
});
export class SaveCandidateDto extends createZodDto(SaveCandidateSchema) {}

export const PIPELINE_STAGES = [
  'applied',
  'shortlisted',
  'interviewing',
  'offered',
  'hired',
  'rejected',
] as const;
export const MoveStageSchema = z.object({ stage: z.enum(PIPELINE_STAGES) });
export class MoveStageDto extends createZodDto(MoveStageSchema) {}

export const RespondInquirySchema = z.object({ accept: z.boolean() });
export class RespondInquiryDto extends createZodDto(RespondInquirySchema) {}
