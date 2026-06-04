import { createZodDto } from 'nestjs-zod';
import {
  RosterQuerySchema,
  InstituteDriveSchema,
  InstituteCompetitionSchema,
} from '@skillverify/shared';

export class RosterQueryDto extends createZodDto(RosterQuerySchema) {}
export class InstituteDriveDto extends createZodDto(InstituteDriveSchema) {}
export class InstituteCompetitionDto extends createZodDto(InstituteCompetitionSchema) {}
