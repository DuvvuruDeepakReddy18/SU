import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../infra/prisma/prisma.service';
import type { CommunityPostCreateDto, CommunityVoteDto } from './dto';

// Minimal keyword filter for MVP. Replace with a proper service later.
const BANNED = ['fuck', 'shit', 'cunt', 'nigger', 'faggot'];

@Injectable()
export class CommunityService {
  constructor(private readonly prisma: PrismaService) {}

  async list(opts: {
    userId: string;
    institutionId: string | null;
    page: number;
    pageSize: number;
  }) {
    const where = {
      OR: [
        { visibility: 'public' },
        ...(opts.institutionId
          ? [{ visibility: 'college_only', author: { institutionId: opts.institutionId } }]
          : []),
      ],
    };
    const [items, total] = await Promise.all([
      this.prisma.communityPost.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (opts.page - 1) * opts.pageSize,
        take: opts.pageSize,
        include: {
          author: {
            include: {
              studentProfile: { select: { fullName: true, avatarUrl: true, sharableSlug: true } },
            },
          },
        },
      }),
      this.prisma.communityPost.count({ where }),
    ]);
    // Strip identity from anonymous posts.
    return {
      items: items.map((p) => ({
        id: p.id,
        body: p.body,
        tags: p.tags,
        visibility: p.visibility,
        upvotes: p.upvotes,
        downvotes: p.downvotes,
        createdAt: p.createdAt,
        author: p.isAnonymous
          ? { displayName: 'Anonymous', avatarUrl: null, slug: null }
          : {
              displayName: p.author.studentProfile?.fullName ?? 'Student',
              avatarUrl: p.author.studentProfile?.avatarUrl ?? null,
              slug: p.author.studentProfile?.sharableSlug ?? null,
            },
      })),
      total,
      page: opts.page,
      pageSize: opts.pageSize,
    };
  }

  async create(userId: string, dto: CommunityPostCreateDto) {
    const lower = dto.body.toLowerCase();
    if (BANNED.some((w) => lower.includes(w))) {
      throw new ForbiddenException('Post contains disallowed language.');
    }
    return this.prisma.communityPost.create({
      data: {
        authorId: userId,
        body: dto.body,
        tags: dto.tags,
        isAnonymous: dto.isAnonymous,
        visibility: dto.visibility,
      },
    });
  }

  async vote(userId: string, postId: string, dto: CommunityVoteDto) {
    const post = await this.prisma.communityPost.findUnique({ where: { id: postId } });
    if (!post) throw new NotFoundException();
    return this.prisma.$transaction(async (tx) => {
      const existing = await tx.communityVote.findUnique({
        where: { postId_userId: { postId, userId } },
      });
      let delta: { up: number; down: number };
      if (existing) {
        if (existing.value === dto.value) {
          await tx.communityVote.delete({ where: { id: existing.id } });
          delta = dto.value === 1 ? { up: -1, down: 0 } : { up: 0, down: -1 };
        } else {
          await tx.communityVote.update({ where: { id: existing.id }, data: { value: dto.value } });
          delta = dto.value === 1 ? { up: 1, down: -1 } : { up: -1, down: 1 };
        }
      } else {
        await tx.communityVote.create({ data: { postId, userId, value: dto.value } });
        delta = dto.value === 1 ? { up: 1, down: 0 } : { up: 0, down: 1 };
      }
      return tx.communityPost.update({
        where: { id: postId },
        data: { upvotes: { increment: delta.up }, downvotes: { increment: delta.down } },
      });
    });
  }

  async remove(userId: string, postId: string) {
    const post = await this.prisma.communityPost.findUnique({ where: { id: postId } });
    if (!post) throw new NotFoundException();
    if (post.authorId !== userId) throw new ForbiddenException();
    return this.prisma.communityPost.delete({ where: { id: postId } });
  }
}
