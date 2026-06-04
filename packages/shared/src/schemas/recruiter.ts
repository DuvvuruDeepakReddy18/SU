import { z } from 'zod';

// Recruiter self-signup. Creates a User(role RECRUITER) + Employer +
// RecruiterProfile(status 'pending'). One recruiter per company in v1.
export const RecruiterSignupSchema = z.object({
  companyName: z.string().min(2).max(160),
  website: z.string().url().max(300).optional(),
  fullName: z.string().min(2).max(120),
  email: z.string().email(),
  password: z.string().min(8).max(128),
  title: z.string().max(80).optional(),
});
export type RecruiterSignupInput = z.infer<typeof RecruiterSignupSchema>;

// Candidate search filters (recruiter-facing). All optional; empty = browse all
// public, verified students.
export const CANDIDATE_MIN_LAYERS = [
  'L1_ACADEMIC',
  'L2_CERTIFIED',
  'L3_PROVEN',
  'L4_EXPERT',
] as const;

export const CandidateSearchSchema = z.object({
  q: z.string().max(120).optional(),
  skill: z.string().max(60).optional(),
  minLayer: z.enum(CANDIDATE_MIN_LAYERS).optional(),
  institutionId: z.string().max(40).optional(),
  graduationYear: z.coerce.number().int().min(2000).max(2100).optional(),
  location: z.string().max(120).optional(),
  page: z.coerce.number().int().min(1).max(1000).default(1),
  pageSize: z.coerce.number().int().min(1).max(50).default(20),
});
export type CandidateSearchInput = z.infer<typeof CandidateSearchSchema>;

// Recruiter → student contact request.
export const RecruiterInquirySchema = z.object({
  studentId: z.string().min(1),
  driveId: z.string().min(1).optional(),
  message: z.string().min(10, 'Add a short message (at least 10 characters).').max(2000),
});
export type RecruiterInquiryInput = z.infer<typeof RecruiterInquirySchema>;

// Recruiter job posting. `company` is taken from the recruiter's Employer, not
// the input. minLevel defaults to L3 (the apply floor).
export const JOB_MIN_LEVELS = [
  'L0',
  'L1_ACADEMIC',
  'L2_CERTIFIED',
  'L3_PROVEN',
  'L4_EXPERT',
] as const;
export const JOB_TYPES = ['full_time', 'internship', 'contract', 'ppo'] as const;

export const RecruiterJobSchema = z.object({
  role: z.string().min(1).max(160),
  description: z.string().max(8000).optional(),
  packageLpa: z.number().nonnegative().max(100000).optional(),
  minLevel: z.enum(JOB_MIN_LEVELS).optional(),
  jobType: z.enum(JOB_TYPES).optional(),
  skills: z.array(z.string().max(60)).max(40).optional(),
  location: z.string().max(160).optional(),
  closesAt: z.string().max(40).optional(),
});
export type RecruiterJobInput = z.infer<typeof RecruiterJobSchema>;
