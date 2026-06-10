/* eslint-disable no-console */
import { PrismaClient } from '@prisma/client';

// Additively tag existing problems into Mathematics + Competitive Programming
// (the only sparse *gradeable* domains). Uses `connect`, NOT `set`, so the
// language-domain tags added by seed-curriculum are preserved.
const MATH_TOPICS = [
  'Math',
  'Mathematics',
  'Bit Manipulation',
  'Bitmask',
  'Number Theory',
  'Combinatorics',
  'Probability',
  'Geometry',
  'Modular Arithmetic',
  'Prime',
  'GCD',
];
const COMPETITIVE_TOPICS = [
  'DP',
  'Dynamic Programming',
  'Greedy',
  'Graphs',
  'Graph',
  'Shortest Path',
  'Segment Tree',
  'Backtracking',
  'Topological Sort',
  'Binary Search',
  'Sliding Window',
  'Two Pointers',
  'Monotonic Stack',
  'BFS',
  'DFS',
  'Trie',
  'Heap',
];

async function main() {
  const p = new PrismaClient();

  const doms = await p.practiceDomain.findMany({
    where: { slug: { in: ['mathematics', 'competitive-prog'] } },
  });
  const bySlug = Object.fromEntries(doms.map((d) => [d.slug, d.id]));
  if (!bySlug['mathematics'] || !bySlug['competitive-prog']) {
    throw new Error('Math/Competitive domains missing — run seed-domains first.');
  }

  // Topic distribution (to verify the keyword lists hit real data).
  const problems = await p.problem.findMany({
    select: { id: true, topics: true, difficulty: true },
  });
  const topicFreq = new Map<string, number>();
  for (const prob of problems)
    for (const t of prob.topics) topicFreq.set(t, (topicFreq.get(t) ?? 0) + 1);
  console.log(`\nTotal problems: ${problems.length}`);
  console.log('Top topics:', [...topicFreq.entries()].sort((a, b) => b[1] - a[1]).slice(0, 25));

  let math = 0;
  let comp = 0;
  for (const prob of problems) {
    const connect: { id: string }[] = [];
    if (prob.topics.some((t) => MATH_TOPICS.includes(t))) {
      connect.push({ id: bySlug['mathematics'] });
      math += 1;
    }
    if (prob.difficulty === 'hard' || prob.topics.some((t) => COMPETITIVE_TOPICS.includes(t))) {
      connect.push({ id: bySlug['competitive-prog'] });
      comp += 1;
    }
    if (connect.length) {
      await p.problem.update({ where: { id: prob.id }, data: { domains: { connect } } });
    }
  }
  console.log(`\nTagged: math +${math}, competitive +${comp}`);

  const counts = await p.practiceDomain.findMany({
    include: { _count: { select: { problems: true } } },
    orderBy: { sortOrder: 'asc' },
  });
  console.log('\nFinal domain counts:');
  for (const c of counts) console.log(`  ${c.slug.padEnd(24)} ${c._count.problems}`);

  await p.$disconnect();
}
main();
