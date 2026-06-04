import { z } from 'zod';

// Institution / TPO admin request-access signup. Creates a
// User(role INSTITUTION_ADMIN) + InstitutionAdminProfile(status 'pending').
// Vetted by a platform admin before the roster unlocks.
export const InstitutionAdminSignupSchema = z.object({
  fullName: z.string().min(2).max(120),
  institutionId: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(8).max(128),
  title: z.string().max(80).optional(),
});
export type InstitutionAdminSignupInput = z.infer<typeof InstitutionAdminSignupSchema>;

// Roster filters (TPO-facing). All optional; empty = whole student body.
export const ROSTER_MIN_LAYERS = ['L1_ACADEMIC', 'L2_CERTIFIED', 'L3_PROVEN', 'L4_EXPERT'] as const;

// Institute campus drive (reuses PlacementDrive, institute-scoped).
export const InstituteDriveSchema = z.object({
  company: z.string().min(1).max(160),
  role: z.string().min(1).max(160),
  description: z.string().max(8000).optional(),
  packageLpa: z.number().nonnegative().max(100000).optional(),
  minLevel: z.enum(['L0', 'L1_ACADEMIC', 'L2_CERTIFIED', 'L3_PROVEN', 'L4_EXPERT']).optional(),
  jobType: z.enum(['full_time', 'internship', 'contract', 'ppo']).optional(),
  skills: z.array(z.string().max(60)).max(40).optional(),
  location: z.string().max(160).optional(),
  closesAt: z.string().max(40).optional(),
});
export type InstituteDriveInput = z.infer<typeof InstituteDriveSchema>;

// Institute competition (reuses Competition, institute-scoped).
export const InstituteCompetitionSchema = z.object({
  title: z.string().min(1).max(160),
  category: z.string().min(1).max(60),
  description: z.string().min(1).max(8000),
  prizes: z.string().max(2000).optional(),
  startsAt: z.string().min(1).max(40),
  endsAt: z.string().min(1).max(40),
  bannerUrl: z.string().max(500).optional(),
});
export type InstituteCompetitionInput = z.infer<typeof InstituteCompetitionSchema>;

export const RosterQuerySchema = z.object({
  q: z.string().max(120).optional(),
  minLayer: z.enum(ROSTER_MIN_LAYERS).optional(),
  // "verified" | "pending" | "rejected" | "none" — by college-ID status.
  idStatus: z.enum(['verified', 'pending', 'rejected', 'none']).optional(),
  graduationYear: z.coerce.number().int().min(2000).max(2100).optional(),
  page: z.coerce.number().int().min(1).max(1000).default(1),
  pageSize: z.coerce.number().int().min(1).max(50).default(24),
});
export type RosterQueryInput = z.infer<typeof RosterQuerySchema>;
