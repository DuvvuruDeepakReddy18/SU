import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, VerificationLayer } from '@prisma/client';
import type {
  CandidateSearchInput,
  RecruiterJobInput,
  RecruiterInquiryInput,
} from '@skillverify/shared';
import { PrismaService } from '../../infra/prisma/prisma.service';
import { EmailService } from '../../infra/email/email.service';

// Verification layers, lowest → highest. Used to build "at or above" filters.
const LAYER_ORDER: VerificationLayer[] = [
  'L0_UNVERIFIED',
  'L1_ACADEMIC',
  'L2_CERTIFIED',
  'L3_PROVEN',
  'L4_EXPERT',
];

function layerRank(layer: VerificationLayer): number {
  return LAYER_ORDER.indexOf(layer);
}

@Injectable()
export class RecruitersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly email: EmailService,
  ) {}

  /**
   * The signed-in recruiter's own profile + employer + approval status. Drives
   * the company-portal shell (pending screen vs full app).
   */
  async me(userId: string) {
    const profile = await this.prisma.recruiterProfile.findUnique({
      where: { userId },
      include: { employer: true, user: { select: { email: true } } },
    });
    if (!profile) throw new NotFoundException('Recruiter profile not found');
    return profile;
  }

  // ---------- Admin approval queue ----------

  adminListPending(limit = 50) {
    return this.prisma.recruiterProfile.findMany({
      where: { status: 'pending' },
      take: limit,
      orderBy: { createdAt: 'asc' },
      include: { employer: true, user: { select: { email: true } } },
    });
  }

  /** Approve a recruiter: status approved + employer verified. */
  async adminApprove(userId: string) {
    const before = await this.prisma.recruiterProfile.findUnique({
      where: { userId },
      select: { status: true, employerId: true },
    });
    if (!before) throw new NotFoundException('Recruiter profile not found');
    const profile = await this.prisma.recruiterProfile.update({
      where: { userId },
      data: { status: 'approved', approvedAt: new Date(), rejectionReason: null },
      include: { employer: true, user: { select: { email: true } } },
    });
    await this.prisma.employer.update({
      where: { id: profile.employerId },
      data: { verified: true },
    });
    return { before, profile };
  }

  /** Reject a recruiter with an optional free-text reason. */
  async adminReject(userId: string, reason?: string | null) {
    const before = await this.prisma.recruiterProfile.findUnique({
      where: { userId },
      select: { status: true, employerId: true },
    });
    if (!before) throw new NotFoundException('Recruiter profile not found');
    const profile = await this.prisma.recruiterProfile.update({
      where: { userId },
      data: { status: 'rejected', approvedAt: null, rejectionReason: reason ?? null },
      include: { employer: true, user: { select: { email: true } } },
    });
    return { before, profile };
  }

  // ---------- Candidate search (PII-stripped) ----------

  /** Only approved recruiters may search / view / save candidates. */
  private async assertApproved(userId: string) {
    const p = await this.prisma.recruiterProfile.findUnique({
      where: { userId },
      select: { status: true },
    });
    if (!p) throw new ForbiddenException('Recruiter profile not found');
    if (p.status !== 'approved') {
      throw new ForbiddenException('Your recruiter account is pending approval.');
    }
  }

  /**
   * Search public, verified students. The `select` is the privacy boundary:
   * we list ONLY non-PII fields — name, headline, verified skills, college,
   * grad year, location. Phone, institute email, login email, resume and
   * college-ID URLs are never selected, so they can't leak through search.
   */
  async searchCandidates(recruiterId: string, input: CandidateSearchInput) {
    await this.assertApproved(recruiterId);
    const { q, skill, minLayer, institutionId, graduationYear, location, page, pageSize } = input;

    // Skill / layer filter applies to the student's verified skills.
    const skillWhere: Prisma.UserSkillWhereInput = {};
    if (skill) skillWhere.skill = { name: { contains: skill, mode: 'insensitive' } };
    if (minLayer) {
      skillWhere.highestVerificationLayer = {
        in: LAYER_ORDER.slice(layerRank(minLayer as VerificationLayer)),
      };
    }

    const userWhere: Prisma.UserWhereInput = { deletedAt: null };
    if (institutionId) userWhere.institutionId = institutionId;
    if (skill || minLayer) userWhere.userSkills = { some: skillWhere };

    const where: Prisma.StudentProfileWhereInput = {
      isPublic: true,
      user: { is: userWhere },
      ...(graduationYear ? { graduationYear } : {}),
      ...(location ? { location: { contains: location, mode: 'insensitive' } } : {}),
      ...(q
        ? {
            OR: [
              { fullName: { contains: q, mode: 'insensitive' } },
              { headline: { contains: q, mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    const [rows, total] = await Promise.all([
      this.prisma.studentProfile.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { user: { createdAt: 'desc' } },
        select: CANDIDATE_CARD_SELECT,
      }),
      this.prisma.studentProfile.count({ where }),
    ]);

    return { items: rows.map(toCandidateCard), total, page, pageSize };
  }

  // ---------- Single candidate view ----------

  /**
   * Full candidate profile for an approved recruiter. Contact details
   * (phone / institute email / login email) are included ONLY when the
   * student has accepted an inquiry from this recruiter.
   */
  async getCandidate(recruiterId: string, studentId: string) {
    await this.assertApproved(recruiterId);

    const profile = await this.prisma.studentProfile.findFirst({
      where: { userId: studentId, isPublic: true, user: { deletedAt: null } },
      select: {
        ...CANDIDATE_CARD_SELECT,
        cgpaVerifiedAt: true,
        user: {
          select: {
            institution: { select: { name: true } },
            userSkills: {
              where: { highestVerificationLayer: { not: 'L0_UNVERIFIED' } },
              select: {
                highestVerificationLayer: true,
                skill: { select: { name: true, category: true } },
              },
            },
            projects: {
              select: { id: true, title: true, description: true, techStack: true, stars: true },
            },
            certifications: {
              where: { verificationStatus: 'verified' },
              select: { id: true, issuer: true, courseName: true, tier: true },
            },
          },
        },
      },
    });
    if (!profile) throw new NotFoundException('Candidate not found');

    // Contact reveal gate: only after an accepted inquiry between us.
    const accepted = await this.prisma.recruiterInquiry.findFirst({
      where: { recruiterId, studentId, status: 'accepted' },
      select: { id: true },
    });
    let contact: {
      phoneNumber: string | null;
      instituteEmail: string | null;
      email: string;
    } | null = null;
    if (accepted) {
      const c = await this.prisma.studentProfile.findUnique({
        where: { userId: studentId },
        select: { phoneNumber: true, instituteEmail: true, user: { select: { email: true } } },
      });
      contact = c
        ? { phoneNumber: c.phoneNumber, instituteEmail: c.instituteEmail, email: c.user.email }
        : null;
    }

    return {
      ...toCandidateCard(profile),
      projects: profile.user.projects,
      certifications: profile.user.certifications,
      contactUnlocked: !!accepted,
      contact,
    };
  }

  // ---------- Shortlist ----------

  async saveCandidate(recruiterId: string, studentId: string, note?: string) {
    await this.assertApproved(recruiterId);
    return this.prisma.savedCandidate.upsert({
      where: { recruiterId_studentId: { recruiterId, studentId } },
      update: { note: note ?? null },
      create: { recruiterId, studentId, note: note ?? null },
    });
  }

  async unsaveCandidate(recruiterId: string, studentId: string) {
    await this.assertApproved(recruiterId);
    await this.prisma.savedCandidate
      .delete({ where: { recruiterId_studentId: { recruiterId, studentId } } })
      .catch(() => undefined);
    return { ok: true };
  }

  async listSaved(recruiterId: string) {
    await this.assertApproved(recruiterId);
    const rows = await this.prisma.savedCandidate.findMany({
      where: { recruiterId },
      orderBy: { createdAt: 'desc' },
      select: {
        note: true,
        createdAt: true,
        student: { select: { studentProfile: { select: CANDIDATE_CARD_SELECT } } },
      },
    });
    return rows
      .filter((r) => r.student.studentProfile)
      .map((r) => ({
        note: r.note,
        savedAt: r.createdAt,
        candidate: toCandidateCard(r.student.studentProfile!),
      }));
  }

  // ---------- Jobs (recruiter-posted PlacementDrives) ----------

  private async requireEmployer(userId: string) {
    const profile = await this.prisma.recruiterProfile.findUnique({
      where: { userId },
      include: { employer: true },
    });
    if (!profile) throw new ForbiddenException('Recruiter profile not found');
    if (profile.status !== 'approved') {
      throw new ForbiddenException('Your recruiter account is pending approval.');
    }
    return profile;
  }

  async createJob(recruiterId: string, dto: RecruiterJobInput) {
    const profile = await this.requireEmployer(recruiterId);
    return this.prisma.placementDrive.create({
      data: {
        postedById: recruiterId,
        employerId: profile.employerId,
        company: profile.employer.name,
        role: dto.role,
        description: dto.description ?? null,
        packageLpa: dto.packageLpa ?? null,
        minLevel: dto.minLevel ?? 'L3_PROVEN',
        jobType: dto.jobType ?? 'full_time',
        skills: dto.skills ?? [],
        location: dto.location ?? null,
        // Recruiter jobs are public (visible to all students), not institute-scoped.
        scope: 'public',
        closesAt: dto.closesAt ? new Date(dto.closesAt) : null,
      },
    });
  }

  async listJobs(recruiterId: string) {
    const profile = await this.requireEmployer(recruiterId);
    return this.prisma.placementDrive.findMany({
      where: { employerId: profile.employerId },
      orderBy: { createdAt: 'desc' },
      include: { _count: { select: { applications: true } } },
    });
  }

  /** Verify the job belongs to this recruiter's employer. */
  private async assertOwnsJob(recruiterId: string, jobId: string) {
    const profile = await this.requireEmployer(recruiterId);
    const drive = await this.prisma.placementDrive.findUnique({ where: { id: jobId } });
    if (!drive || drive.employerId !== profile.employerId) {
      throw new NotFoundException('Job not found');
    }
    return drive;
  }

  async updateJob(recruiterId: string, jobId: string, dto: RecruiterJobInput) {
    await this.assertOwnsJob(recruiterId, jobId);
    return this.prisma.placementDrive.update({
      where: { id: jobId },
      data: {
        role: dto.role,
        description: dto.description ?? null,
        packageLpa: dto.packageLpa ?? null,
        minLevel: dto.minLevel ?? 'L3_PROVEN',
        jobType: dto.jobType ?? 'full_time',
        skills: dto.skills ?? [],
        location: dto.location ?? null,
        closesAt: dto.closesAt ? new Date(dto.closesAt) : null,
      },
    });
  }

  async deleteJob(recruiterId: string, jobId: string) {
    await this.assertOwnsJob(recruiterId, jobId);
    await this.prisma.placementDrive.delete({ where: { id: jobId } });
    return { ok: true };
  }

  // ---------- Pipeline ----------

  async getJobPipeline(recruiterId: string, jobId: string) {
    const drive = await this.assertOwnsJob(recruiterId, jobId);
    const apps = await this.prisma.placementApplication.findMany({
      where: { driveId: jobId },
      orderBy: { createdAt: 'asc' },
      select: {
        id: true,
        status: true,
        sourcedBy: true,
        createdAt: true,
        user: { select: { studentProfile: { select: CANDIDATE_CARD_SELECT } } },
      },
    });
    return {
      job: {
        id: drive.id,
        role: drive.role,
        company: drive.company,
        minLevel: drive.minLevel,
        jobType: drive.jobType,
        location: drive.location,
        packageLpa: drive.packageLpa,
        skills: drive.skills,
      },
      applications: apps
        .filter((a) => a.user.studentProfile)
        .map((a) => ({
          applicationId: a.id,
          stage: a.status,
          sourcedBy: a.sourcedBy,
          createdAt: a.createdAt,
          candidate: toCandidateCard(a.user.studentProfile!),
        })),
    };
  }

  async moveApplication(recruiterId: string, jobId: string, applicationId: string, stage: string) {
    await this.assertOwnsJob(recruiterId, jobId);
    const app = await this.prisma.placementApplication.findUnique({ where: { id: applicationId } });
    if (!app || app.driveId !== jobId) throw new NotFoundException('Application not found');
    return this.prisma.placementApplication.update({
      where: { id: applicationId },
      data: { status: stage },
    });
  }

  /** Pull a candidate from search into a job's pipeline (shortlisted). */
  async sourceCandidate(recruiterId: string, jobId: string, studentId: string) {
    await this.assertOwnsJob(recruiterId, jobId);
    return this.prisma.placementApplication.upsert({
      where: { driveId_userId: { driveId: jobId, userId: studentId } },
      update: {},
      create: { driveId: jobId, userId: studentId, status: 'shortlisted', sourcedBy: 'sourced' },
    });
  }

  // ---------- Contact requests (inquiries) ----------

  /** Recruiter sends a contact request to a student. */
  async createInquiry(recruiterId: string, input: RecruiterInquiryInput) {
    await this.assertApproved(recruiterId);
    const student = await this.prisma.user.findFirst({
      where: { id: input.studentId, role: 'STUDENT', deletedAt: null },
      select: { id: true },
    });
    if (!student) throw new NotFoundException('Candidate not found');

    // Re-sending updates the message instead of erroring (and re-opens a
    // declined request). findFirst + update/create avoids the nullable-driveId
    // compound-unique-where edge case in Prisma.
    const existing = await this.prisma.recruiterInquiry.findFirst({
      where: { recruiterId, studentId: input.studentId, driveId: input.driveId ?? null },
      select: { id: true },
    });
    const inquiry = existing
      ? await this.prisma.recruiterInquiry.update({
          where: { id: existing.id },
          data: { message: input.message, status: 'pending' },
        })
      : await this.prisma.recruiterInquiry.create({
          data: {
            recruiterId,
            studentId: input.studentId,
            driveId: input.driveId ?? null,
            message: input.message,
            status: 'pending',
          },
        });

    void this.notifyInquiryReceived(recruiterId, input.studentId, input.driveId ?? null);
    return inquiry;
  }

  /** Fire-and-forget email to the student that a company reached out. */
  private async notifyInquiryReceived(
    recruiterId: string,
    studentId: string,
    driveId: string | null,
  ) {
    const [student, recruiter, drive] = await Promise.all([
      this.prisma.studentProfile.findUnique({
        where: { userId: studentId },
        select: { fullName: true, user: { select: { email: true } } },
      }),
      this.prisma.recruiterProfile.findUnique({
        where: { userId: recruiterId },
        select: { employer: { select: { name: true } } },
      }),
      driveId
        ? this.prisma.placementDrive.findUnique({ where: { id: driveId }, select: { role: true } })
        : Promise.resolve(null),
    ]);
    if (!student || !recruiter) return;
    await this.email.sendInquiryReceived(
      student.user.email,
      student.fullName,
      recruiter.employer.name,
      drive?.role ?? null,
    );
  }

  /** Recruiter's sent inquiries (with the student card + acceptance state). */
  async listMyInquiries(recruiterId: string) {
    await this.assertApproved(recruiterId);
    const rows = await this.prisma.recruiterInquiry.findMany({
      where: { recruiterId },
      orderBy: { updatedAt: 'desc' },
      include: { student: { select: { studentProfile: { select: CANDIDATE_CARD_SELECT } } } },
    });
    return rows
      .filter((r) => r.student.studentProfile)
      .map((r) => ({
        id: r.id,
        message: r.message,
        status: r.status,
        createdAt: r.createdAt,
        candidate: toCandidateCard(r.student.studentProfile!),
      }));
  }

  // ---------- Student side of inquiries ----------

  /** Inquiries a student has received (recruiter name + company, message). */
  async listStudentInquiries(studentId: string) {
    const rows = await this.prisma.recruiterInquiry.findMany({
      where: { studentId },
      orderBy: { updatedAt: 'desc' },
      include: {
        recruiter: {
          select: {
            recruiterProfile: {
              select: { fullName: true, title: true, employer: { select: { name: true } } },
            },
          },
        },
        drive: { select: { id: true, role: true } },
      },
    });
    return rows.map((r) => ({
      id: r.id,
      message: r.message,
      status: r.status,
      createdAt: r.createdAt,
      recruiterUserId: r.recruiterId,
      recruiterName: r.recruiter.recruiterProfile?.fullName ?? 'A recruiter',
      recruiterTitle: r.recruiter.recruiterProfile?.title ?? null,
      company: r.recruiter.recruiterProfile?.employer.name ?? 'A company',
      job: r.drive ? { id: r.drive.id, role: r.drive.role } : null,
    }));
  }

  /** Student accepts or declines an inquiry. Accept reveals their contact. */
  async respondToInquiry(studentId: string, inquiryId: string, accept: boolean) {
    const inquiry = await this.prisma.recruiterInquiry.findUnique({ where: { id: inquiryId } });
    if (!inquiry || inquiry.studentId !== studentId)
      throw new NotFoundException('Inquiry not found');
    const updated = await this.prisma.recruiterInquiry.update({
      where: { id: inquiryId },
      data: { status: accept ? 'accepted' : 'declined' },
    });
    if (accept) void this.notifyInquiryAccepted(inquiry.recruiterId, studentId);
    return updated;
  }

  /** Fire-and-forget email to the recruiter that the student shared contact. */
  private async notifyInquiryAccepted(recruiterId: string, studentId: string) {
    const [recruiter, student] = await Promise.all([
      this.prisma.recruiterProfile.findUnique({
        where: { userId: recruiterId },
        select: { fullName: true, user: { select: { email: true } } },
      }),
      this.prisma.studentProfile.findUnique({
        where: { userId: studentId },
        select: { fullName: true },
      }),
    ]);
    if (!recruiter || !student) return;
    await this.email.sendInquiryAccepted(
      recruiter.user.email,
      recruiter.fullName ?? 'there',
      student.fullName,
    );
  }

  async countStudentPendingInquiries(studentId: string) {
    const count = await this.prisma.recruiterInquiry.count({
      where: { studentId, status: 'pending' },
    });
    return { count };
  }
}

// The privacy boundary: the ONLY student fields a recruiter ever receives
// through search / cards. No phone, no emails, no document URLs. Exported so a
// unit test can assert it never grows to include PII.
export const CANDIDATE_CARD_SELECT = {
  userId: true,
  fullName: true,
  headline: true,
  bio: true,
  avatarUrl: true,
  sharableSlug: true,
  graduationYear: true,
  location: true,
  courseProgram: true,
  cgpa: true,
  user: {
    select: {
      institution: { select: { name: true } },
      userSkills: {
        where: { highestVerificationLayer: { not: 'L0_UNVERIFIED' as VerificationLayer } },
        select: {
          highestVerificationLayer: true,
          skill: { select: { name: true, category: true } },
        },
        take: 12,
      },
    },
  },
} satisfies Prisma.StudentProfileSelect;

// Structural shape `toCandidateCard` reads. Both the search projection and the
// richer single-candidate projection satisfy it (extra fields are ignored).
interface CandidateCardInput {
  userId: string;
  fullName: string;
  headline: string | null;
  bio: string | null;
  avatarUrl: string | null;
  sharableSlug: string;
  graduationYear: number | null;
  location: string | null;
  courseProgram: string | null;
  cgpa: number | null;
  cgpaVerifiedAt?: Date | null;
  user: {
    institution: { name: string } | null;
    userSkills: {
      highestVerificationLayer: VerificationLayer;
      skill: { name: string; category: string };
    }[];
  };
}

export function toCandidateCard(p: CandidateCardInput) {
  const skills = p.user.userSkills.map((s) => ({
    name: s.skill.name,
    category: s.skill.category,
    layer: s.highestVerificationLayer,
  }));
  const topLayer = skills.reduce<VerificationLayer>(
    (best, s) => (layerRank(s.layer) > layerRank(best) ? s.layer : best),
    'L0_UNVERIFIED',
  );
  return {
    userId: p.userId,
    fullName: p.fullName,
    headline: p.headline,
    bio: p.bio,
    avatarUrl: p.avatarUrl,
    sharableSlug: p.sharableSlug,
    graduationYear: p.graduationYear,
    location: p.location,
    courseProgram: p.courseProgram,
    cgpa: p.cgpa,
    cgpaVerified: 'cgpaVerifiedAt' in p ? !!p.cgpaVerifiedAt : undefined,
    institution: p.user.institution?.name ?? null,
    topLayer,
    skills,
  };
}
