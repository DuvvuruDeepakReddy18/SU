import { createZodDto } from 'nestjs-zod';
import { SubmissionCreateSchema, ProblemsQuerySchema } from '@skillverify/shared';

export class SubmissionCreateDto extends createZodDto(SubmissionCreateSchema) {}
export class ProblemsQueryDto extends createZodDto(ProblemsQuerySchema) {}
