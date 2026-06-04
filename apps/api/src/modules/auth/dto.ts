import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';
import {
  SignupSchema,
  LoginSchema,
  RecruiterSignupSchema,
  InstitutionAdminSignupSchema,
} from '@skillverify/shared';

export class SignupDto extends createZodDto(SignupSchema) {}
export class LoginDto extends createZodDto(LoginSchema) {}
export class RecruiterSignupDto extends createZodDto(RecruiterSignupSchema) {}
export class InstitutionAdminSignupDto extends createZodDto(InstitutionAdminSignupSchema) {}

export const OAuthSyncSchema = z.object({
  email: z.string().email(),
  fullName: z.string().min(1),
  provider: z.enum(['google', 'github']),
  providerUserId: z.string(),
  avatarUrl: z.string().url().nullable().optional(),
});
export class OAuthSyncDto extends createZodDto(OAuthSyncSchema) {}
