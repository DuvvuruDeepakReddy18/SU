import { createZodDto } from 'nestjs-zod';
import { StartAiScreenSchema, AiScreenAnswerSchema } from '@skillverify/shared';

export class StartAiScreenDto extends createZodDto(StartAiScreenSchema) {}
export class AiScreenAnswerDto extends createZodDto(AiScreenAnswerSchema) {}
