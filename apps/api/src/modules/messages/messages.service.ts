import { BadRequestException, ForbiddenException, Injectable } from '@nestjs/common';
import { PrismaService } from '../../infra/prisma/prisma.service';

@Injectable()
export class MessagesService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Returns the user's conversations grouped by counterpart, latest first.
   * For each counterpart we return: their profile snippet, the last message
   * preview, the unread count (messages they sent that we haven't readAt'd).
   */
  async listThreads(userId: string) {
    // Pull the 200 most recent messages where the user is sender OR recipient
    // — enough for an MVP inbox without forcing pagination on day one.
    const rows = await this.prisma.directMessage.findMany({
      where: { OR: [{ senderId: userId }, { recipientId: userId }] },
      orderBy: { createdAt: 'desc' },
      take: 200,
      include: {
        sender: {
          select: {
            id: true,
            studentProfile: { select: { fullName: true, avatarUrl: true, sharableSlug: true } },
          },
        },
        recipient: {
          select: {
            id: true,
            studentProfile: { select: { fullName: true, avatarUrl: true, sharableSlug: true } },
          },
        },
      },
    });

    // Bucket by counterpart user id.
    type Thread = {
      counterpartId: string;
      fullName: string;
      avatarUrl: string | null;
      sharableSlug: string | null;
      lastBody: string;
      lastAt: Date;
      lastFromMe: boolean;
      unread: number;
    };
    const threads = new Map<string, Thread>();
    for (const m of rows) {
      const isFromMe = m.senderId === userId;
      const cp = isFromMe ? m.recipient : m.sender;
      const cpId = cp.id;
      if (!threads.has(cpId)) {
        threads.set(cpId, {
          counterpartId: cpId,
          fullName: cp.studentProfile?.fullName ?? 'Unknown',
          avatarUrl: cp.studentProfile?.avatarUrl ?? null,
          sharableSlug: cp.studentProfile?.sharableSlug ?? null,
          lastBody: m.body,
          lastAt: m.createdAt,
          lastFromMe: isFromMe,
          unread: 0,
        });
      }
      const t = threads.get(cpId)!;
      // Count incoming messages that are still unread.
      if (!isFromMe && !m.readAt) t.unread += 1;
    }
    return [...threads.values()].sort((a, b) => b.lastAt.getTime() - a.lastAt.getTime());
  }

  /**
   * Full transcript between userId and counterpartId, oldest → newest.
   * Marks every incoming message in the thread as read as a side-effect.
   */
  async thread(userId: string, counterpartId: string) {
    if (userId === counterpartId) {
      throw new BadRequestException("You can't message yourself.");
    }
    // Look up counterpart so the frontend has their profile in one call.
    const counterpart = await this.prisma.user.findUnique({
      where: { id: counterpartId },
      select: {
        id: true,
        studentProfile: {
          select: { fullName: true, avatarUrl: true, sharableSlug: true, headline: true },
        },
        institution: { select: { name: true, shortName: true } },
      },
    });
    if (!counterpart) throw new BadRequestException('User not found.');

    const messages = await this.prisma.directMessage.findMany({
      where: {
        OR: [
          { senderId: userId, recipientId: counterpartId },
          { senderId: counterpartId, recipientId: userId },
        ],
      },
      orderBy: { createdAt: 'asc' },
      take: 500,
    });

    // Mark inbound as read in the background.
    await this.prisma.directMessage.updateMany({
      where: { senderId: counterpartId, recipientId: userId, readAt: null },
      data: { readAt: new Date() },
    });

    return {
      counterpart: {
        id: counterpart.id,
        fullName: counterpart.studentProfile?.fullName ?? 'Unknown',
        avatarUrl: counterpart.studentProfile?.avatarUrl ?? null,
        sharableSlug: counterpart.studentProfile?.sharableSlug ?? null,
        headline: counterpart.studentProfile?.headline ?? null,
        institution: counterpart.institution?.shortName ?? counterpart.institution?.name ?? null,
      },
      messages: messages.map((m) => ({
        id: m.id,
        body: m.body,
        senderId: m.senderId,
        recipientId: m.recipientId,
        createdAt: m.createdAt,
        readAt: m.readAt,
        fromMe: m.senderId === userId,
      })),
    };
  }

  async send(senderId: string, recipientId: string, body: string) {
    if (senderId === recipientId) {
      throw new BadRequestException("You can't message yourself.");
    }
    const trimmed = body.trim();
    if (trimmed.length === 0 || trimmed.length > 2000) {
      throw new BadRequestException('Message must be 1–2000 characters.');
    }
    // Validate recipient exists + is a student (no DMing the recruiters yet).
    const recipient = await this.prisma.user.findUnique({
      where: { id: recipientId },
      select: { id: true, role: true },
    });
    if (!recipient) throw new BadRequestException('Recipient not found.');
    return this.prisma.directMessage.create({
      data: { senderId, recipientId, body: trimmed },
    });
  }

  /**
   * Used by the floating "DMs" badge in the topbar.
   */
  async unreadCount(userId: string): Promise<number> {
    return this.prisma.directMessage.count({
      where: { recipientId: userId, readAt: null },
    });
  }

  async deleteOwn(userId: string, messageId: string) {
    const msg = await this.prisma.directMessage.findUnique({ where: { id: messageId } });
    if (!msg) throw new BadRequestException('Message not found.');
    if (msg.senderId !== userId) {
      throw new ForbiddenException('You can only delete your own messages.');
    }
    return this.prisma.directMessage.delete({ where: { id: messageId } });
  }
}
