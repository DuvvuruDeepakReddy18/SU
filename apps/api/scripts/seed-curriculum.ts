/* eslint-disable no-console */
// Seeds the 100-exercise universal curriculum.
// Each exercise becomes ONE Problem with starter code for all 4 supported
// languages (python, javascript, c, cpp). The student picks a language in
// the editor. Java starters are also generated and stored under .java even
// though the practice runner currently only auto-grades python/javascript.
//
// Each problem is tagged into ALL relevant language domains, so when a
// student opens the Python (or Java, or C++) domain they see this whole
// curriculum.

import { PrismaClient } from '@prisma/client';
import { CURRICULUM } from './curriculum-data';
import { CURRICULUM_V2 } from './curriculum-data-v2';
import { CURRICULUM_V3 } from './curriculum-data-v3';

// Single combined set — v1 + v2 + v3 additions. Slugs are namespaced
// (curr- / curr2- / curr3-) so there's no collision risk.
const ALL_EXERCISES = [...CURRICULUM, ...CURRICULUM_V2, ...CURRICULUM_V3];

const DIFFICULTY_POINTS = { easy: 5, medium: 12, hard: 25 } as const;

async function main() {
  const p = new PrismaClient();

  // Look up the language domains we want to tag into.
  const wantedSlugs = ['python', 'javascript', 'c', 'cpp', 'java'];
  const langDomains = await p.practiceDomain.findMany({
    where: { slug: { in: wantedSlugs } },
  });
  if (langDomains.length === 0) {
    throw new Error('Run seed-domains.ts first — no language practice domains found.');
  }
  const bySlug = new Map(langDomains.map((d) => [d.slug, d]));
  console.log('Will tag into domains:', wantedSlugs.filter((s) => bySlug.has(s)).join(', '));

  let created = 0;
  let updated = 0;

  for (const ex of ALL_EXERCISES) {
    const starterCode = {
      python: ex.starters.python,
      javascript: ex.starters.javascript,
      c: ex.starters.c,
      cpp: ex.starters.cpp,
      java: ex.starters.java,
    };
    const points = DIFFICULTY_POINTS[ex.difficulty];

    const existing = await p.problem.findUnique({ where: { slug: ex.slug } });
    const data = {
      title: ex.title,
      slug: ex.slug,
      difficulty: ex.difficulty,
      topics: [ex.section, ...ex.topics],
      description: ex.description,
      constraints: '1 <= input size <= 10^4\nTime limit: 2s, Memory: 256MB',
      examplesJson: ex.examples,
      starterCode,
      points,
    };

    let problemId: string;
    if (existing) {
      const u = await p.problem.update({
        where: { id: existing.id },
        data,
      });
      problemId = u.id;
      // Replace test cases (delete + create) to keep this idempotent.
      await p.testCase.deleteMany({ where: { problemId } });
      updated++;
    } else {
      const c = await p.problem.create({ data });
      problemId = c.id;
      created++;
    }

    // (Re)insert hidden test cases.
    for (const t of ex.tests) {
      await p.testCase.create({
        data: { problemId, input: t.input, output: t.output, isHidden: true },
      });
    }

    // Tag into all language domains.
    await p.problem.update({
      where: { id: problemId },
      data: {
        domains: {
          set: [...bySlug.values()].map((d) => ({ id: d.id })),
        },
      },
    });
  }

  console.log(
    `Curriculum seeded: ${created} created, ${updated} updated (total ${ALL_EXERCISES.length})`,
  );
  console.log(
    `Tagged each problem into ${bySlug.size} language domains (python, javascript, c, cpp, java).`,
  );
  await p.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
