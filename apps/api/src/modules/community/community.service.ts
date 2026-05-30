import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../infra/prisma/prisma.service';
import type { CommunityPostCreateDto } from './dto';

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
    const [items, total, myLikes] = await Promise.all([
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
      this.prisma.communityVote.findMany({
        where: { userId: opts.userId, value: { gt: 0 } },
        select: { postId: true },
      }),
    ]);
    const likedSet = new Set(myLikes.map((v) => v.postId));

    return {
      items: items.map((p) => ({
        id: p.id,
        body: p.body,
        tags: p.tags,
        visibility: p.visibility,
        likes: p.upvotes,
        commentsCount: p.commentsCount,
        likedByMe: likedSet.has(p.id),
        canDelete: p.authorId === opts.userId,
        createdAt: p.createdAt,
        author: p.isAnonymous
          ? { displayName: 'Anonymous', avatarUrl: null, slug: null, isAnonymous: true }
          : {
              displayName: p.author.studentProfile?.fullName ?? 'Student',
              avatarUrl: p.author.studentProfile?.avatarUrl ?? null,
              slug: p.author.studentProfile?.sharableSlug ?? null,
              isAnonymous: false,
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

  /**
   * Toggle a like. Returns the new like state + count.
   * Replaces the old +1/-1 vote endpoint — clients now just toggle.
   */
  async toggleLike(userId: string, postId: string) {
    const post = await this.prisma.communityPost.findUnique({ where: { id: postId } });
    if (!post) throw new NotFoundException();

    return this.prisma.$transaction(async (tx) => {
      const existing = await tx.communityVote.findUnique({
        where: { postId_userId: { postId, userId } },
      });
      let delta: number;
      let liked: boolean;
      if (existing) {
        await tx.communityVote.delete({ where: { id: existing.id } });
        delta = -1;
        liked = false;
      } else {
        await tx.communityVote.create({ data: { postId, userId, value: 1 } });
        delta = 1;
        liked = true;
      }
      const updated = await tx.communityPost.update({
        where: { id: postId },
        data: { upvotes: { increment: delta } },
        select: { upvotes: true },
      });
      return { liked, likes: updated.upvotes };
    });
  }

  async remove(userId: string, postId: string) {
    const post = await this.prisma.communityPost.findUnique({ where: { id: postId } });
    if (!post) throw new NotFoundException();
    if (post.authorId !== userId) throw new ForbiddenException();
    return this.prisma.communityPost.delete({ where: { id: postId } });
  }

  // ---------- Comments ----------

  async listComments(postId: string) {
    const post = await this.prisma.communityPost.findUnique({ where: { id: postId } });
    if (!post) throw new NotFoundException();
    const items = await this.prisma.communityComment.findMany({
      where: { postId },
      orderBy: { createdAt: 'asc' },
      include: {
        author: {
          include: {
            studentProfile: { select: { fullName: true, avatarUrl: true, sharableSlug: true } },
          },
        },
      },
    });
    return items.map((c) => ({
      id: c.id,
      body: c.body,
      createdAt: c.createdAt,
      author: c.isAnonymous
        ? { displayName: 'Anonymous', avatarUrl: null, slug: null, isAnonymous: true }
        : {
            displayName: c.author.studentProfile?.fullName ?? 'Student',
            avatarUrl: c.author.studentProfile?.avatarUrl ?? null,
            slug: c.author.studentProfile?.sharableSlug ?? null,
            isAnonymous: false,
          },
    }));
  }

  async addComment(userId: string, postId: string, body: string, isAnonymous: boolean) {
    const post = await this.prisma.communityPost.findUnique({ where: { id: postId } });
    if (!post) throw new NotFoundException();
    const lower = body.toLowerCase();
    if (BANNED.some((w) => lower.includes(w))) {
      throw new ForbiddenException('Comment contains disallowed language.');
    }
    return this.prisma.$transaction(async (tx) => {
      const comment = await tx.communityComment.create({
        data: { postId, authorId: userId, body, isAnonymous },
      });
      await tx.communityPost.update({
        where: { id: postId },
        data: { commentsCount: { increment: 1 } },
      });
      return comment;
    });
  }

  async deleteComment(userId: string, commentId: string) {
    const c = await this.prisma.communityComment.findUnique({ where: { id: commentId } });
    if (!c) throw new NotFoundException();
    if (c.authorId !== userId) throw new ForbiddenException();
    return this.prisma.$transaction(async (tx) => {
      await tx.communityComment.delete({ where: { id: commentId } });
      await tx.communityPost.update({
        where: { id: c.postId },
        data: { commentsCount: { decrement: 1 } },
      });
    });
  }
}
