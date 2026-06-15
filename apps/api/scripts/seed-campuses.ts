/* eslint-disable no-console */
// Adds individual campuses of known multi-campus universities so the tokenized
// institution search can match "<uni> <city>" (e.g. "amrita chennai"). The
// parent already holds the unique email domain, so campus rows use a null
// domain — the college-ID review still verifies the student. Idempotent by
// name. Extend CAMPUSES as more multi-campus colleges are requested.
import { PrismaClient } from '@prisma/client';

const CAMPUSES: {
  name: string;
  shortName: string;
  category: string;
  city: string;
  state: string;
}[] = [
  // Amrita Vishwa Vidyapeetham (Coimbatore campus already seeded with the domain)
  {
    name: 'Amrita Vishwa Vidyapeetham, Chennai',
    shortName: 'Amrita Chennai',
    category: 'engineering',
    city: 'Chennai',
    state: 'Tamil Nadu',
  },
  {
    name: 'Amrita Vishwa Vidyapeetham, Bengaluru',
    shortName: 'Amrita Bengaluru',
    category: 'engineering',
    city: 'Bengaluru',
    state: 'Karnataka',
  },
  {
    name: 'Amrita Vishwa Vidyapeetham, Amritapuri',
    shortName: 'Amrita Amritapuri',
    category: 'engineering',
    city: 'Kollam',
    state: 'Kerala',
  },
  {
    name: 'Amrita Vishwa Vidyapeetham, Kochi',
    shortName: 'Amrita Kochi',
    category: 'medical',
    city: 'Kochi',
    state: 'Kerala',
  },
];

async function main() {
  const p = new PrismaClient();
  let added = 0;
  for (const c of CAMPUSES) {
    const existing = await p.institution.findFirst({
      where: { name: { equals: c.name, mode: 'insensitive' } },
    });
    if (existing) continue;
    await p.institution.create({ data: { ...c, domain: null, verified: true } });
    added += 1;
  }
  console.log(`Campuses added: ${added} (skipped ${CAMPUSES.length - added} existing).`);
  await p.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
