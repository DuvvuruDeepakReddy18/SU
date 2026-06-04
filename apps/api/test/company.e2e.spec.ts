import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { ZodValidationPipe } from 'nestjs-zod';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/infra/prisma/prisma.service';

/**
 * Company-portal end-to-end: the full marketplace loop.
 *
 *   recruiter signup → admin approve → candidate search (PII-stripped)
 *   → contact request → student accepts → recruiter sees contact
 *
 * Asserts the privacy gate at every step: search results carry no contact
 * fields, and the candidate's contact is hidden until the student accepts.
 *
 * Run with: pnpm --filter @skillverify/api test:e2e (docker stack must be up)
 */

const PREFIX = '/api/v1';
const RUN = Date.now().toString(36);
const recruiterEmail = `e2e.recruiter.${RUN}@company-${RUN}.test`;
const studentEmail = `e2e.student.${RUN}@example.com`;
const password = 'e2e-Password-123';

let app: INestApplication;
let prisma: PrismaService;
let recruiterToken = '';
let studentToken = '';
let recruiterUserId: string | null = null;
let studentUserId: string | null = null;

async function bearer(server: ReturnType<INestApplication['getHttpServer']>, email: string) {
  const res = await request(server)
    .post(`${PREFIX}/auth/login`)
    .send({ email, password })
    .expect(200);
  return res.body.accessToken as string;
}

beforeAll(async () => {
  const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
  app = moduleRef.createNestApplication();
  app.setGlobalPrefix('api/v1');
  app.useGlobalPipes(new ZodValidationPipe());
  await app.init();
  prisma = app.get(PrismaService);
  const server = app.getHttpServer();

  // Recruiter signup.
  const recRes = await request(server)
    .post(`${PREFIX}/auth/company/signup`)
    .send({
      companyName: 'E2E Hiring Co',
      fullName: 'Riya Recruiter',
      email: recruiterEmail,
      password,
    })
    .expect((r) => {
      if (![200, 201].includes(r.status))
        throw new Error(`recruiter signup ${r.status}: ${r.text}`);
    });
  recruiterToken = recRes.body.accessToken;
  recruiterUserId =
    (await prisma.user.findUnique({ where: { email: recruiterEmail } }))?.id ?? null;

  // Student signup (any seeded institution; match its domain if present).
  const inst = await prisma.institution.findFirst();
  const instituteEmail = inst?.domain
    ? `e2e.${RUN}@${inst.domain}`
    : `e2e.${RUN}@students.example.ac.in`;
  await request(server)
    .post(`${PREFIX}/auth/signup`)
    .send({
      governmentName: 'Sam Student',
      phoneNumber: '+919812345678',
      email: studentEmail,
      password,
      instituteEmail,
      institutionId: inst!.id,
      courseProgram: 'B.Tech',
      collegeIdFileKey: `temp/college-ids/e2e-${RUN}.png`,
    })
    .expect((r) => {
      if (![200, 201].includes(r.status)) throw new Error(`student signup ${r.status}: ${r.text}`);
    });
  studentUserId = (await prisma.user.findUnique({ where: { email: studentEmail } }))?.id ?? null;
  // Make the student public so they appear in search.
  await prisma.studentProfile.update({
    where: { userId: studentUserId! },
    data: { isPublic: true },
  });

  studentToken = await bearer(server, studentEmail);
}, 60000);

afterAll(async () => {
  if (recruiterUserId) {
    await prisma.user.delete({ where: { id: recruiterUserId } }).catch(() => undefined);
  }
  if (studentUserId) {
    await prisma.user.delete({ where: { id: studentUserId } }).catch(() => undefined);
  }
  await app?.close();
});

describe('recruiter access gate', () => {
  it('a pending recruiter is blocked from candidate search (403)', async () => {
    await request(app.getHttpServer())
      .get(`${PREFIX}/recruiters/candidates`)
      .set('Authorization', `Bearer ${recruiterToken}`)
      .expect(403);
  });
});

describe('approved recruiter flow', () => {
  let inquiryId = '';

  it('approves the recruiter', async () => {
    await prisma.recruiterProfile.update({
      where: { userId: recruiterUserId! },
      data: { status: 'approved', approvedAt: new Date() },
    });
    // Token already carries role RECRUITER; status is read server-side.
  });

  it('search returns candidates with NO contact fields', async () => {
    const res = await request(app.getHttpServer())
      .get(`${PREFIX}/recruiters/candidates`)
      .query({ pageSize: 50 })
      .set('Authorization', `Bearer ${recruiterToken}`)
      .expect(200);
    expect(Array.isArray(res.body.items)).toBe(true);
    for (const item of res.body.items) {
      expect(item).not.toHaveProperty('phoneNumber');
      expect(item).not.toHaveProperty('instituteEmail');
      expect(item).not.toHaveProperty('email');
    }
  });

  it('candidate detail hides contact before acceptance', async () => {
    const res = await request(app.getHttpServer())
      .get(`${PREFIX}/recruiters/candidates/${studentUserId}`)
      .set('Authorization', `Bearer ${recruiterToken}`)
      .expect(200);
    expect(res.body.contactUnlocked).toBe(false);
    expect(res.body.contact).toBeNull();
  });

  it('recruiter sends a contact request', async () => {
    await request(app.getHttpServer())
      .post(`${PREFIX}/recruiters/inquiries`)
      .set('Authorization', `Bearer ${recruiterToken}`)
      .send({ studentId: studentUserId, message: 'Hi Sam, we are hiring a frontend engineer!' })
      .expect((r) => {
        if (![200, 201].includes(r.status)) throw new Error(`inquiry ${r.status}: ${r.text}`);
      });
  });

  it('student sees the inquiry and accepts it', async () => {
    const list = await request(app.getHttpServer())
      .get(`${PREFIX}/me/recruiter-inquiries`)
      .set('Authorization', `Bearer ${studentToken}`)
      .expect(200);
    expect(list.body.length).toBeGreaterThan(0);
    inquiryId = list.body[0].id;

    await request(app.getHttpServer())
      .post(`${PREFIX}/me/recruiter-inquiries/${inquiryId}/respond`)
      .set('Authorization', `Bearer ${studentToken}`)
      .send({ accept: true })
      .expect((r) => {
        if (![200, 201].includes(r.status)) throw new Error(`respond ${r.status}: ${r.text}`);
      });
  });

  it('candidate detail now reveals contact', async () => {
    const res = await request(app.getHttpServer())
      .get(`${PREFIX}/recruiters/candidates/${studentUserId}`)
      .set('Authorization', `Bearer ${recruiterToken}`)
      .expect(200);
    expect(res.body.contactUnlocked).toBe(true);
    expect(res.body.contact?.email).toBe(studentEmail);
  });
});
