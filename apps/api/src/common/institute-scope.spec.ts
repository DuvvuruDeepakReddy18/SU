import { describe, it, expect } from 'vitest';
import { instituteScopeAllows } from './institute-scope';

describe('instituteScopeAllows', () => {
  it('allows anyone for public resources', () => {
    expect(instituteScopeAllows('public', 'inst_a', 'inst_b')).toBe(true);
    expect(instituteScopeAllows('public', 'inst_a', null)).toBe(true);
  });

  it('allows a matching institution for institute-only resources', () => {
    expect(instituteScopeAllows('institute_only', 'inst_a', 'inst_a')).toBe(true);
  });

  it('blocks a different institution for institute-only resources', () => {
    expect(instituteScopeAllows('institute_only', 'inst_a', 'inst_b')).toBe(false);
  });

  it('blocks a student with no institution for institute-only resources', () => {
    expect(instituteScopeAllows('institute_only', 'inst_a', null)).toBe(false);
  });

  it('blocks when the resource has no institution set (institute-only)', () => {
    expect(instituteScopeAllows('institute_only', null, 'inst_a')).toBe(false);
    expect(instituteScopeAllows('institute_only', null, null)).toBe(false);
  });
});
