import { createZodDto } from 'nestjs-zod';
import { InviteInterviewerSchema, ScoreInterviewSchema } from '@skillverify/shared';

export class InviteInterviewerDto extends createZodDto(InviteInterviewerSchema) {}
export class ScoreInterviewDto extends createZodDto(ScoreInterviewSchema) {}
