import { createZodDto } from 'nestjs-zod';
import {
  ClaimSkillSchema,
  ClaimCustomSkillSchema,
  UpdateUserSkillSchema,
  SkillsCatalogQuerySchema,
} from '@skillverify/shared';

export class ClaimSkillDto extends createZodDto(ClaimSkillSchema) {}
export class ClaimCustomSkillDto extends createZodDto(ClaimCustomSkillSchema) {}
export class UpdateUserSkillDto extends createZodDto(UpdateUserSkillSchema) {}
export class SkillsCatalogQueryDto extends createZodDto(SkillsCatalogQuerySchema) {}
