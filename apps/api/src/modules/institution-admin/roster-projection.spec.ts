import { describe, it, expect } from 'vitest';
import { ROSTER_SELECT, toRosterRow } from './institution-admin.service';

/**
 * The TPO roster is read-only oversight: a TPO sees verification + academic
 * status but NOT a student's personal contact (phone / login email). These
 * tests fail if a contact field ever sneaks into the roster projection.
 */
const FORBIDDEN_FIELDS = [
  'phoneNumber',
  'phone',
  'instituteEmail',
  'email',
  'resumeUrl',
  'collegeIdUrl',
  'governmentName',
  'passwordHash',
];

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

describe('roster projection (PII boundary)', () => {
  it('ROSTER_SELECT never references a contact / PII field', () => {
    const keys = collectSelectKeys(ROSTER_SELECT as Record<string, unknown>);
    for (const forbidden of FORBIDDEN_FIELDS) {
      expect(keys, `select must not include "${forbidden}"`).not.toContain(forbidden);
    }
  });

  it('toRosterRow exposes verification status but no contact keys', () => {
    const row = toRosterRow({
      userId: 'u1',
      fullName: 'Asha Rao',
      headline: null,
      avatarUrl: null,
      sharableSlug: 'asha-rao',
      graduationYear: 2026,
      courseProgram: 'B.Tech',
      cgpa: 8.4,
      cgpaVerifiedAt: new Date(),
      collegeIdStatus: 'verified',
      user: {
        userSkills: [
          { highestVerificationLayer: 'L3_PROVEN', skill: { name: 'React' } },
          { highestVerificationLayer: 'L2_CERTIFIED', skill: { name: 'AWS' } },
        ],
      },
    });
    const outKeys = Object.keys(row);
    for (const forbidden of FORBIDDEN_FIELDS) {
      expect(outKeys).not.toContain(forbidden);
    }
    expect(row.cgpaVerified).toBe(true);
    expect(row.collegeIdStatus).toBe('verified');
    expect(row.topLayer).toBe('L3_PROVEN');
  });
});
