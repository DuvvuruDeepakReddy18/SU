import { Injectable, Logger } from '@nestjs/common';
import { z } from 'zod';
import type { RejectionReason } from '@skillverify/shared';
import { PrismaService } from '../../infra/prisma/prisma.service';
import { OpenRouterClient } from '../../infra/openrouter/openrouter.client';
import { EmailService } from '../../infra/email/email.service';
import { StorageService } from '../../infra/storage/storage.service';

const VISION_MODELS = [
  // Free vision models on OpenRouter, in fallback order. The list is brittle
  // (free quotas churn weekly) — set OPENROUTER_VISION_MODELS to override.
  process.env.OPENROUTER_VISION_MODEL_PRIMARY ?? 'google/gemini-2.0-flash-exp:free',
  process.env.OPENROUTER_VISION_MODEL_FALLBACK ?? 'meta-llama/llama-3.2-90b-vision-instruct:free',
  'qwen/qwen2.5-vl-72b-instruct:free',
];

const ExtractionSchema = z.object({
  extractedName: z.string().nullable().optional(),
  extractedInstitution: z.string().nullable().optional(),
  issueOrExpiryDate: z.string().nullable().optional(),
  hasOfficialStamp: z.boolean().nullable().optional(),
  isLikelyEdited: z.boolean().nullable().optional(),
  confidence: z.number().min(0).max(1).nullable().optional(),
});
@Injectable()
export class CollegeIdService {
  private readonly log = new Logger(CollegeIdService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly openrouter: OpenRouterClient,
    private readonly email: EmailService,
    private readonly storage: StorageService,
  ) {}

  /**
   * Fire-and-forget: called after signup. Downloads the uploaded ID, OCRs
   * via a vision model, then either auto-verifies (name+institute match,
   * high confidence, not edited) or flags for admin review.
   *
   * Errors are caught and logged — never rethrown — so a flaky AI provider
   * doesn't break signup. The row stays as `pending_review`.
   */
  async screen(userId: string): Promise<void> {
    try {
      const profile = await this.prisma.studentProfile.findUnique({
        where: { userId },
        include: { user: { include: { institution: true } } },
      });
      if (!profile?.collegeIdUrl) return;

      // Skip pre-screen if AI isn't configured.
      if (!process.env.OPENROUTER_API_KEY) {
        this.log.warn('OPENROUTER_API_KEY not set, skipping AI college-ID screen');
        return;
      }

      const imageDataUrl = await this.fetchAsDataUrl(profile.collegeIdUrl);

      const system =
        'You are a verification analyst. Extract structured data from a student college ID card. ' +
        'Return ONLY a JSON object. Do not add commentary.';
      const user = `Extract the following from this college ID image and return as JSON with this exact shape:
{
  "extractedName": string | null,            // The student's full name on the card
  "extractedInstitution": string | null,     // The institution / college name
  "issueOrExpiryDate": string | null,        // Any visible date (issued/valid till)
  "hasOfficialStamp": boolean | null,        // True if there is an official stamp or watermark
  "isLikelyEdited": boolean | null,          // True if the image shows obvious digital edits (mismatched fonts, blur over text, layer artifacts)
  "confidence": number                       // 0..1 — your confidence the extraction is accurate
}
If any field cannot be determined, use null. Be conservative with confidence.`;

      const raw = await this.openrouter.visionJson(VISION_MODELS, system, user, imageDataUrl);
      const parsed = ExtractionSchema.safeParse(raw);
      if (!parsed.success) {
        this.log.warn(
          `College ID OCR returned non-conforming JSON for user ${userId}: ${parsed.error.message}`,
        );
        await this.prisma.studentProfile.update({
          where: { userId },
          data: {
            collegeIdStatus: 'pending_review',
            collegeIdOcrExtracted: { error: 'parse_failure', raw: JSON.stringify(raw) },
          },
        });
        return;
      }

      const extraction = parsed.data;
      const claimedName = profile.governmentName ?? profile.fullName;
      const claimedInst = profile.user?.institution?.name ?? '';

      const nameMatch = fuzzyNameMatch(extraction.extractedName, claimedName);
      const instMatch = fuzzyInstMatch(extraction.extractedInstitution, claimedInst);
      const confidence = extraction.confidence ?? 0;
      const edited = extraction.isLikelyEdited === true;

      const autoVerify = nameMatch && instMatch && confidence >= 0.6 && !edited;

      await this.prisma.studentProfile.update({
        where: { userId },
        data: {
          collegeIdStatus: autoVerify ? 'verified' : 'pending_review',
          collegeIdVerifiedAt: autoVerify ? new Date() : null,
          collegeIdOcrExtracted: {
            ...extraction,
            claimedName,
            claimedInst,
            nameMatch,
            instMatch,
            autoVerify,
          },
        },
      });
      this.log.log(
        `College ID for user ${userId}: ${autoVerify ? 'auto-verified' : 'queued for review'} ` +
          `(name=${nameMatch}, inst=${instMatch}, conf=${confidence}, edited=${edited})`,
      );
    } catch (e) {
      // Never crash the caller; leave row in pending_review for admin to handle.
      this.log.error(`College ID screen failed for ${userId}: ${(e as Error).message}`);
    }
  }

