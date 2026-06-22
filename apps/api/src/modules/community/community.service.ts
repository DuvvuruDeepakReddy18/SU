import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { PrismaService } from '../../infra/prisma/prisma.service';
import type { CommunityPostCreateDto, CommunityCommentCreateDto } from './dto';

// Minimal keyword filter for MVP. Replace with a proper service later.
// Whole-word matching (tokenise on non-letters) so innocent words that merely
// CONTAIN a banned substring — Scunthorpe, shitake, classic, assess — are not
// flagged. The previous substring approach had that false-positive bug.
const BANNED = new Set([
  'fuck',
  'fucking',
  'fucked',
  'fucker',
  'motherfucker',
  'shit',
  'shitty',
  'bullshit',
  'cunt',
  'nigger',
  'nigga',
  'faggot',
  'bitch',
  'asshole',
]);
function hasProfanity(lowerText: string): boolean {
  return lowerText.split(/[^a-z]+/).some((tok) => tok.length > 0 && BANNED.has(tok));
}

type ListOpts = {
  userId: string;
  institutionId: string | null;
  page: number;
  pageSize: number;
  scope?: 'all' | 'mine';
  subreddit?: string | null;
  sort?: 'hot' | 'new' | 'top';
};

@Injectable()
export class CommunityService {
  constructor(private readonly prisma: PrismaService) {}

  async list(opts: ListOpts) {
    let where: Prisma.CommunityPostWhereInput;
    if (opts.scope === 'mine' && opts.institutionId) {
      where = { author: { institutionId: opts.institutionId } };
    } else {
      where = {
        OR: [
          { visibility: 'public' },
          ...(opts.institutionId
            ? [
                {
                  visibility: 'college_only',
                  author: { institutionId: opts.institutionId },
                } as const,
              ]
            : []),
        ],
      };
    }
    if (opts.subreddit) {
      where = { AND: [where, { subreddit: opts.subreddit }] };
    }

    // sort=hot is a simplified Reddit score: score / age_hours^1.5. We can't
    // express that in Prisma orderBy, so for "hot" we pull the most RECENT
    // window of posts and rank them in app (hot favours recent + popular).
    // "new" and "top" are pure orderBy and paginate in the DB.
    const HOT_WINDOW = 150;
    const orderBy: Prisma.CommunityPostOrderByWithRelationInput[] =
      opts.sort === 'top' ? [{ score: 'desc' }, { createdAt: 'desc' }] : [{ createdAt: 'desc' }];

    const fetchSize = opts.sort === 'hot' ? HOT_WINDOW : opts.pageSize;

    const [items, total, myVotes] = await Promise.all([
      this.prisma.communityPost.findMany({
        where,
        orderBy,
        skip: opts.sort === 'hot' ? 0 : (opts.page - 1) * opts.pageSize,
        take: fetchSize,
        include: {
          author: {
            include: {
              studentProfile: { select: { fullName: true, avatarUrl: true, sharableSlug: true } },
              institution: { select: { name: true, shortName: true } },
            },
          },
        },
      }),
      this.prisma.communityPost.count({ where }),
      this.prisma.communityVote.findMany({
        where: { userId: opts.userId },
        select: { postId: true, value: true },
      }),
    ]);

    // Hot-rank in app for the "hot" sort. Wilson-ish: score / age_hours^1.5.
    let ranked = items;
    let effectiveTotal = total;
    if (opts.sort === 'hot') {
      const now = Date.now();
      const all = [...items].sort((a, b) => hot(b, now) - hot(a, now));
      // Pagination is bounded to the fetched hot window, and `total` reflects
      // that — otherwise deep pages came back empty while total claimed more.
      effectiveTotal = all.length;
      const start = (opts.page - 1) * opts.pageSize;
      ranked = all.slice(start, start + opts.pageSize);
    }

    const voteByPost = new Map(myVotes.map((v) => [v.postId, v.value]));

    return {
      items: ranked.map((p) => ({
        id: p.id,
        title: p.title,
        body: p.hiddenByMod ? '[removed by moderator]' : p.body,
        tags: p.tags,
        subreddit: p.subreddit,
        visibility: p.visibility,
        score: p.score,
        upvotes: p.upvotes,
        downvotes: p.downvotes,
        commentsCount: p.commentsCount,
        myVote: voteByPost.get(p.id) ?? 0,
        canDelete: p.authorId === opts.userId,
        hiddenByMod: p.hiddenByMod,
        createdAt: p.createdAt,
        author: p.isAnonymous
          ? {
              displayName: 'Anonymous',
              avatarUrl: null,
              slug: null,
              isAnonymous: true,
              institution: null,
            }
          : {
              displayName: p.author.studentProfile?.fullName ?? 'Student',
              avatarUrl: p.author.studentProfile?.avatarUrl ?? null,
              slug: p.author.studentProfile?.sharableSlug ?? null,
              isAnonymous: false,
              institution: p.author.institution?.shortName ?? p.author.institution?.name ?? null,
            },
      })),
      total: effectiveTotal,
      page: opts.page,
      pageSize: opts.pageSize,
    };
  }

  async create(userId: string, dto: CommunityPostCreateDto) {
    const lower = `${dto.title ?? ''} ${dto.body}`.toLowerCase();
    if (hasProfanity(lower)) {
      throw new ForbiddenException('Post contains disallowed language.');
    }
    return this.prisma.communityPost.create({
      data: {
        authorId: userId,
        title: dto.title ?? null,
        body: dto.body,
        tags: dto.tags,
        isAnonymous: dto.isAnonymous,
        visibility: dto.visibility,
        subreddit: dto.subreddit,
      },
    });
  }

