import { createZodDto } from 'nestjs-zod';
import {
  CommunityPostCreateSchema,
  CommunityVoteSchema,
  CommunityCommentCreateSchema,
} from '@skillverify/shared';

export class CommunityPostCreateDto extends createZodDto(CommunityPostCreateSchema) {}
export class CommunityVoteDto extends createZodDto(CommunityVoteSchema) {}
export class CommunityCommentCreateDto extends createZodDto(CommunityCommentCreateSchema) {}
