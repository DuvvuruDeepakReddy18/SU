import { describe, it, expect } from 'vitest';
import { rankEntries } from './competition-ranking';

describe('rankEntries', () => {
  it('averages judge scores and ranks highest first', () => {
    const out = rankEntries(
      [
        { entryId: 'a', name: 'A', scores: [80, 90] }, // avg 85
        { entryId: 'b', name: 'B', scores: [100, 70] }, // avg 85 (tie, stable)
        { entryId: 'c', name: 'C', scores: [60] }, // avg 60
      ],
      null,
    );
    expect(out.map((e) => e.entryId)).toEqual(['a', 'b', 'c']);
    expect(out[0].avg).toBe(85);
    expect(out[2].avg).toBe(60);
    expect(out.map((e) => e.rank)).toEqual([1, 2, 3]);
  });

  it('sorts unscored entries to the bottom with null avg', () => {
    const out = rankEntries(
      [
        { entryId: 'a', name: 'A', scores: [] },
        { entryId: 'b', name: 'B', scores: [50] },
      ],
      null,
    );
    expect(out[0].entryId).toBe('b');
    expect(out[1].entryId).toBe('a');
    expect(out[1].avg).toBeNull();
    expect(out[1].judgeCount).toBe(0);
  });

  it('marks the top advanceCount as advancing', () => {
    const out = rankEntries(
      [
        { entryId: 'a', name: 'A', scores: [90] },
        { entryId: 'b', name: 'B', scores: [80] },
        { entryId: 'c', name: 'C', scores: [70] },
      ],
      2,
    );
    expect(out.filter((e) => e.advancing).map((e) => e.entryId)).toEqual(['a', 'b']);
    expect(out[2].advancing).toBe(false);
  });

  it('never advances an unscored entry even if within the cutoff', () => {
    const out = rankEntries(
      [
        { entryId: 'a', name: 'A', scores: [90] },
        { entryId: 'b', name: 'B', scores: [] }, // unscored
      ],
      2, // cutoff would include index 1, but it's unscored
    );
    expect(out[0].advancing).toBe(true);
    expect(out[1].advancing).toBe(false);
  });

  it('advances no one on a final round (advanceCount null)', () => {
    const out = rankEntries([{ entryId: 'a', name: 'A', scores: [99] }], null);
    expect(out[0].advancing).toBe(false);
  });

  it('rounds the average to one decimal place', () => {
    const out = rankEntries([{ entryId: 'a', name: 'A', scores: [10, 10, 11] }], null); // 10.333
    expect(out[0].avg).toBe(10.3);
  });
});
