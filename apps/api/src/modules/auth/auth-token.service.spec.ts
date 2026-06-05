import { describe, it, expect, beforeEach } from 'vitest';
import { AuthTokenService } from './auth-token.service';

/**
 * Minimal in-memory stand-in for the `authToken` Prisma delegate. Captures just
 * enough of the create/find/update/updateMany surface the token service uses so
 * we can exercise the single-use + expiry + invalidate-prior semantics without a
 * real database.
 */
type Row = {
  id: string;
  userId: string;
  type: string;
  tokenHash: string;
  expiresAt: Date;
  usedAt: Date | null;
};

function makePrisma() {
  const rows: Row[] = [];
  let seq = 0;
  return {
    rows,
    authToken: {
      create: ({ data }: { data: Omit<Row, 'id' | 'usedAt'> }) => {
        const row: Row = { id: `t_${++seq}`, usedAt: null, ...data };
        rows.push(row);
        return Promise.resolve(row);
      },
      findUnique: ({ where }: { where: { tokenHash: string } }) =>
        Promise.resolve(rows.find((r) => r.tokenHash === where.tokenHash) ?? null),
      update: ({ where, data }: { where: { id: string }; data: Partial<Row> }) => {
        const row = rows.find((r) => r.id === where.id)!;
        Object.assign(row, data);
        return Promise.resolve(row);
      },
      updateMany: ({
        where,
        data,
      }: {
        where: { userId: string; type: string; usedAt: null };
        data: Partial<Row>;
      }) => {
        let count = 0;
        for (const r of rows) {
          if (r.userId === where.userId && r.type === where.type && r.usedAt === null) {
            Object.assign(r, data);
            count++;
          }
        }
        return Promise.resolve({ count });
      },
    },
  };
}

describe('AuthTokenService', () => {
  let prisma: ReturnType<typeof makePrisma>;
  let service: AuthTokenService;

  beforeEach(() => {
    prisma = makePrisma();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    service = new AuthTokenService(prisma as any);
  });

  it('stores only the hash, never the raw token', async () => {
    const raw = await service.issue('u_1', 'email_verify', 60);
    expect(prisma.rows).toHaveLength(1);
    expect(prisma.rows[0].tokenHash).not.toEqual(raw);
    expect(prisma.rows[0].tokenHash).toHaveLength(64); // sha-256 hex
  });

  it('consumes a valid token once and returns the userId', async () => {
    const raw = await service.issue('u_1', 'email_verify', 60);
    expect(await service.consume('email_verify', raw)).toBe('u_1');
    // Second use is rejected (single-use).
    expect(await service.consume('email_verify', raw)).toBeNull();
  });

  it('rejects a token used for the wrong type', async () => {
    const raw = await service.issue('u_1', 'email_verify', 60);
    expect(await service.consume('password_reset', raw)).toBeNull();
  });

  it('rejects an expired token', async () => {
    const raw = await service.issue('u_1', 'password_reset', -1); // already expired
    expect(await service.consume('password_reset', raw)).toBeNull();
  });

  it('rejects empty / unknown tokens', async () => {
    expect(await service.consume('email_verify', '')).toBeNull();
    expect(await service.consume('email_verify', 'not-a-real-token')).toBeNull();
  });

  it('invalidates prior unused tokens of the same type when re-issued', async () => {
    const first = await service.issue('u_1', 'email_verify', 60);
    await service.issue('u_1', 'email_verify', 60);
    // The first link no longer works; only the latest is valid.
    expect(await service.consume('email_verify', first)).toBeNull();
  });

  it('keeps tokens of different types independent on re-issue', async () => {
    const verify = await service.issue('u_1', 'email_verify', 60);
    await service.issue('u_1', 'password_reset', 60);
    // Issuing a reset token must not invalidate the verify token.
    expect(await service.consume('email_verify', verify)).toBe('u_1');
  });
});
