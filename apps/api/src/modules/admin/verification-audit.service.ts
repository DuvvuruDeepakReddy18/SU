import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../infra/prisma/prisma.service';
import type { AuditAction, AuditTargetType } from '@skillverify/shared';

/**
 * Single writer for the VerificationAudit log. Every admin / reviewer mutation
 * funnels through here so the audit trail is consistent. Returns nothing —
 * fire-and-await; we never short-circuit a reviewer action on an audit-write
 * failure (we'd rather lose an audit row than reject a legitimate approval).
 */
@Injectable()
export class VerificationAuditService {
  constructor(private readonly prisma: PrismaService) {}

  async record(input: {
    actorUserId: string;
    targetType: AuditTargetType;
    targetId: string;
    action: AuditAction;
    reasonCode?: string | null;
    reasonNote?: string | null;
    previousState?: Prisma.InputJsonValue | null;
  }) {
    try {
      await this.prisma.verificationAudit.create({
        data: {
          actorUserId: input.actorUserId,
          targetType: input.targetType,
          targetId: input.targetId,
          action: input.action,
          reasonCode: input.reasonCode ?? null,
          reasonNote: input.reasonNote ?? null,
          previousState: input.previousState ?? Prisma.JsonNull,
        },
      });
    } catch {
      // Never throw — audit-write failure must not break the user-facing action.
    }
  }

  /**
   * Returns the audit trail for one target, newest first. Used by the admin
   * UI to show "who reviewed this and why".
   */
  async forTarget(targetType: AuditTargetType, targetId: string, limit = 50) {
    return this.prisma.verificationAudit.findMany({
      where: { targetType, targetId },
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: {
        actor: {
          select: {
            email: true,
            studentProfile: { select: { fullName: true } },
          },
        },
      },
    });
  }
}
