import { REJECTION_REASON_LABELS } from '@skillverify/shared';
import type { RejectionReason } from '@skillverify/shared';

/**
 * Plain string-template emails. No React/MJML/etc. — they'd add bundle
 * weight and a build step for 4 emails. When the template count grows past
 * ~10, swap to React Email.
 *
 * All renderers return { subject, html } and accept a strict input shape.
 */

const APP_URL = process.env.NEXTAUTH_URL ?? 'http://localhost:3000';

// Tiny reusable shell — keeps HTML/inline CSS in one place. Email clients
// strip <head> styles, so every rule must be inline.
function shell(opts: { previewText?: string; bodyHtml: string }): string {
  const preview = opts.previewText ?? '';
  return `<!doctype html>
<html><body style="margin:0;padding:0;background:#f6f7f8;font-family:system-ui,-apple-system,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#111827;">
  <span style="display:none;font-size:0;color:transparent;line-height:0;max-height:0;max-width:0;opacity:0;overflow:hidden;">${escape(preview)}</span>
  <table role="presentation" cellspacing="0" cellpadding="0" border="0" align="center" width="100%" style="max-width:560px;margin:32px auto;background:#ffffff;border-radius:14px;overflow:hidden;border:1px solid #e5e7eb;">
    <tr><td style="padding:24px 28px;border-bottom:1px solid #e5e7eb;background:linear-gradient(135deg,#10b981 0%,#06b6d4 100%);color:#fff;">
      <div style="font-weight:700;font-size:18px;letter-spacing:-0.01em;">SkillVerify</div>
      <div style="opacity:0.9;font-size:12px;margin-top:2px;">Verified skill portfolios for students</div>
    </td></tr>
    <tr><td style="padding:28px;">${opts.bodyHtml}</td></tr>
    <tr><td style="padding:18px 28px;border-top:1px solid #e5e7eb;background:#f9fafb;font-size:12px;color:#6b7280;">
      <a href="${APP_URL}" style="color:#10b981;text-decoration:none;">SkillVerify</a> · You're receiving this because of activity on your account.
    </td></tr>
  </table>
</body></html>`;
}

function ctaButton(label: string, href: string): string {
  return `<a href="${href}" style="display:inline-block;background:#10b981;color:#fff;text-decoration:none;padding:10px 18px;border-radius:8px;font-weight:600;font-size:14px;">${escape(label)}</a>`;
}

