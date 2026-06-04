import { z } from 'zod';

/**
 * Structured rejection reasons used by human reviewers in the admin queue.
 * Stored as `reasonCode` on VerificationAudit + on the rejected entity, so we
 * can analyze "why did 30% of marksheets get rejected this week?" without
 * NLP on free-text fields.
 *
 * The `reasonNote` field stays free-text for the optional human supplement.
 */
export const REJECTION_REASONS = [
  'BLURRY_IMAGE',
  'NAME_MISMATCH',
  'INSTITUTION_MISMATCH',
  'DATE_MISSING',
  'GRADE_MISSING',
  'NO_OFFICIAL_STAMP',
  'SUSPECTED_EDIT',
  'WRONG_DOCUMENT',
  'EXPIRED',
  'DUPLICATE_SUBMISSION',
  'OTHER',
] as const;
export type RejectionReason = (typeof REJECTION_REASONS)[number];

/** Human-readable labels for the admin UI dropdown. */
export const REJECTION_REASON_LABELS: Record<RejectionReason, string> = {
  BLURRY_IMAGE: 'Image too blurry to read',
  NAME_MISMATCH: "Name doesn't match profile",
  INSTITUTION_MISMATCH: "Institution doesn't match profile",
  DATE_MISSING: 'Exam / issue date not visible',
  GRADE_MISSING: 'SGPA / CGPA not clearly visible',
  NO_OFFICIAL_STAMP: 'Missing official stamp or watermark',
  SUSPECTED_EDIT: 'Document appears digitally edited',
  WRONG_DOCUMENT: 'Wrong document type uploaded',
  EXPIRED: 'Document is expired',
  DUPLICATE_SUBMISSION: 'Same document submitted by another account',
  OTHER: 'Other (see note)',
};

export const RejectActionSchema = z.object({
  reasonCode: z.enum(REJECTION_REASONS),
  reasonNote: z.string().max(500).optional().nullable(),
});
export type RejectActionInput = z.infer<typeof RejectActionSchema>;

/**
 * Target types for the VerificationAudit log. Reviewers / admins act on one
 * of these; the audit row stores `targetType` + `targetId` as a polymorphic
 * pointer.
 */
export const AUDIT_TARGET_TYPES = [
  'college_id',
  'academic_record',
  'institution',
  'community_post',
  'community_comment',
  'recruiter',
  'institution_admin',
] as const;
export type AuditTargetType = (typeof AUDIT_TARGET_TYPES)[number];

// Recruiter approval rejection — free-text reason (the structured
// REJECTION_REASONS enum is document-specific and doesn't fit recruiters).
export const RecruiterRejectSchema = z.object({
  reason: z.string().max(500).optional().nullable(),
});
export type RecruiterRejectInput = z.infer<typeof RecruiterRejectSchema>;

export const AUDIT_ACTIONS = ['approve', 'reject', 'edit', 'hide', 'unhide', 'delete'] as const;
export type AuditAction = (typeof AUDIT_ACTIONS)[number];
