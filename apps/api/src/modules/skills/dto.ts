import { createZodDto } from 'nestjs-zod';
import {
  ClaimSkillSchema,
  UpdateUserSkillSchema,
  SkillsCatalogQuerySchema,
} from '@skillverify/shared';

export class ClaimSkillDto extends createZodDto(ClaimSkillSchema) {}
export class UpdateUserSkillDto extends createZodDto(UpdateUserSkillSchema) {}
export class SkillsCatalogQueryDto extends createZodDto(SkillsCatalogQuerySchema) {}