function escape(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// ---------- templates ----------

export function welcomeEmail(input: { name: string }) {
  return {
    subject: 'Welcome to SkillVerify — your account is live',
    html: shell({
      previewText: 'Your account is created. ID under review.',
      bodyHtml: `
        <h1 style="font-size:22px;margin:0 0 12px;">Hi ${escape(input.name)},</h1>
        <p style="font-size:15px;line-height:1.55;margin:0 0 16px;color:#374151;">
          Your SkillVerify account is live. We've received your college ID and our
          reviewers usually get to it within <strong>24 hours</strong>.
        </p>
        <p style="font-size:15px;line-height:1.55;margin:0 0 20px;color:#374151;">
          While you wait, head to your dashboard to add a skill, upload a semester
          marksheet, or solve your first practice problem.
        </p>
        <p style="margin:0 0 20px;">${ctaButton('Open your dashboard', `${APP_URL}/dashboard`)}</p>
        <p style="font-size:13px;line-height:1.55;color:#6b7280;margin:0;">
          Need help? Reply to this email or visit
          <a href="${APP_URL}/support" style="color:#10b981;">our support page</a>.
        </p>`,
    }),
  };
}

export function collegeIdApprovedEmail(input: { name: string }) {
  return {
    subject: 'Your college ID has been verified',
    html: shell({
      previewText: 'College ID approved — your profile is now reviewer-verified.',
      bodyHtml: `
        <h1 style="font-size:22px;margin:0 0 12px;">Hi ${escape(input.name)},</h1>
        <p style="font-size:15px;line-height:1.55;margin:0 0 16px;color:#374151;">
          Good news — your college ID was approved. Your SkillVerify profile now
          carries the <strong style="color:#059669;">reviewer-verified</strong>
          badge on every recruiter-facing surface.
        </p>
        <p style="margin:0 0 20px;">${ctaButton('View your profile', `${APP_URL}/dashboard/profile`)}</p>
        <p style="font-size:13px;line-height:1.55;color:#6b7280;margin:0;">
          Want to climb the verification ladder? Upload a semester marksheet
          (Layer 1) or connect GitHub (Layer 3) from the Verification Center.
        </p>`,
    }),
  };
}

export function collegeIdRejectedEmail(input: {
  name: string;
  reasonCode: RejectionReason;
  reasonNote: string | null;
}) {
  const reasonLabel = REJECTION_REASON_LABELS[input.reasonCode] ?? 'Other';
  return {
    subject: 'College ID review — action required',
    html: shell({
      previewText: 'We need a clearer college ID. Re-upload from the Verification Center.',
      bodyHtml: `
        <h1 style="font-size:22px;margin:0 0 12px;">Hi ${escape(input.name)},</h1>
        <p style="font-size:15px;line-height:1.55;margin:0 0 16px;color:#374151;">
          We weren't able to verify your college ID. Reason:
        </p>
        <div style="background:#fef2f2;border:1px solid #fecaca;border-radius:8px;padding:12px 14px;margin:0 0 16px;">
          <div style="font-weight:600;color:#991b1b;font-size:14px;">${escape(reasonLabel)}</div>
          ${
            input.reasonNote
              ? `<div style="margin-top:6px;color:#7f1d1d;font-size:13px;line-height:1.5;">${escape(input.reasonNote)}</div>`
              : ''
          }
        </div>
        <p style="font-size:15px;line-height:1.55;margin:0 0 20px;color:#374151;">
          Re-upload a clearer photo or PDF from the Verification Center — most
          re-submissions are reviewed within 24 hours.
        </p>
        <p style="margin:0 0 20px;">${ctaButton('Re-upload college ID', `${APP_URL}/dashboard/verifications`)}</p>`,
    }),
  };
}

export function marksheetApprovedEmail(input: { name: string; semester: number }) {
  return {
    subject: `Semester ${input.semester} marksheet verified`,
    html: shell({
      previewText: 'Your marksheet is verified. CGPA badge upgraded.',
      bodyHtml: `
        <h1 style="font-size:22px;margin:0 0 12px;">Hi ${escape(input.name)},</h1>
        <p style="font-size:15px;line-height:1.55;margin:0 0 16px;color:#374151;">
          Your semester <strong>${input.semester}</strong> marksheet was approved.
          Your CGPA on the dashboard now reads <strong style="color:#059669;">VERIFIED</strong>
          and counts toward Layer 1 (Academic).
        </p>
        <p style="margin:0 0 20px;">${ctaButton('View your verifications', `${APP_URL}/dashboard/verifications`)}</p>`,
    }),
  };
}

export function marksheetRejectedEmail(input: {
  name: string;
  semester: number;
  reasonCode: RejectionReason;
  reasonNote: string | null;
}) {
  const reasonLabel = REJECTION_REASON_LABELS[input.reasonCode] ?? 'Other';
  return {
    subject: `Semester ${input.semester} marksheet — action required`,
    html: shell({
      previewText: 'We need a clearer marksheet. Re-upload from the Verification Center.',
      bodyHtml: `
        <h1 style="font-size:22px;margin:0 0 12px;">Hi ${escape(input.name)},</h1>
        <p style="font-size:15px;line-height:1.55;margin:0 0 16px;color:#374151;">
          We weren't able to verify your semester <strong>${input.semester}</strong>
          marksheet. Reason:
        </p>
        <div style="background:#fef2f2;border:1px solid #fecaca;border-radius:8px;padding:12px 14px;margin:0 0 16px;">
          <div style="font-weight:600;color:#991b1b;font-size:14px;">${escape(reasonLabel)}</div>
          ${
            input.reasonNote
              ? `<div style="margin-top:6px;color:#7f1d1d;font-size:13px;line-height:1.5;">${escape(input.reasonNote)}</div>`
              : ''
          }
        </div>
        <p style="font-size:15px;line-height:1.55;margin:0 0 20px;color:#374151;">
          Re-upload a clearer scan from the Verification Center. Make sure the
          student name, institute, exam date, and SGPA/CGPA are all visible.
        </p>
        <p style="margin:0 0 20px;">${ctaButton('Re-upload marksheet', `${APP_URL}/dashboard/verifications`)}</p>`,
    }),
  };
}

export function recruiterApprovedEmail(input: { name: string; companyName: string }) {
  return {
    subject: 'Your SkillVerify recruiter account is approved',
    html: shell({
      previewText: 'You can now search verified students and post jobs.',
      bodyHtml: `
        <h1 style="font-size:22px;margin:0 0 12px;">Hi ${escape(input.name)},</h1>
        <p style="font-size:15px;line-height:1.55;margin:0 0 16px;color:#374151;">
          <strong>${escape(input.companyName)}</strong> is verified — your recruiter
          account is live. You can now search verified students by skill and
          verification layer, post jobs, and reach out to candidates.
        </p>
        <p style="font-size:15px;line-height:1.55;margin:0 0 20px;color:#374151;">
          Contact details stay private until a student accepts your message, so
          start by sharing what you're hiring for.
        </p>
        <p style="margin:0 0 20px;">${ctaButton('Open the company portal', `${APP_URL}/company`)}</p>`,
    }),
  };
}

export function recruiterInquiryReceivedEmail(input: {
  studentName: string;
  company: string;
  jobRole: string | null;
}) {
  return {
    subject: `${input.company} is interested in your profile`,
    html: shell({
      previewText: 'A verified company wants to connect. Review and respond.',
      bodyHtml: `
        <h1 style="font-size:22px;margin:0 0 12px;">Hi ${escape(input.studentName)},</h1>
        <p style="font-size:15px;line-height:1.55;margin:0 0 16px;color:#374151;">
          <strong>${escape(input.company)}</strong>, a verified company on SkillVerify, reached out
          about you${input.jobRole ? ` for a <strong>${escape(input.jobRole)}</strong> role` : ''}.
        </p>
        <p style="font-size:15px;line-height:1.55;margin:0 0 20px;color:#374151;">
          Your phone and email stay private until you choose to share them. Review the message and
          respond from your dashboard.
        </p>
        <p style="margin:0 0 20px;">${ctaButton('Review the request', `${APP_URL}/dashboard/recruiter-interest`)}</p>`,
    }),
  };
}

export function inquiryAcceptedEmail(input: { recruiterName: string; studentName: string }) {
  return {
    subject: `${input.studentName} shared their contact with you`,
    html: shell({
      previewText: 'A candidate accepted your request. Their contact is now unlocked.',
      bodyHtml: `
        <h1 style="font-size:22px;margin:0 0 12px;">Hi ${escape(input.recruiterName)},</h1>
        <p style="font-size:15px;line-height:1.55;margin:0 0 16px;color:#374151;">
          <strong>${escape(input.studentName)}</strong> accepted your message and shared their
          contact details. You can now see their phone and email on their profile.
        </p>
        <p style="margin:0 0 20px;">${ctaButton('Open the company portal', `${APP_URL}/company/messages`)}</p>`,
    }),
  };
}

export function institutionAdminApprovedEmail(input: { name: string; institution: string }) {
  return {
    subject: 'Your SkillVerify institution account is approved',
    html: shell({
      previewText: 'You can now manage your students and post campus drives.',
      bodyHtml: `
        <h1 style="font-size:22px;margin:0 0 12px;">Hi ${escape(input.name)},</h1>
        <p style="font-size:15px;line-height:1.55;margin:0 0 16px;color:#374151;">
          Your account for <strong>${escape(input.institution)}</strong> is verified. You can now
          see your students' verified profiles, post campus drives and competitions, and view
          placement analytics.
        </p>
        <p style="font-size:15px;line-height:1.55;margin:0 0 20px;color:#374151;">
          A note on trust: your account has <strong>read-only oversight</strong> of student
          verification — SkillVerify remains the verifying authority, so your placement stats stay
          credible to recruiters.
        </p>
        <p style="margin:0 0 20px;">${ctaButton('Open the institution portal', `${APP_URL}/institution`)}</p>`,
    }),
  };
}

export function institutionAdminRejectedEmail(input: { name: string; reason: string | null }) {
  return {
    subject: 'SkillVerify institution account — not approved',
    html: shell({
      previewText: 'We could not verify your institution account.',
      bodyHtml: `
        <h1 style="font-size:22px;margin:0 0 12px;">Hi ${escape(input.name)},</h1>
        <p style="font-size:15px;line-height:1.55;margin:0 0 16px;color:#374151;">
          We weren't able to approve your institution account at this time.
        </p>
        ${
          input.reason
            ? `<div style="background:#fef2f2;border:1px solid #fecaca;border-radius:8px;padding:12px 14px;margin:0 0 16px;">
                 <div style="color:#7f1d1d;font-size:13px;line-height:1.5;">${escape(input.reason)}</div>
               </div>`
            : ''
        }
        <p style="font-size:15px;line-height:1.55;margin:0 0 20px;color:#374151;">
          If you think this was a mistake, reply to this email from your official college address
          and we'll take another look.
        </p>`,
    }),
  };
}

export function interviewerInvitedEmail(input: {
  name: string;
  email: string;
  tempPassword: string;
}) {
  return {
    subject: "You're invited as a SkillVerify expert interviewer",
    html: shell({
      previewText: 'Your interviewer account is ready — sign in to claim interviews.',
      bodyHtml: `
        <h1 style="font-size:22px;margin:0 0 12px;">Hi ${escape(input.name)},</h1>
        <p style="font-size:15px;line-height:1.55;margin:0 0 16px;color:#374151;">
          You've been invited to conduct <strong>L4 expert interviews</strong> on SkillVerify — the
          top verification layer. Your account is ready.
        </p>
        <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:12px 14px;margin:0 0 16px;font-size:14px;">
          <div><strong>Email:</strong> ${escape(input.email)}</div>
          <div><strong>Temporary password:</strong> <code style="background:#eef2ff;padding:2px 6px;border-radius:4px;">${escape(input.tempPassword)}</code></div>
        </div>
        <p style="font-size:14px;line-height:1.55;margin:0 0 20px;color:#6b7280;">
          Sign in and claim interviews from the shared pool. Please change your password after your
          first sign-in.
        </p>
        <p style="margin:0 0 20px;">${ctaButton('Sign in', `${APP_URL}/login`)}</p>`,
    }),
  };
}

export function verifyEmailEmail(input: { name: string; url: string }) {
  return {
    subject: 'Verify your SkillVerify email',
    html: shell({
      previewText: 'Confirm your email to finish setting up your account.',
      bodyHtml: `
        <h1 style="font-size:22px;margin:0 0 12px;">Hi ${escape(input.name)},</h1>
        <p style="font-size:15px;line-height:1.55;margin:0 0 16px;color:#374151;">
          Please confirm this is your email so we can keep your SkillVerify account secure.
        </p>
        <p style="margin:0 0 20px;">${ctaButton('Verify email', input.url)}</p>
        <p style="font-size:13px;line-height:1.55;color:#6b7280;margin:0;">
          This link expires in 24 hours. If you didn't create a SkillVerify account, you can safely
          ignore this email.
        </p>`,
    }),
  };
}

export function passwordResetEmail(input: { name: string; url: string }) {
  return {
    subject: 'Reset your SkillVerify password',
    html: shell({
      previewText: 'Use this link to set a new password.',
      bodyHtml: `
        <h1 style="font-size:22px;margin:0 0 12px;">Hi ${escape(input.name)},</h1>
        <p style="font-size:15px;line-height:1.55;margin:0 0 16px;color:#374151;">
          We received a request to reset your password. Click below to choose a new one.
        </p>
        <p style="margin:0 0 20px;">${ctaButton('Reset password', input.url)}</p>
        <p style="font-size:13px;line-height:1.55;color:#6b7280;margin:0;">
          This link expires in 1 hour. If you didn't request this, ignore this email — your password
          won't change.
        </p>`,
    }),
  };
}

export function recruiterRejectedEmail(input: { name: string; reason: string | null }) {
  return {
    subject: 'SkillVerify recruiter account — not approved',
    html: shell({
      previewText: 'We could not verify your recruiter account.',
      bodyHtml: `
        <h1 style="font-size:22px;margin:0 0 12px;">Hi ${escape(input.name)},</h1>
        <p style="font-size:15px;line-height:1.55;margin:0 0 16px;color:#374151;">
          We weren't able to approve your recruiter account at this time.
        </p>
        ${
          input.reason
            ? `<div style="background:#fef2f2;border:1px solid #fecaca;border-radius:8px;padding:12px 14px;margin:0 0 16px;">
                 <div style="color:#7f1d1d;font-size:13px;line-height:1.5;">${escape(input.reason)}</div>
               </div>`
            : ''
        }
        <p style="font-size:15px;line-height:1.55;margin:0 0 20px;color:#374151;">
          If you think this was a mistake, reply to this email with your company
          details and we'll take another look.
        </p>`,
    }),
  };
}
