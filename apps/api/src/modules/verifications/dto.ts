import { createZodDto } from 'nestjs-zod';
import {
  CertificationCreateSchema,
  AcademicRecordCreateSchema,
  ProjectLinkSkillsSchema,
  ProjectCreateSchema,
} from '@skillverify/shared';

export class CertificationCreateDto extends createZodDto(CertificationCreateSchema) {}
export class AcademicRecordCreateDto extends createZodDto(AcademicRecordCreateSchema) {}
export class ProjectLinkSkillsDto extends createZodDto(ProjectLinkSkillsSchema) {}
export class ProjectCreateDto extends createZodDto(ProjectCreateSchema) {}