  /**
   * Toggle a vote in either direction. Sending the same value as the
   * current vote clears it (clicking up again removes the upvote).
   */
  async vote(userId: string, postId: string, value: 1 | -1) {
    const post = await this.prisma.communityPost.findUnique({ where: { id: postId } });
    if (!post) throw new NotFoundException();

    return this.prisma.$transaction(async (tx) => {
      const existing = await tx.communityVote.findUnique({
        where: { postId_userId: { postId, userId } },
      });

      // Persist the vote and compute the deltas in one swoop.
      let myNewVote: 1 | -1 | 0 = value;
      const persist = async (): Promise<{
        upDelta: number;
        downDelta: number;
        scoreDelta: number;
      }> => {
        if (!existing) {
          await tx.communityVote.create({ data: { postId, userId, value } });
          return value === 1
            ? { upDelta: 1, downDelta: 0, scoreDelta: 1 }
            : { upDelta: 0, downDelta: 1, scoreDelta: -1 };
        }
        if (existing.value === value) {
          await tx.communityVote.delete({ where: { id: existing.id } });
          myNewVote = 0;
          return value === 1
            ? { upDelta: -1, downDelta: 0, scoreDelta: -1 }
            : { upDelta: 0, downDelta: -1, scoreDelta: 1 };
        }
        // Switched from up→down or down→up — double swing.
        await tx.communityVote.update({ where: { id: existing.id }, data: { value } });
        return value === 1
          ? { upDelta: 1, downDelta: -1, scoreDelta: 2 }
          : { upDelta: -1, downDelta: 1, scoreDelta: -2 };
      };
      const { upDelta, downDelta, scoreDelta } = await persist();

      const updated = await tx.communityPost.update({
        where: { id: postId },
        data: {
          upvotes: { increment: upDelta },
          downvotes: { increment: downDelta },
          score: { increment: scoreDelta },
        },
        select: { upvotes: true, downvotes: true, score: true },
      });

      return {
        upvotes: updated.upvotes,
        downvotes: updated.downvotes,
        score: updated.score,
        myVote: myNewVote,
      };
    });
  }

  async remove(userId: string, postId: string) {
    const post = await this.prisma.communityPost.findUnique({ where: { id: postId } });
    if (!post) throw new NotFoundException();
    if (post.authorId !== userId) throw new ForbiddenException();
    return this.prisma.communityPost.delete({ where: { id: postId } });
  }

  /**
   * Moderator soft-delete — keeps the row but blanks out the body in the UI.
   * Called from the admin queue.
   */
  async hidePostByMod(postId: string) {
    return this.prisma.communityPost.update({
      where: { id: postId },
      data: { hiddenByMod: true },
    });
  }

  async unhidePostByMod(postId: string) {
    return this.prisma.communityPost.update({
      where: { id: postId },
      data: { hiddenByMod: false },
    });
  }

  // ---------- Comments ----------

  /**
   * Returns comments as a flat list ordered by creation time. Frontend
   * stitches them into a tree using parentCommentId.
   */
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
      parentCommentId: c.parentCommentId,
      body: c.hiddenByMod ? '[removed by moderator]' : c.body,
      hiddenByMod: c.hiddenByMod,
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

  async addComment(userId: string, postId: string, dto: CommunityCommentCreateDto) {
    const post = await this.prisma.communityPost.findUnique({ where: { id: postId } });
    if (!post) throw new NotFoundException();
    const lower = dto.body.toLowerCase();
    if (hasProfanity(lower)) {
      throw new ForbiddenException('Comment contains disallowed language.');
    }
    // Validate parentCommentId actually belongs to the same post.
    if (dto.parentCommentId) {
      const parent = await this.prisma.communityComment.findUnique({
        where: { id: dto.parentCommentId },
        select: { postId: true },
      });
      if (!parent || parent.postId !== postId) {
        throw new ForbiddenException('Invalid parent comment.');
      }
    }
    return this.prisma.$transaction(async (tx) => {
      const comment = await tx.communityComment.create({
        data: {
          postId,
          authorId: userId,
          body: dto.body,
          isAnonymous: dto.isAnonymous,
          parentCommentId: dto.parentCommentId ?? null,
        },
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

  async hideCommentByMod(commentId: string) {
    return this.prisma.communityComment.update({
      where: { id: commentId },
      data: { hiddenByMod: true },
    });
  }

  /**
   * Distinct subreddits + post counts. Used by the UI to render the
   * left-rail of sub-community chips.
   */
  async listSubreddits() {
    const rows = await this.prisma.communityPost.groupBy({
      by: ['subreddit'],
      _count: { subreddit: true },
      orderBy: { _count: { subreddit: 'desc' } },
    });
    return rows.map((r) => ({ slug: r.subreddit, count: r._count.subreddit }));
  }
}

// Reddit-ish hotness score: signed log of |score| divided by age_hours.
function hot(p: { score: number; createdAt: Date }, now: number): number {
  const ageHours = Math.max(1, (now - p.createdAt.getTime()) / 3_600_000);
  const sign = p.score > 0 ? 1 : p.score < 0 ? -1 : 0;
  const magnitude = Math.log10(Math.max(1, Math.abs(p.score)));
  return (sign * magnitude) / Math.pow(ageHours, 1.5);
}
