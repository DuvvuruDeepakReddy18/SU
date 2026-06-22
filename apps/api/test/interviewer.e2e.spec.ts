import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { ZodValidationPipe } from 'nestjs-zod';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/infra/prisma/prisma.service';
import { InterviewerService } from '../src/modules/interviewer/interviewer.service';

/**
 * Interviewer portal e2e — the full L4 award path:
 *   admin invites interviewer → interviewer claims a booking from the pool
 *   → scores a pass (held for the ~48h review window, no L4 yet)
 *   → admin releases → student's skill becomes L4_EXPERT (Expert-Verified).
 *
 * This is the only path that grants L4 anywhere in the system, so it gets a
 * dedicated end-to-end proof.
 */

const PREFIX = '/api/v1';
const RUN = Date.now().toString(36);
const studentEmail = `e2e.student.iv.${RUN}@example.com`;
const interviewerEmail = `e2e.interviewer.${RUN}@panel.test`;
const password = 'e2e-Password-123';

let app: INestApplication;
let prisma: PrismaService;
let studentId: string | null = null;
let interviewerUserId: string | null = null;
let skillId = '';
let bookingId = '';
let interviewerToken = '';

beforeAll(async () => {
  const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
  app = moduleRef.createNestApplication();
  app.setGlobalPrefix('api/v1');
  app.useGlobalPipes(new ZodValidationPipe());
  await app.init();
  prisma = app.get(PrismaService);
  const server = app.getHttpServer();

  // Student.
  const inst = await prisma.institution.findFirst();
  const instituteEmail = inst?.domain ? `e2e.${RUN}@${inst.domain}` : `e2e.${RUN}@s.example.ac.in`;
  await request(server)
    .post(`${PREFIX}/auth/signup`)
    .send({
      governmentName: 'Sam L4 Student',
      phoneNumber: '+919812345670',
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
  studentId = (await prisma.user.findUnique({ where: { email: studentEmail } }))?.id ?? null;

  // A skill for the student to be interviewed on.
  const skill = await prisma.skillCatalog.findFirst();
  skillId = skill!.id;

  // A scheduled, unclaimed booking for (student, skill).
  const booking = await prisma.interviewBooking.create({
    data: { userId: studentId!, skillId, scheduledAt: new Date(), status: 'scheduled' },
  });
  bookingId = booking.id;

  // Admin invites an interviewer (call the service directly to skip the
  // admin-auth dance — the HTTP admin route is thin over this).
  const interviewers = app.get(InterviewerService);
  await interviewers.adminInvite({ email: interviewerEmail, fullName: 'Dr Panel', expertise: [] });
  interviewerUserId =
    (await prisma.user.findUnique({ where: { email: interviewerEmail } }))?.id ?? null;
  // Set a known password so we can log in (the invite generates a random one).
  const bcrypt = await import('bcryptjs');
  await prisma.user.update({
    where: { id: interviewerUserId! },
    data: { passwordHash: await bcrypt.hash(password, 10) },
  });

  const login = await request(server)
    .post(`${PREFIX}/auth/login`)
    .send({ email: interviewerEmail, password })
    .expect(200);
  interviewerToken = login.body.accessToken;
}, 60000);

afterAll(async () => {
  if (studentId) await prisma.user.delete({ where: { id: studentId } }).catch(() => undefined);
  if (interviewerUserId) {
    await prisma.user.delete({ where: { id: interviewerUserId } }).catch(() => undefined);
  }
  await app?.close();
});

describe('L4 award flow', () => {
  it('the booking appears in the open pool', async () => {
    const res = await request(app.getHttpServer())
      .get(`${PREFIX}/interviewer/pool`)
      .set('Authorization', `Bearer ${interviewerToken}`)
      .expect(200);
    expect(res.body.some((b: { id: string }) => b.id === bookingId)).toBe(true);
  });

  it('the interviewer claims it', async () => {
    await request(app.getHttpServer())
      .post(`${PREFIX}/interviewer/pool/${bookingId}/claim`)
      .set('Authorization', `Bearer ${interviewerToken}`)
      .expect((r) => {
        if (![200, 201].includes(r.status)) throw new Error(`claim ${r.status}: ${r.text}`);
      });
  });

  it('a second claim of the same booking fails', async () => {
    await request(app.getHttpServer())
      .post(`${PREFIX}/interviewer/pool/${bookingId}/claim`)
      .set('Authorization', `Bearer ${interviewerToken}`)
      .expect(400);
  });

  it('scoring a pass holds the result for the review window (no L4 yet)', async () => {
    await request(app.getHttpServer())
      .post(`${PREFIX}/interviewer/mine/${bookingId}/score`)
      .set('Authorization', `Bearer ${interviewerToken}`)
      .send({ verdict: 'pass', score: 88, notes: 'Strong systems depth.' })
      .expect((r) => {
        if (![200, 201].includes(r.status)) throw new Error(`score ${r.status}: ${r.text}`);
      });

    const booking = await prisma.interviewBooking.findUnique({ where: { id: bookingId } });
    expect(booking?.status).toBe('completed_pending_review');
    expect(booking?.result).toBe('L4_VERIFIED'); // provisional panel recommendation

    // L4 must NOT be granted until an admin releases.
    const us = await prisma.userSkill.findUnique({
      where: { userId_skillId: { userId: studentId!, skillId } },
    });
    expect(us?.highestVerificationLayer).not.toBe('L4_EXPERT');
  });

  it('admin release awards L4 (Expert-Verified)', async () => {
    await app.get(InterviewerService).adminRelease(bookingId, true);

    const booking = await prisma.interviewBooking.findUnique({ where: { id: bookingId } });
    expect(booking?.status).toBe('released_pass');
    expect(booking?.reviewReleasedAt).not.toBeNull();

    const us = await prisma.userSkill.findUnique({
      where: { userId_skillId: { userId: studentId!, skillId } },
    });
    expect(us?.highestVerificationLayer).toBe('L4_EXPERT');
    expect(us?.l4VerificationMethod).toBe('EXPERT_VERIFIED');
  });
});
