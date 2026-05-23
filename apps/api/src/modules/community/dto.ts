import { createZodDto } from 'nestjs-zod';
import { CommunityPostCreateSchema, CommunityVoteSchema } from '@skillverify/shared';

export class CommunityPostCreateDto extends createZodDto(CommunityPostCreateSchema) {}
export class CommunityVoteDto extends createZodDto(CommunityVoteSchema) {}
