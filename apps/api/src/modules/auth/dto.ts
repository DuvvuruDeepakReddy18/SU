import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';
import {
  SignupSchema,
  CompleteOnboardingSchema,
  LoginSchema,
  RecruiterSignupSchema,
  InstitutionAdminSignupSchema,
  ForgotPasswordSchema,
  ResetPasswordSchema,
  ChangePasswordSchema,
  VerifyEmailSchema,
} from '@skillverify/shared';

export class SignupDto extends createZodDto(SignupSchema) {}
export class CompleteOnboardingDto extends createZodDto(CompleteOnboardingSchema) {}
export class LoginDto extends createZodDto(LoginSchema) {}
export class RecruiterSignupDto extends createZodDto(RecruiterSignupSchema) {}
export class InstitutionAdminSignupDto extends createZodDto(InstitutionAdminSignupSchema) {}
export class ForgotPasswordDto extends createZodDto(ForgotPasswordSchema) {}
export class ResetPasswordDto extends createZodDto(ResetPasswordSchema) {}
export class ChangePasswordDto extends createZodDto(ChangePasswordSchema) {}
export class VerifyEmailDto extends createZodDto(VerifyEmailSchema) {}

export const OAuthSyncSchema = z.object({
  email: z.string().email(),
  fullName: z.string().min(1),
  provider: z.enum(['google', 'github']),
  providerUserId: z.string(),
  avatarUrl: z.string().url().nullable().optional(),
});
export class OAuthSyncDto extends createZodDto(OAuthSyncSchema) {}
