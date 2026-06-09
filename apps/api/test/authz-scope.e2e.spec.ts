import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { ZodValidationPipe } from 'nestjs-zod';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/infra/prisma/prisma.service';

/**
 * Authorization e2e: institute-only resources must reject a student from a
 * DIFFERENT institution even when they know the resource ID. The list hides
 * such resources; these tests prove the mutations (apply / enter) block them
 * at the endpoint — the regression guard for the two P1 bypasses.
 *
 *   • outside-college apply to an institute-only drive       → 404
 *   • same-college apply gets PAST scope (→ 403 L3 floor, not 404)
 *   • outside-college enter an institute-only competition    → 404
 *   • same-college enter succeeds                            → 200/201
 */

const PREFIX = '/api/v1';
const RUN = Date.now().toString(36);
const password = 'e2e-Password-123';

let app: INestApplication;
let prisma: PrismaService;

let instA = '';
let instB = '';
let studentA = { token: '', userId: '' };
let studentB = { token: '', userId: '' };
let driveId = '';
let competitionId = '';

async function signupStudent(
  institution: { id: string; domain: string | null },
  suffix: string,
  phoneTail: string,
) {
  const instituteEmail = institution.domain
    ? `e2e.scope.${suffix}.${RUN}@${institution.domain}`
    : `e2e.scope.${suffix}.${RUN}@students.example.ac.in`;
  const email = `e2e.scope.${suffix}.${RUN}@example.com`;
  const res = await request(app.getHttpServer())
    .post(`${PREFIX}/auth/signup`)
    .send({
      governmentName: `Scope Test ${suffix.toUpperCase()} ${RUN}`,
      phoneNumber: `+91987654${phoneTail}`,
      email,
      password,
      instituteEmail,
      institutionId: institution.id,
      courseProgram: 'B.Tech',
      collegeIdFileKey: `temp/college-ids/e2e-scope-${suffix}-${RUN}.png`,
    })
    .expect((r) => {
      if (![200, 201].includes(r.status))
        throw new Error(`signup ${suffix} ${r.status}: ${r.text}`);
    });
  const user = await prisma.user.findUnique({ where: { email } });
  return { token: res.body.accessToken as string, userId: user!.id };
}

beforeAll(async () => {
  const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
  app = moduleRef.createNestApplication();
  app.setGlobalPrefix('api/v1');
  app.useGlobalPipes(new ZodValidationPipe());
  await app.init();
  prisma = app.get(PrismaService);

  // Two DISTINCT institutions.
  const institutions = await prisma.institution.findMany({ take: 2 });
  expect(institutions.length, 'seed needs at least 2 institutions').toBe(2);
  instA = institutions[0].id;
  instB = institutions[1].id;
  expect(instA).not.toBe(instB);

  studentA = await signupStudent(institutions[0], 'a', '3201');
  studentB = await signupStudent(institutions[1], 'b', '3202');

  // An institute-only drive + competition, both owned by institution A.
  const drive = await prisma.placementDrive.create({
    data: {
      postedById: studentA.userId,
      company: 'Scope Co',
      role: 'SDE',
      scope: 'institute_only',
      institutionId: instA,
      minLevel: 'L0_UNVERIFIED',
      jobType: 'full_time',
      skills: [],
    },
  });
  driveId = drive.id;

  const comp = await prisma.competition.create({
    data: {
      title: `Scope Cup ${RUN}`,
      category: 'hackathon',
      description: 'institute-only',
      startsAt: new Date(),
      endsAt: new Date(Date.now() + 86_400_000),
      scope: 'institute_only',
      institutionId: instA,
      postedById: studentA.userId,
    },
  });
  competitionId = comp.id;
}, 60000);

afterAll(async () => {
  await prisma.competition.delete({ where: { id: competitionId } }).catch(() => undefined);
  await prisma.placementDrive.delete({ where: { id: driveId } }).catch(() => undefined);
  for (const id of [studentA.userId, studentB.userId]) {
    if (id) await prisma.user.delete({ where: { id } }).catch(() => undefined);
  }
  await app?.close();
});

describe('institute-only placement drive — direct apply by ID', () => {
  it('blocks an outside-college student with 404', async () => {
    await request(app.getHttpServer())
      .post(`${PREFIX}/placements/${driveId}/apply`)
      .set('Authorization', `Bearer ${studentB.token}`)
      .expect(404);
  });

  it('lets a same-college student PAST the scope gate (403 on the L3 floor, not 404)', async () => {
    // studentA is in institution A so scope passes; they're L0, so the
    // platform-wide L3 floor rejects with 403 — proving it got past scope.
    await request(app.getHttpServer())
      .post(`${PREFIX}/placements/${driveId}/apply`)
      .set('Authorization', `Bearer ${studentA.token}`)
      .expect(403);
  });
});

describe('institute-only competition — direct enter by ID', () => {
  it('blocks an outside-college student with 404', async () => {
    await request(app.getHttpServer())
      .post(`${PREFIX}/competitions/${competitionId}/enter`)
      .set('Authorization', `Bearer ${studentB.token}`)
      .send({})
      .expect(404);
  });

  it('lets a same-college student enter', async () => {
    await request(app.getHttpServer())
      .post(`${PREFIX}/competitions/${competitionId}/enter`)
      .set('Authorization', `Bearer ${studentA.token}`)
      .send({})
      .expect((r) => {
        if (![200, 201].includes(r.status))
          throw new Error(`enter expected 200/201, got ${r.status}`);
      });
  });
});
