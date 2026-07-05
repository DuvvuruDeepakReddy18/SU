import {
  BadRequestException,
  HttpException,
  Injectable,
  Logger,
  NotFoundException,
  ServiceUnavailableException,
  UnprocessableEntityException,
} from '@nestjs/common';
import type { ResumeParseResult } from '@skillverify/shared';
import { PrismaService } from '../../infra/prisma/prisma.service';
import { StorageService } from '../../infra/storage/storage.service';
import { ResumeParser } from './resume-parser';
import { QueueService } from '../../infra/queue/queue.service';
import { QUEUE_NAMES, VERIFICATION_JOBS } from '../../infra/queue/queue.constants';
import type { UpdateProfileDto } from './dto';
import type { Prisma } from '@prisma/client';

/**
 * Portfolio-safe projection for the @Public() `GET /profile/public/:slug`
 * endpoint. An explicit `select` (never a blanket `include`) is the privacy
 * boundary — it structurally prevents leaking PII like governmentName,
 * phone/phoneNumber, instituteEmail, resumeUrl, collegeId*, geoLat/geoLng, and
 * the User row's email + passwordHash. Exported + asserted against a PII
 * denylist in public-pii-boundary.spec.ts, so a stray field can never regress.
 */
export const PUBLIC_PROFILE_SELECT = {
  fullName: true,
  headline: true,
  bio: true,
  avatarUrl: true,
  cgpa: true,
  graduationYear: true,
  location: true,
  isPublic: true,
  shareTheme: true,
  shareSectionsOrder: true,
  user: {
    select: {
      id: true,
      institution: { select: { name: true } },
      userSkills: {
        where: { highestVerificationLayer: { not: 'L0_UNVERIFIED' } },
        select: {
          id: true,
          selfRatedLevel: true,
          highestVerificationLayer: true,
          skill: { select: { name: true, category: true } },
        },
      },
      projects: {
        select: {
          id: true,
          title: true,
          description: true,
          repoUrl: true,
          liveUrl: true,
          techStack: true,
          stars: true,
        },
      },
      certifications: {
        where: { verificationStatus: 'verified' },
        select: { id: true, issuer: true, courseName: true, tier: true },
      },
    },
  },
} satisfies Prisma.StudentProfileSelect;

@Injectable()
export class ProfileService {
  private readonly log = new Logger(ProfileService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
    private readonly parser: ResumeParser,
    private readonly queue: QueueService,
  ) {}

  async getMine(userId: string) {
    const profile = await this.prisma.studentProfile.findUnique({
      where: { userId },
      include: { user: { include: { institution: true } } },
    });
    if (!profile) throw new NotFoundException('Profile not found');
    return profile;
  }

  async update(userId: string, dto: UpdateProfileDto) {
    return this.prisma.studentProfile.update({ where: { userId }, data: dto });
  }

  async uploadAvatar(userId: string, file: Express.Multer.File) {
    if (!file) throw new BadRequestException('No file uploaded.');
    if (!file.mimetype.startsWith('image/')) {
      throw new BadRequestException('Avatar must be an image');
    }
    const uploaded = await this.storage.upload(`avatars/${userId}`, file);
    await this.prisma.studentProfile.update({
      where: { userId },
      data: { avatarUrl: uploaded.url },
    });
    return uploaded;
  }

  async uploadCollegeId(userId: string, file: Express.Multer.File) {
    if (!file) throw new BadRequestException('No file uploaded.');
    const ok = file.mimetype.startsWith('image/') || file.mimetype === 'application/pdf';
    if (!ok) throw new BadRequestException('College ID must be an image or PDF');
    const uploaded = await this.storage.upload(`college-ids/${userId}`, file);
    await this.prisma.studentProfile.update({
      where: { userId },
      data: {
        collegeIdUrl: uploaded.url,
        collegeIdUploadedAt: new Date(),
        // Re-uploading resets the verification state — the AI screen + admin
        // queue picks it up again.
        collegeIdStatus: 'pending_review',
        collegeIdVerifiedAt: null,
        collegeIdRejectionReason: null,
      },
    });
    // Enqueue AI re-screen — runs in the verification worker. jobId keeps
    // rapid re-uploads from queuing many redundant jobs (latest wins).
    // BullMQ forbids ':' in custom job ids, so use '-'.
    await this.queue.addNamed(
      QUEUE_NAMES.VERIFICATION_SCREEN,
      VERIFICATION_JOBS.SCREEN_COLLEGE_ID,
      { userId },
      { jobId: `screen-college-id-${userId}` },
    );
    return uploaded;
  }

