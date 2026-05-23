import { createZodDto } from 'nestjs-zod';
import { UpdateProfileSchema } from '@skillverify/shared';

export class UpdateProfileDto extends createZodDto(UpdateProfileSchema) {}
