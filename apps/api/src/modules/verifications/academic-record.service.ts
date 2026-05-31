import { BadRequestException, ConflictException, Injectable, Logger } from '@nestjs/common';
import { createHash } from 'node:crypto';
import { z } from 'zod';
import { PrismaService } from '../../infra/prisma/prisma.service';
import { OpenRouterClient } from '../../infra/openrouter/openrouter.client';
import { StorageService } from '../../infra/storage/storage.service';
import { LayerEngine } from './layer-engine';

const VISION_MODELS = [
  process.env.OPENROUTER_VISION_MODEL_PRIMARY ?? 'google/gemini-2.0-flash-exp:free',
  process.env.OPENROUTER_VISION_MODEL_FALLBACK ?? 'meta-llama/llama-3.2-90b-vision-instruct:free',
  'qwen/qwen2.5-vl-72b-instruct:free',
];

const OcrSchema = z.object({
  studentName: z.string().nullable().optional(),
  institutionName: z.string().nullable().optional(),
  semester: z.union([z.number(), z.string()]).nullable().optional(),
  sgpa: z.union([z.number(), z.string()]).nullable().optional(),
  cgpa: z.union([z.number(), z.string()]).nullable().optional(),
  examDate: z.string().nullable().optional(),
  hasOfficialStamp: z.boolean().nullable().optional(),
  isLikelyEdited: z.boolean().nullable().optional(),
  confidence: z.number().min(0).max(1).nullable().optional(),
});

export type SemesterUploadInput = {
  userId: string;
  semester: number;
  fileBuffer: Buffer;
  fileMime: string;
  fileName: string;
};

@Injectable()
export class AcademicRecordService {
  private readonly log = new Logger(AcademicRecordService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly openrouter: OpenRouterClient,
    private readonly storage: StorageService,
    private readonly engine: LayerEngine,
  ) {}

  /**
   * Upload + OCR a semester marksheet. Verifies the extracted
   * student-name + institution-name match the student's profile and
   * runs a few anti-tamper signals (duplicate hash, AI-flagged edits,
   * missing official stamp).
   */
  async uploadSemester(input: SemesterUploadInput) {
    // 1. Hash for dedup. Same file content for the same user (re-upload)
    //    is allowed; for different users it's almost certainly fraud.
    const sha256 = createHash('sha256').update(input.fileBuffer).digest('hex');
    const dupe = await this.prisma.academicRecord.findFirst({
      where: { fileSha256: sha256, NOT: { userId: input.userId } },
    });
    if (dupe) {
      throw new ConflictException(
        'This marksheet has already been uploaded by another account. ' +
          'If you believe this is a mistake, contact support.',
      );
    }

    // 2. Upload to storage.
    if (!this.storage.isConfigured()) {
      throw new BadRequestException(
        'File uploads aren’t configured on this server. Contact support.',
      );
    }
    const uploaded = await this.storage.upload(`users/${input.userId}/academic`, {
      buffer: input.fileBuffer,
      mimetype: input.fileMime,
      originalname: input.fileName,
    });

    // 3. Look up the user's profile to compare extracted vs claimed.
    const profile = await this.prisma.studentProfile.findUnique({
      where: { userId: input.userId },
      include: { user: { include: { institution: true } } },
    });
    if (!profile) throw new BadRequestException('Profile not found');

    // 4. OCR via vision model. If AI isn't configured, we create the record
    //    as `pending` so an admin can manually verify.
    let extracted: z.infer<typeof OcrSchema> = {};
    let aiSkipped = false;
    if (!process.env.OPENROUTER_API_KEY) {
      aiSkipped = true;
    } else {
      try {
        const dataUrl = this.bufferToDataUrl(input.fileBuffer, input.fileMime);
        const system =
          'You are a verification analyst. Extract structured data from a college semester marksheet image. ' +
          'Be conservative. Return ONLY a JSON object.';
        const user = `Extract fields and return JSON exactly:
{
  "studentName": string | null,
  "institutionName": string | null,
  "semester": number | string | null,
  "sgpa": number | string | null,
  "cgpa": number | string | null,
  "examDate": string | null,           // any visible exam date (issue/exam/result date)
  "hasOfficialStamp": boolean | null,  // true if an official seal/watermark is visible
  "isLikelyEdited": boolean | null,    // true if you see mismatched fonts, layer artifacts, blur over text
  "confidence": number                 // 0..1
}
If a field cannot be read, use null.`;
        const raw = await this.openrouter.visionJson(VISION_MODELS, system, user, dataUrl);
        const parsed = OcrSchema.safeParse(raw);
        if (parsed.success) {
          extracted = parsed.data;
        } else {
          this.log.warn(`Academic OCR shape mismatch: ${parsed.error.message}`);
        }
      } catch (e) {
        this.log.warn(`Academic OCR failed: ${(e as Error).message}`);
      }
    }

    // 5. Decide auto-verify vs pending_review.
    const claimedName = profile.governmentName ?? profile.fullName;
    const claimedInst = profile.user?.institution?.name ?? '';
    const nameMatch = fuzzyNameMatch(extracted.studentName ?? null, claimedName);
    const instMatch = fuzzyInstMatch(extracted.institutionName ?? null, claimedInst);
    const confidence = extracted.confidence ?? 0;
    const edited = extracted.isLikelyEdited === true;
    const hasStamp = extracted.hasOfficialStamp === true;

    const extractedCgpa = parseNum(extracted.cgpa);
    const extractedSgpa = parseNum(extracted.sgpa);
    if (extractedCgpa == null && extractedSgpa == null && !aiSkipped) {
      // OCR ran but couldn't read a grade — definitely needs human review.
    }

    const autoVerify =
      !aiSkipped &&
      nameMatch &&
      instMatch &&
      confidence >= 0.6 &&
      !edited &&
      hasStamp &&
      (extractedCgpa != null || extractedSgpa != null);

    // 6. Create the row.
    const record = await this.prisma.academicRecord.create({
      data: {
        userId: input.userId,
        semester: input.semester,
        // Prefer OCR-extracted grades when present; fall back to 0 (will be
        // overwritten on admin approval with the manually-entered value).
        cgpa: extractedCgpa ?? 0,
        sgpa: extractedSgpa ?? null,
        docUrl: uploaded.url,
        fileSha256: sha256,
        extractedName: extracted.studentName ?? null,
        extractedInstitution: extracted.institutionName ?? null,
        examDate: parseDate(extracted.examDate),
        verifiedVia: 'ai_ocr',
        verificationStatus: autoVerify ? 'verified' : 'pending',
        verifiedAt: autoVerify ? new Date() : null,
        ocrExtracted: {
          ...extracted,
          claimedName,
          claimedInst,
          nameMatch,
          instMatch,
          autoVerify,
          aiSkipped,
        },
      },
    });

    // 7. Recompute the profile's master CGPA from verified records only.
    await this.recomputeProfileCgpa(input.userId);
    await this.engine.recomputeAllForUser(input.userId);

    return record;
  }

