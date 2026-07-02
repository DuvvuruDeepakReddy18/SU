import { z } from 'zod';

/**
 * Builds a URL refinement that restricts the URL's hostname to the given
 * list of allowed domains (suffix match — e.g. "github.com" matches
 * "www.github.com" or "gist.github.com").
 *
 * Returns a schema that:
 *  - accepts null / undefined / empty string (field is optional)
 *  - requires http(s):// prefix
 *  - matches one of the allowed hosts
 *  - has a friendly error message naming the expected service
 */
function urlForService(
  serviceLabel: string,
  allowedHosts: string[],
): z.ZodEffects<z.ZodNullable<z.ZodOptional<z.ZodString>>> {
  return z
    .string()
    .max(500)
    .optional()
    .nullable()
    .refine(
      (v) => {
        if (!v) return true;
        try {
          const url = new URL(v);
          if (!/^https?:$/.test(url.protocol)) return false;
          const host = url.hostname.toLowerCase();
          return allowedHosts.some((h) => host === h || host.endsWith(`.${h}`));
        } catch {
          return false;
        }
      },
      `This doesn't look like a ${serviceLabel} URL. Expected one of: ${allowedHosts.join(', ')}`,
    );
}

// Generic URL field — must be http(s) but the hostname is unrestricted.
const urlOrEmpty = z
  .string()
  .max(500)
  .nullable()
  .optional()
  .refine((v) => {
    if (!v) return true;
    try {
      const url = new URL(v);
      return /^https?:$/.test(url.protocol);
    } catch {
      return false;
    }
  }, 'Must be a valid http(s) URL');

export const PROFILE_LINK_HOSTS = {
  linkedin: ['linkedin.com', 'lnkd.in'],
  github: ['github.com'],
  leetcode: ['leetcode.com'],
  codechef: ['codechef.com'],
  codeforces: ['codeforces.com'],
  hackerrank: ['hackerrank.com'],
  hackerearth: ['hackerearth.com'],
  unstop: ['unstop.com'],
  kaggle: ['kaggle.com'],
  behance: ['behance.net'],
  dribbble: ['dribbble.com'],
} as const;

export const UpdateProfileSchema = z.object({
  fullName: z.string().min(1).max(120).optional(),
  headline: z.string().max(200).nullable().optional(),
  bio: z.string().max(2000).nullable().optional(),
  phoneNumber: z.string().max(30).nullable().optional(),
  location: z.string().max(120).nullable().optional(),
  cgpa: z.number().min(0).max(10).nullable().optional(),
  graduationYear: z.number().int().min(2000).max(2100).nullable().optional(),
  linkedinUrl: urlForService('LinkedIn', [...PROFILE_LINK_HOSTS.linkedin]),
  githubUrl: urlForService('GitHub', [...PROFILE_LINK_HOSTS.github]),
  leetcodeUrl: urlForService('LeetCode', [...PROFILE_LINK_HOSTS.leetcode]),
  codechefUrl: urlForService('CodeChef', [...PROFILE_LINK_HOSTS.codechef]),
  // Portfolio is the user's own site — accept any https URL.
  portfolioUrl: urlOrEmpty,
  customLinks: z
    .array(
      z.object({
        label: z.string().min(1).max(60),
        url: z.string().url(),
        icon: z.string().max(40).optional(),
      }),
    )
    .max(20)
    .optional(),
  isPublic: z.boolean().optional(),
  // Public-portfolio customization
  shareTheme: z.enum(['default', 'midnight', 'minimal']).optional(),
  shareSectionsOrder: z
    .array(z.enum(['about', 'skills', 'projects', 'certifications']))
    .min(1)
    .max(4)
    .optional(),
  // Onboarding wizard progress (0..4). The wizard component itself bumps this.
  onboardingStep: z.number().int().min(0).max(4).optional(),
});
export type UpdateProfileInput = z.infer<typeof UpdateProfileSchema>;

export const SHARE_SECTIONS = ['about', 'skills', 'projects', 'certifications'] as const;
export type ShareSection = (typeof SHARE_SECTIONS)[number];
export const SHARE_THEMES = ['default', 'midnight', 'minimal'] as const;
export type ShareTheme = (typeof SHARE_THEMES)[number];

