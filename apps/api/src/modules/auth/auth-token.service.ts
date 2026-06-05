import { Injectable } from '@nestjs/common';
import { randomBytes, createHash } from 'node:crypto';
import { PrismaService } from '../../infra/prisma/prisma.service';

export type AuthTokenType = 'email_verify' | 'password_reset';

/**
 * Issues and consumes single-use, hashed tokens for email verification and
 * password reset. Only the SHA-256 hash is stored, so a DB leak can't be used
 * to verify or reset accounts — the raw token lives only in the emailed link.
 */
@Injectable()
export class AuthTokenService {
  constructor(private readonly prisma: PrismaService) {}

  private hash(raw: string): string {
    return createHash('sha256').update(raw).digest('hex');
  }

  /**
   * Issue a fresh token, invalidating any prior unused ones of the same type
   * (so only the latest link works). Returns the RAW token for the email link.
   */
  async issue(userId: string, type: AuthTokenType, ttlMinutes: number): Promise<string> {
    const raw = randomBytes(32).toString('base64url');
    const tokenHash = this.hash(raw);
    const expiresAt = new Date(Date.now() + ttlMinutes * 60_000);
    await this.prisma.authToken.updateMany({
      where: { userId, type, usedAt: null },
      data: { usedAt: new Date() },
    });
    await this.prisma.authToken.create({ data: { userId, type, tokenHash, expiresAt } });
    return raw;
  }

  /** Consume a token → returns userId when valid (unused + unexpired), else null. */
  async consume(type: AuthTokenType, raw: string): Promise<string | null> {
    if (!raw) return null;
    const tokenHash = this.hash(raw);
    const row = await this.prisma.authToken.findUnique({ where: { tokenHash } });
    if (!row || row.type !== type || row.usedAt || row.expiresAt < new Date()) return null;
    await this.prisma.authToken.update({ where: { id: row.id }, data: { usedAt: new Date() } });
    return row.userId;
  }
}
