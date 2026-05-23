import { z } from 'zod';

export const CertificationCreateSchema = z.object({
  issuer: z.string().min(1).max(200),
  courseName: z.string().min(1).max(300),
  skillId: z.string().cuid().nullable().optional(),
  issuedAt: z.string().datetime().nullable().optional(),
  certificateUrl: z.string().url().nullable().optional(),
  verificationUrl: z.string().url().nullable().optional(),
});
export type CertificationCreateInput = z.infer<typeof CertificationCreateSchema>;

export const AcademicRecordCreateSchema = z.object({
  semester: z.number().int().min(1).max(12),
  cgpa: z.number().min(0).max(10),
  sgpa: z.number().min(0).max(10).nullable().optional(),
  docUrl: z.string().url().nullable().optional(),
  verifiedVia: z.enum(['digilocker', 'institution', 'manual']),
});
export type AcademicRecordCreateInput = z.infer<typeof AcademicRecordCreateSchema>;

export const ProjectLinkSkillsSchema = z.object({
  skillIds: z.array(z.string().cuid()).min(1).max(20),
});
export type ProjectLinkSkillsInput = z.infer<typeof ProjectLinkSkillsSchema>;

export const ProjectCreateSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(2000).nullable().optional(),
  repoUrl: z.string().url().nullable().optional(),
  liveUrl: z.string().url().nullable().optional(),
  techStack: z.array(z.string()).default([]),
  linkedSkills: z.array(z.string().cuid()).default([]),
});
export type ProjectCreateInput = z.infer<typeof ProjectCreateSchema>;