  async uploadResume(userId: string, file: Express.Multer.File) {
    if (!file) throw new BadRequestException('No file uploaded.');
    if (file.mimetype !== 'application/pdf') {
      throw new BadRequestException('Resume must be a PDF');
    }
    // Save the file first. Surface the storage error *name* (AccessDenied /
    // NoSuchBucket / InvalidAccessKeyId / SignatureDoesNotMatch / …) instead of
    // a masked 500, so an S3 misconfiguration is diagnosable from the response.
    let uploaded: { key: string; url: string };
    try {
      uploaded = await this.storage.upload(`resumes/${userId}`, file);
      await this.prisma.studentProfile.update({
        where: { userId },
        data: { resumeUrl: uploaded.url },
      });
    } catch (e) {
      const err = e as { name?: string; message?: string };
      this.log.error(`Resume file save failed for ${userId}: ${err.name}: ${err.message}`);
      // Temporary: surface the real storage error (name + message) so the S3
      // misconfig is diagnosable from the toast. Contains no secret (the S3
      // secret key never appears in AWS error text); tighten once resolved.
      throw new ServiceUnavailableException(
        `Could not save your resume file [${err.name ?? 'Error'}]: ${(err.message ?? '').slice(0, 200)}`,
      );
    }

    // The file is saved; a parse failure (AI busy / image-only PDF) should
    // degrade to a clear message, not a masked 500.
    try {
      const parsed = await this.parser.parse(file.buffer);
      await this.mergeParsed(userId, parsed);
      return { resumeUrl: uploaded.url, parsed };
    } catch (e) {
      if (e instanceof HttpException) throw e;
      this.log.error(`Resume parse failed for ${userId}: ${(e as Error).message}`);
      throw new UnprocessableEntityException(
        'Your resume was saved, but we could not read it automatically right now. Fill your profile in manually, or try again in a minute.',
      );
    }
  }

  /**
   * Storage-free alternative: user pastes resume text, AI parses + merges.
   * No file is saved. Used when S3 isn't configured (or as a fallback for
   * users who don't want to upload a PDF).
   */
  async parseResumeText(userId: string, text: string) {
    try {
      const parsed = await this.parser.parseText(text);
      await this.mergeParsed(userId, parsed);
      return { parsed };
    } catch (e) {
      if (e instanceof HttpException) throw e;
      this.log.error(`Resume text parse failed for ${userId}: ${(e as Error).message}`);
      throw new UnprocessableEntityException(
        'We could not read that resume text right now. Please try again in a minute, or fill your profile in manually.',
      );
    }
  }

  async getPublicBySlug(slug: string) {
    // SECURITY: this is a @Public() endpoint keyed by a shareable slug, so it
    // must return ONLY portfolio-safe fields. An explicit `select` (never a
    // blanket `include`) is the guard — it structurally prevents leaking PII
    // like governmentName, phone/phoneNumber, instituteEmail, resumeUrl,
    // collegeIdUrl/collegeIdOcrExtracted, geoLat/geoLng, and the User row's
    // email + passwordHash. `findFirst` lets the public + not-deleted guard
    // live in the `where`, so `deletedAt` is never even selected.
    return this.prisma.studentProfile.findFirst({
      where: { sharableSlug: slug, isPublic: true, user: { deletedAt: null } },
      select: PUBLIC_PROFILE_SELECT,
    });
  }

