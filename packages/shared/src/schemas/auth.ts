import { z } from 'zod';

// Course programs surfaced in the signup dropdown. Drives the number of
// semester tiles on the Verification Center (B.Tech = 8, MBA = 4, etc.).
export const COURSE_PROGRAMS = [
  // Engineering / Architecture / Design
  'B.Tech',
  'B.E.',
  'M.Tech',
  'M.E.',
  'B.Arch',
  'M.Arch',
  'B.Planning',
  'B.Des',
  'M.Des',
  'Integrated M.Tech',
  'Diploma (Engineering)',
  // Computer applications
  'BCA',
  'MCA',
  // Science
  'B.Sc',
  'M.Sc',
  'BS-MS (Integrated)',
  'B.Sc (Agriculture)',
  'B.Sc (Nursing)',
  // Commerce / Management
  'B.Com',
  'M.Com',
  'BBA',
  'MBA',
  'PGDM',
  'BMS',
  // Arts / Humanities / Education / Fine Arts
  'B.A.',
  'M.A.',
  'BFA',
  'B.Ed',
  'B.Voc',
  'B.Lib',
  // Law
  'B.A. LLB',
  'BBA LLB',
  'B.Com LLB',
  'LLB',
  'LLM',
  // Medical / Dental / Pharma / Allied health
  'MBBS',
  'MD',
  'MS (Medical)',
  'BDS',
  'MDS',
  'BAMS',
  'BHMS',
  'B.Pharma',
  'M.Pharma',
  'BPT',
  // Research
  'PhD',
  // Anything not listed — the signup form shows a free-text box for this.
  'Other',
] as const;
export type CourseProgram = (typeof COURSE_PROGRAMS)[number];

// Narrow the course list by the institution's category so the dropdown stays
// relevant — an IIT shouldn't offer MBBS, a medical college shouldn't offer
// B.Tech. Unknown / 'other' / null falls back to the full list.
export function coursesForCategory(category?: string | null): readonly CourseProgram[] {
  switch (category) {
    case 'engineering':
      return [
        'B.Tech',
        'B.E.',
        'M.Tech',
        'M.E.',
        'B.Arch',
        'M.Arch',
        'B.Planning',
        'B.Des',
        'M.Des',
        'Integrated M.Tech',
        'Diploma (Engineering)',
        'BCA',
        'MCA',
        'B.Sc',
        'M.Sc',
        'PhD',
        'Other',
      ];
    case 'management':
      return ['BBA', 'MBA', 'PGDM', 'BMS', 'B.Com', 'M.Com', 'BBA LLB', 'PhD', 'Other'];
    case 'law':
      return ['B.A. LLB', 'BBA LLB', 'B.Com LLB', 'LLB', 'LLM', 'B.A.', 'PhD', 'Other'];
    case 'science':
      return [
        'B.Sc',
        'M.Sc',
        'BS-MS (Integrated)',
        'B.Sc (Agriculture)',
        'B.Sc (Nursing)',
        'BCA',
        'MCA',
        'B.A.',
        'PhD',
        'Other',
      ];
    case 'commerce':
      return ['B.Com', 'M.Com', 'BBA', 'MBA', 'PGDM', 'BMS', 'B.A.', 'PhD', 'Other'];
    case 'arts':
      return ['B.A.', 'M.A.', 'BFA', 'B.Ed', 'B.Lib', 'B.Voc', 'B.Com', 'BBA', 'PhD', 'Other'];
    case 'medical':
      return [
        'MBBS',
        'MD',
        'MS (Medical)',
        'BDS',
        'MDS',
        'BAMS',
        'BHMS',
        'B.Pharma',
        'M.Pharma',
        'BPT',
        'B.Sc (Nursing)',
        'B.Sc',
        'PhD',
        'Other',
      ];
    default:
      return COURSE_PROGRAMS;
  }
}

// Default semester count for a course (semesters ≈ years × 2), used to lay out
// the marksheet-verification grid. Program length varies by institution, so the
// verification page treats this as a starting point students can extend.
export function semestersForCourse(courseProgram?: string | null): number {
  const map: Record<string, number> = {
    'B.Tech': 8,
    'B.E.': 8,
    'B.Arch': 10,
    'B.Planning': 8,
    'B.Des': 8,
    'M.Des': 4,
    'Integrated M.Tech': 10,
    'Diploma (Engineering)': 6,
    MBBS: 9,
    BDS: 8,
    BAMS: 10,
    BHMS: 10,
    BPT: 9,
    'B.A. LLB': 10,
    'BBA LLB': 10,
    'B.Com LLB': 10,
    LLB: 6,
    'B.Sc': 6,
    'BS-MS (Integrated)': 10,
    'B.Sc (Agriculture)': 8,
    'B.Sc (Nursing)': 8,
    'B.A.': 6,
    'B.Com': 6,
    BBA: 6,
    BCA: 6,
    BMS: 6,
    BFA: 8,
    'B.Ed': 4,
    'B.Voc': 6,
    'B.Lib': 2,
    'B.Pharma': 8,
    'M.Tech': 4,
    'M.E.': 4,
    MBA: 4,
    PGDM: 4,
    MCA: 4,
    'M.Sc': 4,
    'M.A.': 4,
    'M.Com': 4,
    'M.Arch': 4,
    'M.Pharma': 4,
    LLM: 4,
    MD: 6,
    'MS (Medical)': 6,
    MDS: 6,
    PhD: 6,
    Other: 8,
  };
  return map[courseProgram ?? ''] ?? 8;
}

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
  // Usually one of COURSE_PROGRAMS, but students can pick "Other" and type a
  // custom course, so this is free text. We reject the bare "Other" placeholder
  // — the form must send the actual typed course.
  courseProgram: z
    .string()
    .trim()
    .min(2, 'Please select or type your course')
    .max(100)
    .refine((v) => v.toLowerCase() !== 'other', 'Please type your specific course'),
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
