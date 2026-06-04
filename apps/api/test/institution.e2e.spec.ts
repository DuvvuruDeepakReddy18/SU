import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { ZodValidationPipe } from 'nestjs-zod';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/infra/prisma/prisma.service';

/**
 * Institution / TPO portal e2e:
 *   request access → admin approve → roster (scoped to the institution)
 *   → analytics. Asserts the access gate and that the roster carries no
 *   personal contact fields.
 */

const PREFIX = '/api/v1';
const RUN = Date.now().toString(36);
const tpoEmail = `e2e.tpo.${RUN}@college.test`;
const password = 'e2e-Password-123';

let app: INestApplication;
let prisma: PrismaService;
let tpoToken = '';
let tpoUserId: string | null = null;
let institutionId = '';

beforeAll(async () => {
  const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
  app = moduleRef.createNestApplication();
  app.setGlobalPrefix('api/v1');
  app.useGlobalPipes(new ZodValidationPipe());
  await app.init();
  prisma = app.get(PrismaService);

  const inst = await prisma.institution.findFirst();
  institutionId = inst!.id;

  const res = await request(app.getHttpServer())
    .post(`${PREFIX}/auth/institution/signup`)
    .send({
      fullName: 'Dr E2E Sharma',
      title: 'TPO',
      institutionId,
      email: tpoEmail,
      password,
    })
    .expect((r) => {
      if (![200, 201].includes(r.status)) throw new Error(`tpo signup ${r.status}: ${r.text}`);
    });
  tpoToken = res.body.accessToken;
  tpoUserId = (await prisma.user.findUnique({ where: { email: tpoEmail } }))?.id ?? null;
}, 60000);

afterAll(async () => {
  if (tpoUserId) {
    await prisma.user.delete({ where: { id: tpoUserId } }).catch(() => undefined);
  }
  await app?.close();
});

describe('institution access gate', () => {
  it('a pending TPO is blocked from the roster (403)', async () => {
    await request(app.getHttpServer())
      .get(`${PREFIX}/institution-admin/roster`)
      .set('Authorization', `Bearer ${tpoToken}`)
      .expect(403);
  });
});

describe('approved TPO flow', () => {
  it('approves the TPO', async () => {
    await prisma.institutionAdminProfile.update({
      where: { userId: tpoUserId! },
      data: { status: 'approved', approvedAt: new Date() },
    });
  });

  it('roster returns this institution students with NO contact fields', async () => {
    const res = await request(app.getHttpServer())
      .get(`${PREFIX}/institution-admin/roster`)
      .query({ pageSize: 50 })
      .set('Authorization', `Bearer ${tpoToken}`)
      .expect(200);
    expect(Array.isArray(res.body.items)).toBe(true);
    for (const item of res.body.items) {
      expect(item).not.toHaveProperty('phoneNumber');
      expect(item).not.toHaveProperty('instituteEmail');
      expect(item).not.toHaveProperty('email');
      // ...but it DOES carry verification status
      expect(item).toHaveProperty('collegeIdStatus');
      expect(item).toHaveProperty('topLayer');
    }
  });

  it('analytics returns aggregate counts', async () => {
    const res = await request(app.getHttpServer())
      .get(`${PREFIX}/institution-admin/analytics`)
      .set('Authorization', `Bearer ${tpoToken}`)
      .expect(200);
    expect(typeof res.body.totalStudents).toBe('number');
    expect(res.body).toHaveProperty('skillLayerDistribution');
    expect(res.body).toHaveProperty('placed');
  });

  it('can post an institute-scoped campus drive', async () => {
    const res = await request(app.getHttpServer())
      .post(`${PREFIX}/institution-admin/drives`)
      .set('Authorization', `Bearer ${tpoToken}`)
      .send({ company: 'E2E Campus Co', role: 'SDE Intern' })
      .expect((r) => {
        if (![200, 201].includes(r.status)) throw new Error(`drive ${r.status}: ${r.text}`);
      });
    expect(res.body.scope).toBe('institute_only');
    expect(res.body.institutionId).toBe(institutionId);
    // cleanup
    await prisma.placementDrive.delete({ where: { id: res.body.id } }).catch(() => undefined);
  });
});
