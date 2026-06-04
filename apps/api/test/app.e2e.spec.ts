import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { ZodValidationPipe } from 'nestjs-zod';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/infra/prisma/prisma.service';

/**
 * End-to-end smoke tests. They boot the real application (global guards,
 * pipes, the lot) against the docker Postgres + Redis and exercise the
 * critical user-facing flows:
 *
 *   • public catalog reads (institutions, skills)
 *   • signup → login → /auth/me happy path
 *   • auth is actually enforced (401 without a token)
 *   • DTO validation rejects bad input with 400
 *   • public portfolio lookup
 *
 * External-dependency flows (resume parse → OpenRouter, marksheet OCR,
 * practice submit → Judge0) are intentionally NOT asserted here: they call
 * third-party services and can't be deterministic without mocks. They get
 * unit-level coverage elsewhere.
 *
 * Run with: pnpm --filter @skillverify/api test:e2e  (docker stack must be up)
 */

const PREFIX = '/api/v1';
// Unique per run so reruns don't collide; cleaned up in afterAll.
const RUN_ID = Date.now().toString(36);
const loginEmail = `e2e+${RUN_ID}@example.com`;
const password = 'e2e-Password-123';

let app: INestApplication;
let prisma: PrismaService;
let createdUserId: string | null = null;

beforeAll(async () => {
  const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
  app = moduleRef.createNestApplication();
  app.setGlobalPrefix('api/v1');
  app.useGlobalPipes(new ZodValidationPipe());
  await app.init();
  prisma = app.get(PrismaService);
});

afterAll(async () => {
  // Best-effort cleanup of the user this suite created.
  if (createdUserId) {
    await prisma.user.delete({ where: { id: createdUserId } }).catch(() => undefined);
  }
  await app?.close();
});

describe('public catalog reads', () => {
  it('GET /institutions/search returns matches', async () => {
    const res = await request(app.getHttpServer())
      .get(`${PREFIX}/institutions/search`)
      .query({ q: 'IIT' })
      .expect(200);
    expect(Array.isArray(res.body.items ?? res.body)).toBe(true);
  });

  it('GET /skills/catalog returns items', async () => {
    const res = await request(app.getHttpServer())
      .get(`${PREFIX}/skills/catalog`)
      .query({ pageSize: 5 })
      .expect(200);
    expect(Array.isArray(res.body.items)).toBe(true);
  });
});

describe('auth enforcement', () => {
  it('GET /auth/me without a token is 401', async () => {
    await request(app.getHttpServer()).get(`${PREFIX}/auth/me`).expect(401);
  });
});

describe('signup → login → me', () => {
  let accessToken: string;
  let institutionId: string;
  let instituteEmail: string;

  beforeAll(async () => {
    // Any seeded institution works. If it has a domain on record, signup
    // requires the institute email to match it, so derive accordingly.
    const inst = await prisma.institution.findFirst();
    expect(inst, 'seed must contain at least one institution').toBeTruthy();
    institutionId = inst!.id;
    instituteEmail = inst!.domain
      ? `e2e.${RUN_ID}@${inst!.domain}`
      : `e2e.${RUN_ID}@students.example.ac.in`;
  });

  it('signs up a new student', async () => {
    const res = await request(app.getHttpServer())
      .post(`${PREFIX}/auth/signup`)
      .send({
        governmentName: 'E2E Test Student',
        phoneNumber: '+919876543210',
        email: loginEmail,
        password,
        instituteEmail,
        institutionId,
        courseProgram: 'B.Tech',
        collegeIdFileKey: `temp/college-ids/e2e-${RUN_ID}.png`,
      })
      .expect((r) => {
        if (![200, 201].includes(r.status)) {
          throw new Error(`signup expected 200/201, got ${r.status}: ${r.text}`);
        }
      });

    expect(res.body.accessToken).toBeTruthy();

    // Track for cleanup.
    const user = await prisma.user.findUnique({ where: { email: loginEmail } });
    createdUserId = user?.id ?? null;
    expect(createdUserId).toBeTruthy();
  });

  it('rejects a duplicate email with 409', async () => {
    await request(app.getHttpServer())
      .post(`${PREFIX}/auth/signup`)
      .send({
        governmentName: 'E2E Test Student',
        phoneNumber: '+919876543210',
        email: loginEmail,
        password,
        instituteEmail,
        institutionId,
        courseProgram: 'B.Tech',
        collegeIdFileKey: `temp/college-ids/e2e-${RUN_ID}.png`,
      })
      .expect(409);
  });

  it('rejects malformed signup with 400 (DTO validation)', async () => {
    await request(app.getHttpServer())
      .post(`${PREFIX}/auth/signup`)
      .send({ email: 'not-an-email', password: 'short' })
      .expect(400);
  });

  it('logs in with the new credentials', async () => {
    const res = await request(app.getHttpServer())
      .post(`${PREFIX}/auth/login`)
      .send({ email: loginEmail, password })
      .expect(200);
    expect(res.body.accessToken).toBeTruthy();
    accessToken = res.body.accessToken;
  });

  it('rejects a wrong password with 401', async () => {
    await request(app.getHttpServer())
      .post(`${PREFIX}/auth/login`)
      .send({ email: loginEmail, password: 'wrong-password' })
      .expect(401);
  });

  it('returns the current user from /auth/me with the token', async () => {
    const res = await request(app.getHttpServer())
      .get(`${PREFIX}/auth/me`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);
    expect(res.body.email).toBe(loginEmail);
    expect(res.body.studentProfile?.governmentName).toBe('E2E Test Student');
  });
});

describe('public portfolio', () => {
  it('GET /profile/public/<unknown> does not 500', async () => {
    const res = await request(app.getHttpServer()).get(
      `${PREFIX}/profile/public/this-slug-does-not-exist-${RUN_ID}`,
    );
    // Either a clean 404 or a 200 with an empty body — never a 5xx.
    expect(res.status).toBeLessThan(500);
  });
});
