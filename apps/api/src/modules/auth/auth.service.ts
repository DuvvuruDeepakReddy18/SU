import {
  BadRequestException,
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import type { User, UserRole } from '@prisma/client';
import type {
  JwtPayload,
  SignupInput,
  RecruiterSignupInput,
  InstitutionAdminSignupInput,
  CompleteOnboardingInput,
} from '@skillverify/shared';
import { PrismaService } from '../../infra/prisma/prisma.service';
import { StorageService } from '../../infra/storage/storage.service';
import { QueueService } from '../../infra/queue/queue.service';
import { QUEUE_NAMES, VERIFICATION_JOBS } from '../../infra/queue/queue.constants';
import { EmailService } from '../../infra/email/email.service';
import { AuthTokenService } from './auth-token.service';
import type { OAuthSyncDto } from './dto';

const APP_URL = process.env.NEXTAUTH_URL ?? 'http://localhost:3000';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly storage: StorageService,
    private readonly queue: QueueService,
    private readonly email: EmailService,
    private readonly tokens: AuthTokenService,
  ) {}

  async signup(input: SignupInput) {
    // Email uniqueness on the login email.
    const existing = await this.prisma.user.findUnique({ where: { email: input.email } });
    if (existing) throw new ConflictException('Email already registered');

    // Validate the institution actually exists. The picker should always
    // return a real id, but we re-check server-side.
    const institution = await this.prisma.institution.findUnique({
      where: { id: input.institutionId },
    });
    if (!institution) {
      throw new BadRequestException('Selected institution does not exist.');
    }

    // If the institution has a domain on record, the institute email must
    // match it. Otherwise we accept any email (user-added institutions or
    // ones we haven't enriched with a domain yet).
    this.assertInstituteEmailMatches(institution, input.instituteEmail);

    // The collegeIdFileKey must be a previously-uploaded temp object.
    if (!input.collegeIdFileKey.startsWith('temp/college-ids/')) {
      throw new BadRequestException('Invalid college-ID upload key.');
    }
    const collegeIdUrl = this.storage.publicUrlFor(input.collegeIdFileKey);

    const passwordHash = await bcrypt.hash(input.password, 10);
    const slug = await this.generateSlug(input.governmentName);

    const user = await this.prisma.user.create({
      data: {
        email: input.email,
        passwordHash,
        role: 'STUDENT',
        institutionId: institution.id,
        studentProfile: {
          create: {
            // fullName defaults to government name unless the student renames
            // themselves later in profile settings (e.g. preferred name).
            fullName: input.governmentName,
            governmentName: input.governmentName,
            phoneNumber: input.phoneNumber,
            instituteEmail: input.instituteEmail,
            courseProgram: input.courseProgram,
            sharableSlug: slug,
            isPublic: true,
            collegeIdUrl,
            collegeIdUploadedAt: new Date(),
            collegeIdStatus: 'pending_review',
          },
        },
      },
    });

    // Enqueue AI pre-screen — fire-and-forget so a Redis hiccup never hangs or
    // breaks signup. (Previously awaited, which would block the response if the
    // queue was slow/down.) Worst case the college-ID stays pending for manual
    // review instead of auto-screening. jobId keyed by user dedupes re-uploads;
    // BullMQ forbids ':' in custom job ids, so use '-'.
    void this.queue
      .addNamed(
        QUEUE_NAMES.VERIFICATION_SCREEN,
        VERIFICATION_JOBS.SCREEN_COLLEGE_ID,
        { userId: user.id },
        { jobId: `screen-college-id-${user.id}` },
      )
      .catch(() => {});

    // Welcome + email-verification — fire-and-forget; EmailService swallows
    // its own errors, so a Resend outage never breaks signup.
    void this.email.sendWelcome(user.email, input.governmentName);
    void this.sendVerificationEmail(user.id, user.email, input.governmentName);

    return this.issueTokens(user);
  }

  /**
   * Recruiter self-signup. Creates a RECRUITER user + their Employer +
   * a RecruiterProfile in 'pending' state (no candidate-search access until an
   * admin approves). One recruiter per company in v1.
   */
  async signupRecruiter(input: RecruiterSignupInput) {
    const existing = await this.prisma.user.findUnique({ where: { email: input.email } });
    if (existing) throw new ConflictException('Email already registered');

    const passwordHash = await bcrypt.hash(input.password, 10);
    // Derive a company email domain from the recruiter's login email when it's
    // not a free provider — a soft trust signal for the approval queue.
    const domain = deriveCompanyDomain(input.email);

    // User → Employer → RecruiterProfile, atomically.
    const user = await this.prisma.$transaction(async (tx) => {
      const u = await tx.user.create({
        data: { email: input.email, passwordHash, role: 'RECRUITER' },
      });
      const employer = await tx.employer.create({
        data: {
          name: input.companyName,
          website: input.website ?? null,
          // domain is unique-when-set; collisions (two recruiters, same company
          // domain) shouldn't block signup, so only set it when free.
          domain: domain && !(await tx.employer.findUnique({ where: { domain } })) ? domain : null,
          createdById: u.id,
        },
      });
      await tx.recruiterProfile.create({
        data: {
          userId: u.id,
          employerId: employer.id,
          fullName: input.fullName,
          title: input.title ?? null,
          status: 'pending',
        },
      });
      return u;
    });

    void this.sendVerificationEmail(user.id, user.email, input.fullName);
    return this.issueTokens(user);
  }

  /**
   * Institution / TPO admin request-access signup. Creates an
   * INSTITUTION_ADMIN user + a pending InstitutionAdminProfile bound to an
   * existing institution. No roster access until an admin approves.
   */
  async signupInstitutionAdmin(input: InstitutionAdminSignupInput) {
    const existing = await this.prisma.user.findUnique({ where: { email: input.email } });
    if (existing) throw new ConflictException('Email already registered');

    const institution = await this.prisma.institution.findUnique({
      where: { id: input.institutionId },
    });
    if (!institution) throw new BadRequestException('Selected institution does not exist.');

    const passwordHash = await bcrypt.hash(input.password, 10);
    const user = await this.prisma.$transaction(async (tx) => {
      const u = await tx.user.create({
        data: {
          email: input.email,
          passwordHash,
          role: 'INSTITUTION_ADMIN',
          institutionId: institution.id,
        },
      });
      await tx.institutionAdminProfile.create({
        data: {
          userId: u.id,
          institutionId: institution.id,
          fullName: input.fullName,
          title: input.title ?? null,
          status: 'pending',
        },
      });
      return u;
    });

    void this.sendVerificationEmail(user.id, user.email, input.fullName);
    return this.issueTokens(user);
  }

  // ---------- Email verification ----------

  /** Issue an email-verify token and send the link. Fire-and-forget safe. */
  private async sendVerificationEmail(userId: string, email: string, name: string) {
    try {
      const raw = await this.tokens.issue(userId, 'email_verify', 24 * 60);
      const url = `${APP_URL}/verify-email?token=${encodeURIComponent(raw)}`;
      await this.email.sendVerifyEmail(email, name, url);
    } catch {
      // Never let email issues break the surrounding action.
    }
  }

  /** Consume a verify token → stamp emailVerified. Idempotent-ish. */
  async verifyEmail(token: string) {
    const userId = await this.tokens.consume('email_verify', token);
    if (!userId) throw new BadRequestException('This verification link is invalid or has expired.');
    await this.prisma.user.update({ where: { id: userId }, data: { emailVerified: new Date() } });
    return { ok: true };
  }

  /** Re-send the verification email to the signed-in user. */
  async resendVerification(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user || user.deletedAt) throw new BadRequestException('Account not found.');
    if (user.emailVerified) return { ok: true, alreadyVerified: true };
    const name = await this.displayName(userId, user.email);
    await this.sendVerificationEmail(userId, user.email, name);
    return { ok: true };
  }

  // ---------- Password reset ----------

  /**
   * Always returns ok (never reveals whether the email exists). When it does,
   * issues a reset token + emails the link.
   */
  async forgotPassword(email: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (user && !user.deletedAt && user.passwordHash) {
      try {
        const raw = await this.tokens.issue(user.id, 'password_reset', 60);
        const url = `${APP_URL}/reset-password?token=${encodeURIComponent(raw)}`;
        const name = await this.displayName(user.id, user.email);
        await this.email.sendPasswordReset(user.email, name, url);
      } catch {
        // swallow — don't leak failure timing
      }
    }
    return { ok: true };
  }

  /** Consume a reset token → set a new password. */
  async resetPassword(token: string, newPassword: string) {
    const userId = await this.tokens.consume('password_reset', token);
    if (!userId) throw new BadRequestException('This reset link is invalid or has expired.');
    const passwordHash = await bcrypt.hash(newPassword, 10);
    await this.prisma.user.update({ where: { id: userId }, data: { passwordHash } });
    return { ok: true };
  }

  /** Change password for a signed-in user (requires the current password). */
  async changePassword(userId: string, currentPassword: string, newPassword: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new BadRequestException('Account not found.');
    if (!user.passwordHash) {
      throw new BadRequestException(
        'Your account has no password (you signed in with Google/GitHub). Use "Forgot password" to set one.',
      );
    }
    const ok = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!ok) throw new BadRequestException('Current password is incorrect.');
    const passwordHash = await bcrypt.hash(newPassword, 10);
    await this.prisma.user.update({ where: { id: userId }, data: { passwordHash } });
    return { ok: true };
  }

  /** Best-effort human name for emails across profile types. */
  private async displayName(userId: string, fallback: string): Promise<string> {
    const [student, recruiter, tpo] = await Promise.all([
      this.prisma.studentProfile.findUnique({ where: { userId }, select: { fullName: true } }),
      this.prisma.recruiterProfile.findUnique({ where: { userId }, select: { fullName: true } }),
      this.prisma.institutionAdminProfile.findUnique({
        where: { userId },
        select: { fullName: true },
      }),
    ]);
    return student?.fullName ?? recruiter?.fullName ?? tpo?.fullName ?? fallback;
  }

  async login(input: { email: string; password: string }) {
    const user = await this.prisma.user.findUnique({ where: { email: input.email } });
    if (!user || !user.passwordHash || user.deletedAt) {
      throw new UnauthorizedException('Invalid credentials');
    }
    const ok = await bcrypt.compare(input.password, user.passwordHash);
    if (!ok) throw new UnauthorizedException('Invalid credentials');
    return this.issueTokens(user);
  }

  async syncOAuthUser(input: OAuthSyncDto) {
    let user = await this.prisma.user.findUnique({ where: { email: input.email } });
    if (user?.deletedAt) {
      // Refuse to re-activate a deleted account via OAuth — the user must
      // sign up fresh (anonymized email collisions are impossible because
      // the email was rewritten on delete).
      throw new UnauthorizedException('This account is no longer active.');
    }
    if (!user) {
      // Create the student even when we can't resolve an institution from the
      // email domain (personal Gmail, etc.). They land in the onboarding gate,
      // which forces institution + college-ID before the dashboard unlocks — so
      // OAuth works for everyone WITHOUT bypassing verification. A Workspace-for-
      // Education email pre-fills the institution as a convenience.
      const institution = await this.resolveInstitution(input.email);
      const slug = await this.generateSlug(input.fullName);
      user = await this.prisma.user.create({
        data: {
          email: input.email,
          role: 'STUDENT',
          institutionId: institution?.id ?? null,
          emailVerified: new Date(),
          studentProfile: {
            create: {
              fullName: input.fullName,
              governmentName: input.fullName,
              sharableSlug: slug,
              avatarUrl: input.avatarUrl ?? null,
              isPublic: true,
            },
          },
        },
      });
    }
    return this.issueTokens(user);
  }

  /**
   * Completes signup for an OAuth-created student: sets their institution,
   * college-ID, phone, institute email and course, then queues the AI
   * pre-screen — the same trust inputs an email/password signup collects. The
   * dashboard onboarding gate blocks access until this succeeds.
   */
  async completeOnboarding(userId: string, input: CompleteOnboardingInput) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { studentProfile: true },
    });
    if (!user || user.deletedAt) throw new UnauthorizedException('Account not found.');
    if (user.role !== 'STUDENT' || !user.studentProfile) {
      throw new BadRequestException('Only student accounts have an onboarding step.');
    }

    const institution = await this.prisma.institution.findUnique({
      where: { id: input.institutionId },
    });
    if (!institution) throw new BadRequestException('Selected institution does not exist.');
    this.assertInstituteEmailMatches(institution, input.instituteEmail);

    if (!input.collegeIdFileKey.startsWith('temp/college-ids/')) {
      throw new BadRequestException('Invalid college-ID upload key.');
    }
    const collegeIdUrl = this.storage.publicUrlFor(input.collegeIdFileKey);

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        institutionId: institution.id,
        studentProfile: {
          update: {
            governmentName: input.governmentName,
            phoneNumber: input.phoneNumber,
            instituteEmail: input.instituteEmail,
            courseProgram: input.courseProgram,
            collegeIdUrl,
            collegeIdUploadedAt: new Date(),
            collegeIdStatus: 'pending_review',
          },
        },
      },
    });

    // Fire-and-forget AI pre-screen (see signup() for the rationale).
    void this.queue
      .addNamed(
        QUEUE_NAMES.VERIFICATION_SCREEN,
        VERIFICATION_JOBS.SCREEN_COLLEGE_ID,
        { userId: user.id },
        { jobId: `screen-college-id-${user.id}` },
      )
      .catch(() => {});

    return { ok: true };
  }

  /**
   * When the institution has a domain on record, the institute email must be on
   * that domain or a subdomain of it (campus/dept subdomains are common). The
   * leading dot keeps it safe: "evilamrita.edu" doesn't match, only true
   * "*.amrita.edu" subdomains do. No domain on record → accept any email.
   */
  private assertInstituteEmailMatches(
    institution: { domain: string | null; name: string },
    instituteEmail: string,
  ) {
    if (!institution.domain) return;
    const emailDomain = instituteEmail.split('@')[1]?.toLowerCase();
    const instDomain = institution.domain.toLowerCase();
    const ok =
      !!emailDomain && (emailDomain === instDomain || emailDomain.endsWith('.' + instDomain));
    if (!ok) {
      throw new BadRequestException(
        `Institute email must be an @${institution.domain} address ` +
          `(a campus subdomain like @students.${institution.domain} is fine) for ${institution.name}.`,
      );
    }
  }

  async me(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { studentProfile: true, institution: true },
    });
    if (user?.deletedAt) return null;
    return user;
  }

  /**
   * Soft-delete a user. The row stays so their authored content
   * (comments, applications) doesn't break threads; identifying fields are
   * scrubbed and `deletedAt` is set. Login and OAuth paths refuse the
   * row from now on; any live JWT becomes effectively unusable on next
   * `me()` call because we return `null`.
   *
   * Email is rewritten to a sentinel address to free the unique constraint
   * if the same human ever wants to sign up fresh later.
   */
  async softDeleteAccount(userId: string) {
    const sentinelEmail = `deleted+${userId}@skillverify.invalid`;
    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: userId },
        data: {
          deletedAt: new Date(),
          email: sentinelEmail,
          passwordHash: null,
        },
      }),
      this.prisma.studentProfile.updateMany({
        where: { userId },
        data: {
          fullName: 'Deleted account',
          governmentName: null,
          phoneNumber: null,
          instituteEmail: null,
          headline: null,
          bio: null,
          avatarUrl: null,
          collegeIdUrl: null,
          resumeUrl: null,
          isPublic: false,
        },
      }),
    ]);
    return { ok: true };
  }

  private issueTokens(user: User) {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role as UserRole,
      institutionId: user.institutionId ?? null,
    };
    // The access token must outlive (or match) the NextAuth session (30d) —
    // there is no refresh flow yet, so a shorter TTL would silently 401 every
    // request mid-session. Revocation for deleted/banned users is handled in
    // JwtStrategy (deletedAt check). TODO: real refresh-token rotation to allow
    // a shorter access TTL again.
    return {
      accessToken: this.jwt.sign(payload, { expiresIn: '30d' }),
      refreshToken: this.jwt.sign(payload, { expiresIn: '30d' }),
      user: { id: user.id, email: user.email, role: user.role },
    };
  }

  private async resolveInstitution(email: string) {
    const host = email.split('@')[1]?.toLowerCase();
    if (!host) return null;
    // Try the full host, then strip the leftmost label progressively so a
    // campus/dept subdomain (ch.students.amrita.edu) resolves to its parent
    // institution domain (amrita.edu). Stops at the registrable 2-label domain.
    const parts = host.split('.');
    for (let i = 0; i < parts.length - 1; i++) {
      const candidate = parts.slice(i).join('.');
      const inst = await this.prisma.institution.findUnique({ where: { domain: candidate } });
      if (inst) return inst;
    }
    return null;
  }

  private async generateSlug(name: string) {
    const base = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 40);
    let candidate = base || `user-${Date.now()}`;
    let suffix = 0;

    while (true) {
      const clash = await this.prisma.studentProfile.findUnique({
        where: { sharableSlug: candidate },
      });
      if (!clash) return candidate;
      suffix += 1;
      candidate = `${base}-${suffix}`;
    }
  }
}

// Free email providers — a recruiter signing up with one of these doesn't get
// a company domain recorded (it's not a trust signal).
const FREE_EMAIL_DOMAINS = new Set([
  'gmail.com',
  'googlemail.com',
  'outlook.com',
  'hotmail.com',
  'live.com',
  'yahoo.com',
  'yahoo.co.in',
  'icloud.com',
  'proton.me',
  'protonmail.com',
  'rediffmail.com',
]);

function deriveCompanyDomain(email: string): string | null {
  const domain = email.split('@')[1]?.toLowerCase();
  if (!domain || FREE_EMAIL_DOMAINS.has(domain)) return null;
  return domain;
}
