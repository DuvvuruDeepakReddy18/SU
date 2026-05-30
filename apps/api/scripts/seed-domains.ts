/* eslint-disable no-console */
import { PrismaClient } from '@prisma/client';

// 17 practice domains mirroring SkillVaults categories. We tag existing
// problems into one or more domains based on their `topics` field.
const DOMAINS = [
  {
    slug: 'algorithms',
    name: 'Algorithms',
    icon: 'Cpu',
    sortOrder: 1,
    topics: [
      'Sorting',
      'Searching',
      'Greedy',
      'DP',
      'Recursion',
      'Backtracking',
      'Two Pointers',
      'Sliding Window',
      'Topological Sort',
      'Shortest Path',
      'Binary Search',
      'BFS',
      'DFS',
      'Monotonic Stack',
    ],
  },
  {
    slug: 'data-structures',
    name: 'Data Structures',
    icon: 'GitBranch',
    sortOrder: 2,
    topics: [
      'Arrays',
      'Strings',
      'Linked Lists',
      'Trees',
      'Graphs',
      'Hashing',
      'Stack',
      'Queue',
      'Heap',
      'Trie',
      'BST',
      'Design',
    ],
  },
  {
    slug: 'mathematics',
    name: 'Mathematics',
    icon: 'Calculator',
    sortOrder: 3,
    topics: ['Math', 'Bit Manipulation'],
  },
  {
    slug: 'artificial-intelligence',
    name: 'Artificial Intelligence',
    icon: 'Brain',
    sortOrder: 4,
    topics: [],
  },
  { slug: 'python', name: 'Python', icon: 'FileCode', sortOrder: 5, topics: [] },
  { slug: 'java', name: 'Java', icon: 'Coffee', sortOrder: 6, topics: [] },
  { slug: 'javascript', name: 'JavaScript', icon: 'Braces', sortOrder: 5.5, topics: [] },
  { slug: 'c', name: 'C', icon: 'Terminal', sortOrder: 7, topics: [] },
  { slug: 'cpp', name: 'C++', icon: 'Code', sortOrder: 8, topics: [] },
  { slug: 'sql', name: 'SQL', icon: 'Database', sortOrder: 9, topics: [] },
  { slug: 'databases', name: 'Databases', icon: 'HardDrive', sortOrder: 10, topics: [] },
  { slug: 'linux-shell', name: 'Linux Shell', icon: 'Terminal', sortOrder: 11, topics: [] },
  { slug: 'functional-prog', name: 'Functional Prog.', icon: 'Sigma', sortOrder: 12, topics: [] },
  { slug: 'regex', name: 'Regex', icon: 'Search', sortOrder: 13, topics: [] },
  { slug: 'react', name: 'React', icon: 'Atom', sortOrder: 14, topics: [] },
  { slug: 'ruby', name: 'Ruby', icon: 'Gem', sortOrder: 15, topics: [] },
  { slug: 'data-science', name: 'Data Science', icon: 'BarChart', sortOrder: 16, topics: [] },
  {
    slug: 'competitive-prog',
    name: 'Competitive Prog.',
    icon: 'Trophy',
    sortOrder: 17,
    topics: ['DP', 'Greedy', 'Graphs', 'Math'],
  },
];

async function main() {
  const p = new PrismaClient();

  for (const d of DOMAINS) {
    await p.practiceDomain.upsert({
      where: { slug: d.slug },
      update: { name: d.name, icon: d.icon, sortOrder: d.sortOrder },
      create: { slug: d.slug, name: d.name, icon: d.icon, sortOrder: d.sortOrder },
    });
  }
  console.log(`seeded ${DOMAINS.length} practice domains`);

  // Tag problems by topic overlap. Every problem also goes into "algorithms"
  // and "data-structures" by default (they're broad catch-alls).
  const algorithms = await p.practiceDomain.findUnique({ where: { slug: 'algorithms' } });
  const dataStructures = await p.practiceDomain.findUnique({ where: { slug: 'data-structures' } });
  const competitive = await p.practiceDomain.findUnique({ where: { slug: 'competitive-prog' } });
  const math = await p.practiceDomain.findUnique({ where: { slug: 'mathematics' } });

  const problems = await p.problem.findMany();
  let tagged = 0;
  for (const prob of problems) {
    const domainIds = new Set<string>();
    if (algorithms) domainIds.add(algorithms.id);
    if (dataStructures) domainIds.add(dataStructures.id);
    if (prob.topics.some((t) => ['Math', 'Bit Manipulation'].includes(t)) && math) {
      domainIds.add(math.id);
    }
    if (prob.difficulty === 'hard' && competitive) {
      domainIds.add(competitive.id);
    }
    await p.problem.update({
      where: { id: prob.id },
      data: { domains: { set: [...domainIds].map((id) => ({ id })) } },
    });
    tagged += 1;
  }
  console.log(`tagged ${tagged} problems into domains`);

  await p.$disconnect();
}
main();