  private async mergeParsed(userId: string, parsed: ResumeParseResult) {
    const existing = await this.prisma.studentProfile.findUnique({
      where: { userId },
      select: { phoneNumber: true },
    });
    const updates: Record<string, unknown> = {};
    if (parsed.fullName) updates.fullName = parsed.fullName;
    // Headline + bio are marked REQUIRED in the prompt but small free models
    // sometimes skip them — synthesize from other parsed fields as a safety net.
    const headline = parsed.headline?.trim() || synthesizeHeadline(parsed);
    const bio = parsed.bio?.trim() || synthesizeBio(parsed);
    if (headline) updates.headline = headline;
    if (bio) updates.bio = bio;
    // Fill phoneNumber from the resume only when the student has none yet (e.g.
    // OAuth signups skip the phone field). Never overwrite a verified signup
    // number. The recruiter contact reveal reads phoneNumber — the old `phone`
    // column was dead data that never surfaced.
    if (parsed.phone && !existing?.phoneNumber) updates.phoneNumber = parsed.phone;
    if (parsed.location) updates.location = parsed.location;
    if (parsed.linkedinUrl) updates.linkedinUrl = parsed.linkedinUrl;
    if (parsed.githubUrl) updates.githubUrl = parsed.githubUrl;
    if (parsed.leetcodeUrl) updates.leetcodeUrl = parsed.leetcodeUrl;
    if (parsed.codechefUrl) updates.codechefUrl = parsed.codechefUrl;
    if (parsed.portfolioUrl) updates.portfolioUrl = parsed.portfolioUrl;

    // Derive CGPA + graduation year from the most recent education entry.
    const latestEducation = [...parsed.education].sort(
      (a, b) => (b.endYear ?? b.startYear ?? 0) - (a.endYear ?? a.startYear ?? 0),
    )[0];
    if (latestEducation?.cgpa != null) updates.cgpa = latestEducation.cgpa;
    if (latestEducation?.endYear != null) updates.graduationYear = latestEducation.endYear;

    if (Object.keys(updates).length > 0) {
      await this.prisma.studentProfile.update({ where: { userId }, data: updates });
    }

    // Auto-claim catalog-matched skills at level 1, layer L0_UNVERIFIED (user confirms later).
    if (parsed.skills.length > 0) {
      const matched = await this.prisma.skillCatalog.findMany({
        where: { name: { in: parsed.skills, mode: 'insensitive' } },
      });
      for (const skill of matched) {
        await this.prisma.userSkill.upsert({
          where: { userId_skillId: { userId, skillId: skill.id } },
          update: {},
          create: { userId, skillId: skill.id, selfRatedLevel: 1 },
        });
      }
    }

    // Stash projects from resume as manual entries. Dedupe by title.
    const existingProjects = await this.prisma.project.findMany({
      where: { userId },
      select: { title: true },
    });
    const existingTitles = new Set(existingProjects.map((p) => p.title.toLowerCase().trim()));
    for (const p of parsed.projects) {
      if (existingTitles.has(p.title.toLowerCase().trim())) continue;
      await this.prisma.project.create({
        data: {
          userId,
          source: 'manual',
          title: p.title,
          description: p.description ?? undefined,
          repoUrl: p.repoUrl ?? undefined,
          liveUrl: p.liveUrl ?? undefined,
          techStack: p.techStack,
        },
      });
    }
  }
}

// ---------- synthesis fallbacks ----------
// Used when the model returns null/empty for headline or bio. Builds something
// reasonable from the rest of the parsed resume so the profile is never blank.

function latestEducation(parsed: ResumeParseResult) {
  return [...parsed.education].sort(
    (a, b) => (b.endYear ?? b.startYear ?? 0) - (a.endYear ?? a.startYear ?? 0),
  )[0];
}

function synthesizeHeadline(parsed: ResumeParseResult): string | null {
  const edu = latestEducation(parsed);
  const topSkills = parsed.skills.slice(0, 2).join(' & ');
  if (edu && topSkills) {
    const where = edu.institution.split(',')[0].trim();
    return `${edu.degree ?? 'Student'} @ ${where} · ${topSkills}`.slice(0, 120);
  }
  if (edu) return `${edu.degree ?? 'Student'} @ ${edu.institution}`.slice(0, 120);
  if (topSkills) return `Working with ${topSkills}`.slice(0, 120);
  return null;
}

function synthesizeBio(parsed: ResumeParseResult): string | null {
  const edu = latestEducation(parsed);
  const projects = parsed.projects.slice(0, 2).map((p) => p.title);
  const skills = parsed.skills.slice(0, 5);
  const parts: string[] = [];

  if (parsed.fullName && edu) {
    const where = edu.institution.split(',')[0].trim();
    parts.push(
      `${parsed.fullName.split(' ')[0]} is a ${edu.degree ?? 'student'} at ${where}${
        edu.endYear ? `, graduating ${edu.endYear}` : ''
      }.`,
    );
  } else if (edu) {
    parts.push(`Currently pursuing ${edu.degree ?? 'a degree'} at ${edu.institution}.`);
  }

  if (skills.length > 0) {
    parts.push(`Areas of focus include ${skills.join(', ')}.`);
  }

  if (projects.length > 0) {
    parts.push(`Recent work: ${projects.join(', ')}.`);
  }

  const out = parts.join(' ').trim();
  return out.length > 0 ? out : null;
}
