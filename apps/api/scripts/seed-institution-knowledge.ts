/* eslint-disable no-console */
// Seeds sample knowledge-base entries for a few well-known institutions so the
// grounded chatbot has real facts to answer from. These are accurate general
// facts; each college's TPO replaces/expands them with their own details.
// Idempotent by (institution, title).
import { PrismaClient } from '@prisma/client';

const KB: { match: string; facts: { title: string; content: string }[] }[] = [
  {
    match: 'Madras',
    facts: [
      {
        title: 'Location & establishment',
        content: 'IIT Madras is located in Chennai, Tamil Nadu, and was established in 1959.',
      },
      {
        title: 'Admissions',
        content:
          'Admission to B.Tech programmes is through JEE Advanced; M.Tech admission is through GATE; PhD through the institute’s own process.',
      },
      {
        title: 'Ranking',
        content:
          'IIT Madras has consistently been ranked #1 in the NIRF Overall and Engineering rankings in recent years.',
      },
      {
        title: 'Contact',
        content:
          'For official admission and academic queries, refer to the institute website iitm.ac.in and the academic section. The chatbot does not have phone numbers on file.',
      },
    ],
  },
  {
    match: 'Pilani',
    facts: [
      {
        title: 'Location & establishment',
        content:
          'BITS Pilani’s founding campus is in Pilani, Rajasthan, established in 1964 as the Birla Institute of Technology and Science.',
      },
      {
        title: 'Admissions',
        content:
          'Admission to integrated first-degree (B.E.) programmes is through BITSAT, the institute’s own online entrance test.',
      },
      {
        title: 'Campuses',
        content: 'BITS Pilani has campuses in Pilani, Goa, Hyderabad, and Dubai.',
      },
      {
        title: 'Practice School',
        content:
          'BITS is known for its flexible academic system and the Practice School industry internship programme.',
      },
    ],
  },
  {
    match: 'Vellore',
    facts: [
      {
        title: 'Location & establishment',
        content:
          'VIT (Vellore Institute of Technology) is located in Vellore, Tamil Nadu, and was established in 1984.',
      },
      {
        title: 'Admissions',
        content:
          'Admission to B.Tech programmes is through VITEEE, the VIT Engineering Entrance Examination.',
      },
      {
        title: 'Campuses',
        content:
          'VIT has campuses in Vellore and Chennai (Tamil Nadu), Amaravati (Andhra Pradesh), and Bhopal (Madhya Pradesh).',
      },
    ],
  },
  {
    match: 'Udaipur',
    facts: [
      {
        title: 'Location & establishment',
        content: 'IIM Udaipur is located in Udaipur, Rajasthan, and was established in 2011.',
      },
      {
        title: 'Admissions',
        content:
          'Admission to the two-year MBA programme is through CAT, followed by Writing Ability Test and Personal Interview (WAT-PI).',
      },
      {
        title: 'Programmes',
        content:
          'IIM Udaipur is known for its specialised MBA tracks such as Digital Enterprise Management and Global Supply Chain Management.',
      },
    ],
  },
  {
    match: 'Amrita Vishwa Vidyapeetham',
    facts: [
      {
        title: 'Campuses',
        content:
          'Amrita Vishwa Vidyapeetham is a multi-campus university with campuses in Coimbatore, Chennai, Bengaluru, Amritapuri (Kerala) and Kochi.',
      },
      {
        title: 'Admissions',
        content:
          'B.Tech admission is through the Amrita Entrance Examination Engineering (AEEE) or on the basis of JEE Main scores.',
      },
      {
        title: 'Contact',
        content:
          'For exact, campus-specific details (fees, hostel, placements), refer to amrita.edu or contact the campus admissions office. The chatbot only shares facts it has on file.',
      },
    ],
  },
];

async function main() {
  const p = new PrismaClient();
  let added = 0;
  for (const inst of KB) {
    const row = await p.institution.findFirst({
      where: { name: { contains: inst.match, mode: 'insensitive' }, domain: { not: null } },
      orderBy: { verified: 'desc' },
    });
    if (!row) {
      console.warn(`No institution matched "${inst.match}" — skipping.`);
      continue;
    }
    for (const f of inst.facts) {
      const existing = await p.institutionKnowledge.findFirst({
        where: { institutionId: row.id, title: f.title },
      });
      if (existing) continue;
      await p.institutionKnowledge.create({
        data: { institutionId: row.id, title: f.title, content: f.content, source: 'seed' },
      });
      added += 1;
    }
    console.log(`  ${row.name}: knowledge ensured.`);
  }
  console.log(`Done. Added ${added} knowledge entries.`);
  await p.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
