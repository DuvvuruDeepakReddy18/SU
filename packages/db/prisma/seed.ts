import { PrismaClient, type CertificationTier } from '@prisma/client';
import { SKILL_SEEDS } from './seed-data/skills';
import { CERT_RULES } from './seed-data/cert-rules';
import { PROBLEMS } from './seed-data/problems';

const prisma = new PrismaClient();

const STARTER_CODE = {
  python: '# Read input, compute, print result\n\n',
  javascript: '// Read input from process.argv or stdin, write output\n\n',
  cpp: '#include <bits/stdc++.h>\nusing namespace std;\n\nint main() {\n  return 0;\n}\n',
  java: 'import java.util.*;\n\npublic class Main {\n  public static void main(String[] args) {\n  }\n}\n',
};

async function seedSkills() {
  console.warn(`Seeding ${SKILL_SEEDS.length} skills...`);
  for (const s of SKILL_SEEDS) {
    await prisma.skillCatalog.upsert({
      where: { name: s.name },
      update: { category: s.category },
      create: { name: s.name, category: s.category },
    });
  }
}

async function seedCertRules() {
  console.warn(`Seeding ${CERT_RULES.length} certification tier rules...`);
  for (const r of CERT_RULES) {
    let skillId: string | null = null;
    if (r.skillName) {
      const skill = await prisma.skillCatalog.findUnique({ where: { name: r.skillName } });
      skillId = skill?.id ?? null;
    }
    await prisma.certificationTierRule.upsert({
      where: { issuer_courseName: { issuer: r.issuer, courseName: r.courseName } },
      update: { tier: r.tier as CertificationTier, skillId },
      create: {
        issuer: r.issuer,
        courseName: r.courseName,
        tier: r.tier as CertificationTier,
        skillId,
      },
    });
  }
}

async function seedInstitutions() {
  console.warn('Seeding institutions...');
  const institutions = [
    { name: 'Indian Institute of Management Udaipur', domain: 'iimu.ac.in', tier: 'tier-1' },
    { name: 'BITS Pilani', domain: 'pilani.bits-pilani.ac.in', tier: 'tier-1' },
    { name: 'VIT Vellore', domain: 'vitstudent.ac.in', tier: 'tier-2' },
  ];
  for (const inst of institutions) {
    await prisma.institution.upsert({
      where: { domain: inst.domain },
      update: { name: inst.name, tier: inst.tier },
      create: inst,
    });
  }
}

async function seedProblems() {
  console.warn(`Seeding ${PROBLEMS.length} practice problems...`);
  for (const p of PROBLEMS) {
    await prisma.problem.upsert({
      where: { slug: p.slug },
      update: {
        title: p.title,
        difficulty: p.difficulty,
        topics: p.topics,
        description: p.description,
        constraints: p.constraints,
        examplesJson: p.examples,
        starterCode: STARTER_CODE,
        points: p.points,
      },
      create: {
        title: p.title,
        slug: p.slug,
        difficulty: p.difficulty,
        topics: p.topics,
        description: p.description,
        constraints: p.constraints,
        examplesJson: p.examples,
        starterCode: STARTER_CODE,
        points: p.points,
        testCases: {
          create: p.tests.map((t) => ({ input: t.input, output: t.output, isHidden: true })),
        },
      },
    });
  }
}

async function seedDemoUsers() {
  console.warn('Seeding demo student users...');
  // Plaintext-equivalent placeholder: bcrypt hash of "password123" (cost 10).
  // Demo accounts only — real users sign up through Auth.js.
  const passwordHash = '$2b$10$N2Y6Vt0z7yPgPp3qFv6m9.iLHK6w1eM7eVqJxlfVL/8aFqQ2qVj3y';
  const iimu = await prisma.institution.findUnique({ where: { domain: 'iimu.ac.in' } });
  const bits = await prisma.institution.findUnique({
    where: { domain: 'pilani.bits-pilani.ac.in' },
  });
  const vit = await prisma.institution.findUnique({ where: { domain: 'vitstudent.ac.in' } });

  const demos = [
    {
      email: 'arjun@iimu.ac.in',
      name: 'Arjun Mehta',
      slug: 'arjun-mehta',
      cgpa: 8.6,
      year: 2026,
      institutionId: iimu?.id,
    },
    {
      email: 'priya@iimu.ac.in',
      name: 'Priya Sharma',
      slug: 'priya-sharma',
      cgpa: 9.1,
      year: 2025,
      institutionId: iimu?.id,
    },
    {
      email: 'rohan@pilani.bits-pilani.ac.in',
      name: 'Rohan Gupta',
      slug: 'rohan-gupta',
      cgpa: 8.2,
      year: 2026,
      institutionId: bits?.id,
    },
    {
      email: 'kavya@pilani.bits-pilani.ac.in',
      name: 'Kavya Iyer',
      slug: 'kavya-iyer',
      cgpa: 9.4,
      year: 2025,
      institutionId: bits?.id,
    },
    {
      email: 'aditya@vitstudent.ac.in',
      name: 'Aditya Singh',
      slug: 'aditya-singh',
      cgpa: 7.9,
      year: 2027,
      institutionId: vit?.id,
    },
  ];

  for (const d of demos) {
    await prisma.user.upsert({
      where: { email: d.email },
      update: {},
      create: {
        email: d.email,
        passwordHash,
        role: 'STUDENT',
        institutionId: d.institutionId,
        emailVerified: new Date(),
        studentProfile: {
          create: {
            fullName: d.name,
            sharableSlug: d.slug,
            cgpa: d.cgpa,
            graduationYear: d.year,
            isPublic: true,
            headline: `Aspiring engineer @ ${d.email.split('@')[1]}`,
            bio: 'Student on SkillVerify — building verified skill portfolios.',
          },
        },
      },
    });
  }
}

async function main() {
  console.warn('--- SkillVerify seed ---');
  await seedInstitutions();
  await seedSkills();
  await seedCertRules();
  await seedProblems();
  await seedDemoUsers();
  console.warn('--- Done ---');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
