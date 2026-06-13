import { z } from 'zod';

// Course programs surfaced in the signup dropdown. Drives the number of
// semester tiles on the Verification Center (B.Tech = 8, MBA = 4, etc.).
export const COURSE_PROGRAMS = [
  'B.Tech',
  'B.E.',
  'M.Tech',
  'M.E.',
  'B.Sc',
  'M.Sc',
  'B.A.',
  'M.A.',
  'B.Com',
  'M.Com',
  'BBA',
  'MBA',
  'BCA',
  'MCA',
  'B.Arch',
  'M.Arch',
  'MBBS',
  'MD',
  'BDS',
  'B.Pharma',
  'M.Pharma',
  'LLB',
  'LLM',
  'PhD',
  'Other',
] as const;
export type CourseProgram = (typeof COURSE_PROGRAMS)[number];

export const SignupSchema = z.object({
  // Legal name as it appears on the college ID — used for verification matching.
  governmentName: z.string().min(2).max(120),
  // E.164 phone. Default region India; we hard-require +91 to keep the
  // surface simple in v1 and avoid international ambiguity.
  phoneNumber: z
    .string()
    .regex(/^\+91\d{10}$/, 'Mobile must be in the format +91XXXXXXXXXX (10 digits after +91)'),
  // Auth login email (can be Gmail, Outlook, etc.).
  email: z.string().email(),
  password: z.string().min(8).max(128),
  // The user's institution-issued email (e.g. someone@iitd.ac.in).
  instituteEmail: z.string().email(),
  // Resolved from the picker. Server validates it exists.
  institutionId: z.string().min(1),
  courseProgram: z.enum(COURSE_PROGRAMS),
  // S3 key returned by /auth/upload-college-id. Required — no signup without
  // an ID upload.
  collegeIdFileKey: z.string().min(1),
});
export type SignupInput = z.infer<typeof SignupSchema>;

// OAuth users are created without these details, then complete them in the
// onboarding gate. Same fields as signup minus email/password (their identity
// comes from the provider).
export const CompleteOnboardingSchema = SignupSchema.omit({ email: true, password: true });
export type CompleteOnboardingInput = z.infer<typeof CompleteOnboardingSchema>;

export const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});
export type LoginInput = z.infer<typeof LoginSchema>;

export const JwtPayloadSchema = z.object({
  sub: z.string(),
  email: z.string().email(),
  role: z.enum(['STUDENT', 'RECRUITER', 'INSTITUTION_ADMIN', 'INTERVIEWER', 'PLATFORM_ADMIN']),
  institutionId: z.string().nullable().optional(),
  iat: z.number().optional(),
  exp: z.number().optional(),
});
export type JwtPayload = z.infer<typeof JwtPayloadSchema>;
