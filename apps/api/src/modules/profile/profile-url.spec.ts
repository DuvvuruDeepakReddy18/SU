import { describe, it, expect } from 'vitest';
import { UpdateProfileSchema } from '@skillverify/shared';

/**
 * The per-field URL refinements are the last line of defense against the
 * cross-pasted-link class of bug — a LinkedIn URL silently saved under
 * `githubUrl` because both fields accept any string. These tests pin the
 * host whitelist for each known service.
 */
describe('UpdateProfileSchema URL refinements', () => {
  it('accepts a real LinkedIn URL on linkedinUrl', () => {
    const parsed = UpdateProfileSchema.safeParse({
      linkedinUrl: 'https://www.linkedin.com/in/foo',
    });
    expect(parsed.success).toBe(true);
  });

  it('rejects a github URL on linkedinUrl', () => {
    const parsed = UpdateProfileSchema.safeParse({
      linkedinUrl: 'https://github.com/foo',
    });
    expect(parsed.success).toBe(false);
  });

  it('accepts a subdomain of an allowed host', () => {
    const parsed = UpdateProfileSchema.safeParse({
      linkedinUrl: 'https://uk.linkedin.com/in/foo',
    });
    expect(parsed.success).toBe(true);
  });

  it('accepts gist.github.com on githubUrl', () => {
    const parsed = UpdateProfileSchema.safeParse({
      githubUrl: 'https://gist.github.com/foo/abc123',
    });
    expect(parsed.success).toBe(true);
  });

  it('rejects http schemes that are not http(s)', () => {
    const parsed = UpdateProfileSchema.safeParse({
      githubUrl: 'javascript:alert(1)',
    });
    expect(parsed.success).toBe(false);
  });

  it('accepts an empty / null URL field (optional)', () => {
    expect(UpdateProfileSchema.safeParse({ linkedinUrl: null }).success).toBe(true);
    expect(UpdateProfileSchema.safeParse({ linkedinUrl: '' }).success).toBe(true);
  });
});
