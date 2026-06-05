export type EntryScores = { entryId: string; name: string; scores: number[] };

export type RankedEntry = {
  entryId: string;
  name: string;
  avg: number | null; // average jury score (1 dp), null until scored
  judgeCount: number;
  rank: number; // 1-based; unscored entries sort to the bottom
  advancing: boolean; // true if within the round's advanceCount
};

/**
 * Rank competition entries for a round by average jury score. Pure + exported
 * so the ranking/advancement rules are unit-testable without a DB:
 *   - average across the judges who scored each entry
 *   - higher average ranks first; entries with no scores sort last
 *   - the top `advanceCount` (by rank) advance; null = final round (none advance)
 */
export function rankEntries(entries: EntryScores[], advanceCount: number | null): RankedEntry[] {
  const withAvg = entries.map((e) => ({
    entryId: e.entryId,
    name: e.name,
    judgeCount: e.scores.length,
    avg: e.scores.length ? e.scores.reduce((a, b) => a + b, 0) / e.scores.length : null,
  }));

  withAvg.sort((a, b) => {
    if (a.avg === null && b.avg === null) return 0;
    if (a.avg === null) return 1; // unscored to the bottom
    if (b.avg === null) return -1;
    return b.avg - a.avg; // higher average first
  });

  return withAvg.map((e, i) => ({
    entryId: e.entryId,
    name: e.name,
    judgeCount: e.judgeCount,
    avg: e.avg === null ? null : Math.round(e.avg * 10) / 10,
    rank: i + 1,
    advancing: advanceCount != null && e.avg !== null && i < advanceCount,
  }));
}
