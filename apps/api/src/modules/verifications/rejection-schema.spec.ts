import { describe, it, expect } from 'vitest';
import { RejectActionSchema, REJECTION_REASONS } from '@skillverify/shared';

/**
 * The reviewer UI passes one of these enums plus an optional free-text
 * note. The API uses RejectActionSchema as the single source of truth for
 * both — drift here means a new reason on the frontend silently fails
 * server validation, or vice versa. Pin the contract.
 */
describe('RejectActionSchema', () => {
  it('accepts every enum value with no note', () => {
    for (const reasonCode of REJECTION_REASONS) {
      const parsed = RejectActionSchema.safeParse({ reasonCode });
      expect(parsed.success).toBe(true);
    }
  });

  it('accepts an optional note up to 500 chars', () => {
    const parsed = RejectActionSchema.safeParse({
      reasonCode: 'BLURRY_IMAGE',
      reasonNote: 'a'.repeat(500),
    });
    expect(parsed.success).toBe(true);
  });

  it('rejects an over-long note', () => {
    const parsed = RejectActionSchema.safeParse({
      reasonCode: 'BLURRY_IMAGE',
      reasonNote: 'a'.repeat(501),
    });
    expect(parsed.success).toBe(false);
  });

  it('rejects unknown reason codes', () => {
    const parsed = RejectActionSchema.safeParse({ reasonCode: 'NOT_A_REAL_REASON' });
    expect(parsed.success).toBe(false);
  });

  it('rejects missing reasonCode', () => {
    const parsed = RejectActionSchema.safeParse({ reasonNote: 'looks off' });
    expect(parsed.success).toBe(false);
  });
});
