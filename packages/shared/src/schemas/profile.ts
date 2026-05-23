import { z } from 'zod';

const urlOrEmpty = z
  .string()
  .max(500)
  .nullable()
  .optional()
  .refine((v) => !v || /^https?:\/\//i.test(v), 'Must start with http(s)://');

export const UpdateProfileSchema = z.object({
  fullName: z.string().min(1).max(120).optional(),
  headline: z.string().max(200).nullable().optional(),
  bio: z.string().max(2000).nullable().optional(),
  phone: z.string().max(30).nullable().optional(),
  location: z.string().max(120).nullable().optional(),
  cgpa: z.number().min(0).max(10).nullable().optional(),
  graduationYear: z.number().int().min(2000).max(2100).nullable().optional(),
  linkedinUrl: urlOrEmpty,
  githubUrl: urlOrEmpty,
  leetcodeUrl: urlOrEmpty,
  codechefUrl: urlOrEmpty,
  portfolioUrl: urlOrEmpty,
  isPublic: z.boolean().optional(),
});
export type UpdateProfileInput = z.infer<typeof UpdateProfileSchema>;

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