// ---------- Resume parse schema ----------
// Designed to be FORGIVING. Free models often return slightly off-shape data
// (numbers as strings, strings as objects, arrays of bullet objects instead
// of arrays of strings). We coerce/normalize aggressively at the schema layer
// so a single weird field doesn't blow up the whole parse.

// Accept string OR number OR null → coerce to nullable string.
const looseString = z.preprocess((v) => {
  if (v == null) return null;
  if (typeof v === 'string') return v.trim() || null;
  if (typeof v === 'number' || typeof v === 'boolean') return String(v);
  return null;
}, z.string().nullable());

// Accept number OR numeric string OR null → coerce to nullable number.
const looseNumber = z.preprocess((v) => {
  if (v == null) return null;
  if (typeof v === 'number' && !Number.isNaN(v)) return v;
  if (typeof v === 'string') {
    const n = parseFloat(v);
    return Number.isFinite(n) ? n : null;
  }
  return null;
}, z.number().nullable());

const looseIntYear = z.preprocess((v) => {
  if (v == null) return null;
  if (typeof v === 'number') return Math.round(v);
  if (typeof v === 'string') {
    const m = v.match(/\d{4}/);
    return m ? parseInt(m[0], 10) : null;
  }
  return null;
}, z.number().int().nullable());

// Skills can come as ["Python", "TS"] OR [{ name: "Python" }] OR even a single
// comma-separated string. Normalize to string[].
const looseSkills = z.preprocess((v) => {
  if (Array.isArray(v)) {
    return v
      .map((s) => {
        if (typeof s === 'string') return s.trim();
        if (s && typeof s === 'object') {
          const obj = s as Record<string, unknown>;
          return String(obj.name ?? obj.skill ?? obj.title ?? '').trim();
        }
        return '';
      })
      .filter(Boolean);
  }
  if (typeof v === 'string')
    return v
      .split(/[,;|]/)
      .map((s) => s.trim())
      .filter(Boolean);
  return [];
}, z.array(z.string()).default([]));

// Project/experience descriptions sometimes arrive as arrays of bullet strings.
// Collapse to a single multiline string.
const looseDescription = z.preprocess((v) => {
  if (v == null) return null;
  if (typeof v === 'string') return v.trim() || null;
  if (Array.isArray(v)) {
    return v.map((s) => (typeof s === 'string' ? s : JSON.stringify(s))).join('\n') || null;
  }
  if (typeof v === 'object') return JSON.stringify(v);
  return String(v);
}, z.string().nullable());

export const ResumeParseSchema = z.object({
  fullName: looseString,
  headline: looseString,
  bio: looseString,
  email: looseString,
  phone: looseString,
  location: looseString,
  linkedinUrl: looseString.optional(),
  githubUrl: looseString.optional(),
  leetcodeUrl: looseString.optional(),
  codechefUrl: looseString.optional(),
  portfolioUrl: looseString.optional(),
  education: z
    .array(
      z.object({
        institution: z.preprocess((v) => String(v ?? '').trim(), z.string()),
        degree: looseString,
        startYear: looseIntYear,
        endYear: looseIntYear,
        cgpa: looseNumber,
      }),
    )
    .default([]),
  skills: looseSkills,
  projects: z
    .array(
      z.object({
        title: z.preprocess((v) => String(v ?? '').trim(), z.string()),
        description: looseDescription,
        techStack: looseSkills,
        repoUrl: looseString,
        liveUrl: looseString,
      }),
    )
    .default([]),
  experience: z
    .array(
      z.object({
        company: z.preprocess((v) => String(v ?? '').trim(), z.string()),
        role: looseString,
        startDate: looseString,
        endDate: looseString,
        description: looseDescription,
      }),
    )
    .default([]),
  certifications: z
    .array(
      z.object({
        issuer: z.preprocess((v) => String(v ?? '').trim(), z.string()),
        courseName: z.preprocess((v) => String(v ?? '').trim(), z.string()),
        issuedAt: looseString,
      }),
    )
    .default([]),
});
export type ResumeParseResult = z.infer<typeof ResumeParseSchema>;
