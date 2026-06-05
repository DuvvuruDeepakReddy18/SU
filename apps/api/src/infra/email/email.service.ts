import { Injectable, Logger } from '@nestjs/common';
import { Resend } from 'resend';
import type { RejectionReason } from '@skillverify/shared';
import {
  collegeIdApprovedEmail,
  collegeIdRejectedEmail,
  marksheetApprovedEmail,
  marksheetRejectedEmail,
  recruiterApprovedEmail,
  recruiterRejectedEmail,
  recruiterInquiryReceivedEmail,
  inquiryAcceptedEmail,
  institutionAdminApprovedEmail,
  institutionAdminRejectedEmail,
  interviewerInvitedEmail,
  verifyEmailEmail,
  passwordResetEmail,
  welcomeEmail,
} from './email.templates';

/**
 * Transactional email service. Backed by Resend (resend.com — 3K/month free).
 * No-ops silently when RESEND_API_KEY is unset, so dev / CI runs unaffected.
 *
 * Every send is wrapped in try/catch — a failing email must never break the
 * user-facing action that triggered it (signup, admin approval, etc.).
 */
@Injectable()
export class EmailService {
  private readonly log = new Logger(EmailService.name);
  private readonly resend: Resend | null;
  private readonly from: string;

  constructor() {
    const apiKey = process.env.RESEND_API_KEY;
    // `from` must be a verified sender in Resend. Until you verify your
    // own domain, use the sandbox sender `onboarding@resend.dev` (works
    // out-of-the-box, but recipients see "via resend.dev" in the header).
    this.from = process.env.EMAIL_FROM ?? 'SkillVerify <onboarding@resend.dev>';
    if (!apiKey) {
      this.log.warn('RESEND_API_KEY not set — transactional emails are no-op.');
      this.resend = null;
      return;
    }
    this.resend = new Resend(apiKey);
  }

  private async send(to: string, subject: string, html: string) {
    if (!this.resend) {
      this.log.debug(`[skipped no-key] ${subject} → ${to}`);
      return;
    }
    try {
      const result = await this.resend.emails.send({
        from: this.from,
        to,
        subject,
        html,
      });
      if (result.error) {
        this.log.warn(`Resend send failed (${subject} → ${to}): ${result.error.message}`);
      }
    } catch (e) {
      this.log.warn(`Email exception (${subject} → ${to}): ${(e as Error).message}`);
    }
  }

  // ---------- public helpers, one per template ----------

  async sendWelcome(to: string, name: string) {
    const { subject, html } = welcomeEmail({ name });
    await this.send(to, subject, html);
  }

  async sendCollegeIdApproved(to: string, name: string) {
    const { subject, html } = collegeIdApprovedEmail({ name });
    await this.send(to, subject, html);
  }

  async sendCollegeIdRejected(
    to: string,
    name: string,
    reasonCode: RejectionReason,
    reasonNote: string | null,
  ) {
    const { subject, html } = collegeIdRejectedEmail({ name, reasonCode, reasonNote });
    await this.send(to, subject, html);
  }

  async sendMarksheetApproved(to: string, name: string, semester: number) {
    const { subject, html } = marksheetApprovedEmail({ name, semester });
    await this.send(to, subject, html);
  }

  async sendMarksheetRejected(
    to: string,
    name: string,
    semester: number,
    reasonCode: RejectionReason,
    reasonNote: string | null,
  ) {
    const { subject, html } = marksheetRejectedEmail({
      name,
      semester,
      reasonCode,
      reasonNote,
    });
    await this.send(to, subject, html);
  }

  async sendRecruiterApproved(to: string, name: string, companyName: string) {
    const { subject, html } = recruiterApprovedEmail({ name, companyName });
    await this.send(to, subject, html);
  }

  async sendRecruiterRejected(to: string, name: string, reason: string | null) {
    const { subject, html } = recruiterRejectedEmail({ name, reason });
    await this.send(to, subject, html);
  }

  async sendInquiryReceived(
    to: string,
    studentName: string,
    company: string,
    jobRole: string | null,
  ) {
    const { subject, html } = recruiterInquiryReceivedEmail({ studentName, company, jobRole });
    await this.send(to, subject, html);
  }

  async sendInquiryAccepted(to: string, recruiterName: string, studentName: string) {
    const { subject, html } = inquiryAcceptedEmail({ recruiterName, studentName });
    await this.send(to, subject, html);
  }

  async sendInstitutionAdminApproved(to: string, name: string, institution: string) {
    const { subject, html } = institutionAdminApprovedEmail({ name, institution });
    await this.send(to, subject, html);
  }

  async sendInstitutionAdminRejected(to: string, name: string, reason: string | null) {
    const { subject, html } = institutionAdminRejectedEmail({ name, reason });
    await this.send(to, subject, html);
  }

  async sendInterviewerInvited(to: string, name: string, tempPassword: string) {
    const { subject, html } = interviewerInvitedEmail({ name, email: to, tempPassword });
    await this.send(to, subject, html);
  }

  async sendVerifyEmail(to: string, name: string, url: string) {
    const { subject, html } = verifyEmailEmail({ name, url });
    await this.send(to, subject, html);
  }

  async sendPasswordReset(to: string, name: string, url: string) {
    const { subject, html } = passwordResetEmail({ name, url });
    await this.send(to, subject, html);
  }
}
