import { describe, it, expect } from 'vitest';
import { CANDIDATE_CARD_SELECT, toCandidateCard } from './recruiters.service';

/**
 * The candidate projection is the privacy boundary of the whole company
 * portal. If a PII field ever sneaks into the recruiter-facing select or the
 * card mapper, a recruiter can read student phone numbers / emails without the
 * student's consent. These tests fail loudly if that line is crossed.
 */
const FORBIDDEN_FIELDS = [
  'phoneNumber',
  'phone',
  'instituteEmail',
  'email',
  'resumeUrl',
  'collegeIdUrl',
  'collegeIdOcrExtracted',
  'governmentName',
  'passwordHash',
];

// Recursively collect every key referenced by a Prisma `select` object.
function collectSelectKeys(sel: Record<string, unknown>): string[] {
  const keys: string[] = [];
  for (const [k, v] of Object.entries(sel)) {
    keys.push(k);
    if (v && typeof v === 'object') {
      const obj = v as Record<string, unknown>;
      if (obj.select && typeof obj.select === 'object') {
        keys.push(...collectSelectKeys(obj.select as Record<string, unknown>));
      }
    }
  }
  return keys;
}

describe('candidate projection (PII boundary)', () => {
  it('CANDIDATE_CARD_SELECT never references a contact / PII field', () => {
    const keys = collectSelectKeys(CANDIDATE_CARD_SELECT as Record<string, unknown>);
    for (const forbidden of FORBIDDEN_FIELDS) {
      expect(keys, `select must not include "${forbidden}"`).not.toContain(forbidden);
    }
  });

  it('toCandidateCard output exposes no contact / PII keys', () => {
    const card = toCandidateCard({
      userId: 'u1',
      fullName: 'Asha Rao',
      headline: 'Frontend dev',
      bio: null,
      avatarUrl: null,
      sharableSlug: 'asha-rao',
      graduationYear: 2026,
      location: 'Bengaluru',
      courseProgram: 'B.Tech',
      cgpa: 8.4,
      user: {
        institution: { name: 'IIT Bombay' },
        userSkills: [
          { highestVerificationLayer: 'L3_PROVEN', skill: { name: 'React', category: 'frontend' } },
          { highestVerificationLayer: 'L1_ACADEMIC', skill: { name: 'SQL', category: 'data' } },
        ],
      },
    });
    const outKeys = Object.keys(card);
    for (const forbidden of FORBIDDEN_FIELDS) {
      expect(outKeys).not.toContain(forbidden);
    }
    // Sanity: the card still carries the useful, non-PII data.
    expect(card.institution).toBe('IIT Bombay');
    expect(card.topLayer).toBe('L3_PROVEN'); // max of the two skill layers
    expect(card.skills).toHaveLength(2);
  });
});
