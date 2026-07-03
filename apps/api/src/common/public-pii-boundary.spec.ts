import { describe, it, expect } from 'vitest';
import { PUBLIC_PROFILE_SELECT } from '../modules/profile/profile.service';
import {
  FREELANCE_LIST_PROVIDER_SELECT,
  FREELANCE_DETAIL_PROVIDER_SELECT,
} from '../modules/freelance/freelance.service';

/**
 * Privacy boundary for the unauthenticated surface. Every @Public() endpoint
 * that returns user-owned data must project through an explicit `select`, never
 * a blanket `include` that drags the whole User / StudentProfile row (and its
 * PII) onto the wire. These tests walk each public projection and fail loudly
 * if a PII / secret field ever appears — the exact class of bug that leaked
 * governmentName + the User passwordHash from /profile/public and /freelance.
 *
 * When you add a new @Public() endpoint that returns user data, extract its
 * projection into an exported `select` const and add it to PUBLIC_PROJECTIONS.
 */
const FORBIDDEN_FIELDS = [
  'passwordHash',
  'email',
  'phoneNumber',
  'phone',
  'instituteEmail',
  'governmentName',
  'resumeUrl',
  'collegeIdUrl',
  'collegeIdOcrExtracted',
  'collegeIdRejectionReason',
  'geoLat',
  'geoLng',
  'deletedAt',
];

// Recursively collect every key a Prisma projection selects, descending into
// both `select` and `include` sub-objects. Filter clauses (`where`, `orderBy`,
// `take`) are intentionally NOT descended — they reference columns for
// filtering, not for selection onto the response.
function collectSelectedKeys(node: Record<string, unknown>): string[] {
  const keys: string[] = [];
  for (const [k, v] of Object.entries(node)) {
    keys.push(k);
    if (v && typeof v === 'object') {
      const obj = v as Record<string, unknown>;
      if (obj.select && typeof obj.select === 'object') {
        keys.push(...collectSelectedKeys(obj.select as Record<string, unknown>));
      }
      if (obj.include && typeof obj.include === 'object') {
        keys.push(...collectSelectedKeys(obj.include as Record<string, unknown>));
      }
    }
  }
  return keys;
}

const PUBLIC_PROJECTIONS: Record<string, Record<string, unknown>> = {
  'GET /profile/public/:slug': PUBLIC_PROFILE_SELECT,
  'GET /freelance/services (provider)': FREELANCE_LIST_PROVIDER_SELECT,
  'GET /freelance/services/:id (provider)': FREELANCE_DETAIL_PROVIDER_SELECT,
};

describe('public endpoint PII boundary', () => {
  for (const [name, projection] of Object.entries(PUBLIC_PROJECTIONS)) {
    it(`${name} never selects a PII / secret field`, () => {
      const keys = collectSelectedKeys(projection);
      for (const forbidden of FORBIDDEN_FIELDS) {
        expect(keys, `${name} must not select "${forbidden}"`).not.toContain(forbidden);
      }
    });
  }
});
