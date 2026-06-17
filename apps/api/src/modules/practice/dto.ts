import { createZodDto } from 'nestjs-zod';
import {
  SubmissionCreateSchema,
  McqSubmissionSchema,
  ProblemsQuerySchema,
} from '@skillverify/shared';

export class SubmissionCreateDto extends createZodDto(SubmissionCreateSchema) {}
export class McqSubmissionDto extends createZodDto(McqSubmissionSchema) {}
export class ProblemsQueryDto extends createZodDto(ProblemsQuerySchema) {}