  async listMine(userId: string) {
    return this.prisma.academicRecord.findMany({
      where: { userId },
      orderBy: { semester: 'asc' },
    });
  }

  /**
   * Compute master CGPA as the latest verified record's CGPA, or if no CGPA
   * was captured (only SGPAs), average the SGPAs across verified records.
   */
  async recomputeProfileCgpa(userId: string) {
    const verified = await this.prisma.academicRecord.findMany({
      where: { userId, verificationStatus: 'verified' },
      orderBy: { semester: 'desc' },
    });
    let masterCgpa: number | null = null;
    const latestWithCgpa = verified.find((r) => r.cgpa && r.cgpa > 0);
    if (latestWithCgpa) {
      masterCgpa = latestWithCgpa.cgpa;
    } else if (verified.length > 0) {
      const sgpas = verified.map((r) => r.sgpa).filter((s): s is number => typeof s === 'number');
      if (sgpas.length > 0) {
        masterCgpa = sgpas.reduce((a, b) => a + b, 0) / sgpas.length;
      }
    }
    await this.prisma.studentProfile.update({
      where: { userId },
      data: {
        cgpa: masterCgpa,
        cgpaVerifiedAt: masterCgpa != null ? new Date() : null,
      },
    });
  }

  // Admin actions
  async approve(recordId: string) {
    const rec = await this.prisma.academicRecord.update({
      where: { id: recordId },
      data: { verificationStatus: 'verified', verifiedAt: new Date(), rejectionReason: null },
    });
    await this.recomputeProfileCgpa(rec.userId);
    await this.engine.recomputeAllForUser(rec.userId);
    return rec;
  }

  async reject(recordId: string, reason: string) {
    const rec = await this.prisma.academicRecord.update({
      where: { id: recordId },
      data: { verificationStatus: 'rejected', verifiedAt: null, rejectionReason: reason },
    });
    await this.recomputeProfileCgpa(rec.userId);
    return rec;
  }

  private bufferToDataUrl(buf: Buffer, mime: string): string {
    return `data:${mime};base64,${buf.toString('base64')}`;
  }
}

function parseNum(v: number | string | null | undefined): number | null {
  if (v == null) return null;
  if (typeof v === 'number') return Number.isFinite(v) ? v : null;
  const m = v.match(/(\d+(?:\.\d+)?)/);
  if (!m) return null;
  const n = parseFloat(m[1]);
  return Number.isFinite(n) ? n : null;
}

function parseDate(v: string | null | undefined): Date | null {
  if (!v) return null;
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? null : d;
}

function fuzzyNameMatch(extracted: string | null, claimed: string): boolean {
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
  const hits = b.filter((p) => a.has(p)).length;
  return hits >= Math.max(2, Math.ceil(b.length * 0.75));
}

function fuzzyInstMatch(extracted: string | null, claimed: string): boolean {
  if (!extracted || !claimed) return false;
  const norm = (s: string) =>
    s
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .trim();
  const a = norm(extracted);
  const b = norm(claimed);
  if (a.includes(b) || b.includes(a)) return true;
  const acronym = b
    .split(/\s+/)
    .filter((w) => w.length > 2)
    .map((w) => w[0])
    .join('');
  return acronym.length >= 3 && a.replace(/\s+/g, '').includes(acronym);
}