  /**
   * Admin actions — manual override of the screen outcome. These intentionally
   * return the updated row so the caller (admin controller) can write the
   * audit trail with the new state.
   */
  async approve(profileUserId: string) {
    const before = await this.prisma.studentProfile.findUnique({
      where: { userId: profileUserId },
      select: { collegeIdStatus: true, collegeIdRejectionReasonCode: true },
    });
    const updated = await this.prisma.studentProfile.update({
      where: { userId: profileUserId },
      data: {
        collegeIdStatus: 'verified',
        collegeIdVerifiedAt: new Date(),
        collegeIdRejectionReason: null,
        collegeIdRejectionReasonCode: null,
      },
      include: { user: { select: { email: true } } },
    });
    void this.email.sendCollegeIdApproved(
      updated.user.email,
      updated.governmentName ?? updated.fullName,
    );
    return { before, updated };
  }

  async reject(profileUserId: string, reasonCode: string, reasonNote?: string | null) {
    const before = await this.prisma.studentProfile.findUnique({
      where: { userId: profileUserId },
      select: { collegeIdStatus: true, collegeIdRejectionReasonCode: true },
    });
    const updated = await this.prisma.studentProfile.update({
      where: { userId: profileUserId },
      data: {
        collegeIdStatus: 'rejected',
        collegeIdVerifiedAt: null,
        collegeIdRejectionReasonCode: reasonCode,
        collegeIdRejectionReason: reasonNote ?? null,
      },
      include: { user: { select: { email: true } } },
    });
    void this.email.sendCollegeIdRejected(
      updated.user.email,
      updated.governmentName ?? updated.fullName,
      reasonCode as RejectionReason,
      reasonNote ?? null,
    );
    return { before, updated };
  }

  async listPending(limit = 50) {
    const rows = await this.prisma.studentProfile.findMany({
      where: { collegeIdStatus: 'pending_review' },
      take: limit,
      orderBy: { collegeIdUploadedAt: 'desc' },
      include: { user: { select: { email: true, institution: { select: { name: true } } } } },
    });
    // Swap each permanent S3 URL for a 10-minute signed URL. Admins are
    // trusted but their browser tabs / network logs / screenshots are not —
    // and once a public URL leaks, the PII is on the open internet forever.
    return Promise.all(
      rows.map(async (r) => ({
        ...r,
        collegeIdUrl: await this.storage.signedDownloadFor(r.collegeIdUrl),
      })),
    );
  }

  private async fetchAsDataUrl(url: string): Promise<string> {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Failed to fetch ID image: ${res.status}`);
    const buf = Buffer.from(await res.arrayBuffer());
    const mime = res.headers.get('content-type') ?? 'image/jpeg';
    return `data:${mime};base64,${buf.toString('base64')}`;
  }
}

// Normalize and fuzzy-match. Tolerates middle-name reorder, missing accents,
// abbreviations like "Dr." or "Mr.".
function fuzzyNameMatch(extracted: string | null | undefined, claimed: string): boolean {
  if (!extracted || !claimed) return false;
  const norm = (s: string) =>
    s
      .toLowerCase()
      .replace(/\b(mr|mrs|ms|dr|prof|shri|smt)\.?\b/g, '')
      .replace(/[^a-z\s]/g, '')
      .trim()
      .split(/\s+/)
      .filter(Boolean);
  const a = new Set(norm(extracted));
  const b = norm(claimed);
  // All claimed name parts must appear in the extracted name.
  const hits = b.filter((p) => a.has(p)).length;
  return hits >= Math.max(2, Math.ceil(b.length * 0.75));
}

function fuzzyInstMatch(extracted: string | null | undefined, claimed: string): boolean {
  if (!extracted || !claimed) return false;
  const norm = (s: string) =>
    s
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .trim();
  const a = norm(extracted);
  const b = norm(claimed);
  if (a.includes(b) || b.includes(a)) return true;
  // Acronym match — e.g. "IIM Sambalpur" vs "Indian Institute of Management Sambalpur".
  const acronym = b
    .split(/\s+/)
    .filter((w) => w.length > 2)
    .map((w) => w[0])
    .join('');
  return acronym.length >= 3 && a.replace(/\s+/g, '').includes(acronym);
}
