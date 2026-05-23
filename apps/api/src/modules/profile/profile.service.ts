import { Injectable, NotFoundException } from '@nestjs/common';
import type { ResumeParseResult } from '@skillverify/shared';
import { PrismaService } from '../../infra/prisma/prisma.service';
import { StorageService } from '../../infra/storage/storage.service';
import { ResumeParser } from './resume-parser';
import type { UpdateProfileDto } from './dto';

@Injectable()
export class ProfileService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
    private readonly parser: ResumeParser,
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
    if (!file.mimetype.startsWith('image/')) {
      throw new Error('Avatar must be an image');
    }
    const uploaded = await this.storage.upload(`avatars/${userId}`, file);
    await this.prisma.studentProfile.update({
      where: { userId },
      data: { avatarUrl: uploaded.url },
    });
    return uploaded;
  }

  async uploadResume(userId: string, file: Express.Multer.File) {
    if (file.mimetype !== 'application/pdf') {
      throw new Error('Resume must be a PDF');
    }
    const uploaded = await this.storage.upload(`resumes/${userId}`, file);
    await this.prisma.studentProfile.update({
      where: { userId },
      data: { resumeUrl: uploaded.url },
    });

    const parsed = await this.parser.parse(file.buffer);
    await this.mergeParsed(userId, parsed);
    return { resumeUrl: uploaded.url, parsed };
  }

  /**
   * Storage-free alternative: user pastes resume text, AI parses + merges.
   * No file is saved. Used when S3 isn't configured (or as a fallback for
   * users who don't want to upload a PDF).
   */
  async parseResumeText(userId: string, text: string) {
    const parsed = await this.parser.parseText(text);
    await this.mergeParsed(userId, parsed);
    return { parsed };
  }

  async getPublicBySlug(slug: string) {
    const profile = await this.prisma.studentProfile.findUnique({
      where: { sharableSlug: slug },
      include: {
        user: {
          include: {
            institution: true,
            userSkills: {
              include: { skill: true },
              where: { highestVerificationLayer: { not: 'L0_UNVERIFIED' } },
            },
            projects: true,
            certifications: { where: { verificationStatus: 'verified' } },
          },
        },
      },
    });
    if (!profile || !profile.isPublic) return null;
    return profile;
  }

  private async mergeParsed(userId: string, parsed: ResumeParseResult) {
    const updates: Record<string, unknown> = {};
    if (parsed.fullName) updates.fullName = parsed.fullName;
    // Headline + bio are marked REQUIRED in the prompt but small free models
    // sometimes skip them — synthesize from other parsed fields as a safety net.
    const headline = parsed.headline?.trim() || synthesizeHeadline(parsed);
    const bio = parsed.bio?.trim() || synthesizeBio(parsed);
    if (headline) updates.headline = headline;
    if (bio) updates.bio = bio;
    if (parsed.phone) updates.phone = parsed.phone;
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
