'use client';

import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { api } from '@/lib/api';
import {
  ChevronUp,
  ChevronDown,
  MessageCircle,
  Send,
  Trash2,
  User as UserIcon,
  Hash,
  Flame,
  Clock,
  TrendingUp,
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { DEFAULT_SUBREDDITS } from '@skillverify/shared';
import { CommunityMascot } from '@/components/community-mascot';

type Author = {
  displayName: string;
  avatarUrl: string | null;
  slug: string | null;
  isAnonymous: boolean;
  institution: string | null;
};

type Post = {
  id: string;
  title: string | null;
  body: string;
  tags: string[];
  subreddit: string;
  visibility: string;
  score: number;
  upvotes: number;
  downvotes: number;
  commentsCount: number;
  myVote: 0 | 1 | -1;
  canDelete: boolean;
  hiddenByMod: boolean;
  createdAt: string;
  author: Author;
};

type Comment = {
  id: string;
  parentCommentId: string | null;
  body: string;
  hiddenByMod: boolean;
  createdAt: string;
  author: Author;
};

type Sort = 'hot' | 'new' | 'top';

export default function CommunityPage() {
  const { data: session } = useSession();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const token = (session as any)?.accessToken as string | undefined;
  const qc = useQueryClient();

  // ---- composer state ----
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [anon, setAnon] = useState(false);
  const [composerSub, setComposerSub] = useState<string>('general');

  // ---- feed filters ----
  const [scope, setScope] = useState<'all' | 'mine'>('all');
  const [sort, setSort] = useState<Sort>('hot');
  const [activeSub, setActiveSub] = useState<string | null>(null);

  const { data: profile } = useQuery({
    enabled: !!token,
    queryKey: ['profile.me'],
    queryFn: () =>
      api<{ user: { institution: { name: string } | null } }>('/profile/me', { token }),
  });

  const { data: subs } = useQuery({
    enabled: !!token,
    queryKey: ['community.subreddits'],
    queryFn: () => api<{ slug: string; count: number }[]>('/community/posts/subreddits', { token }),
  });
  // Merge built-in defaults + observed subs so brand-new subs still show up
  // and so the chip rail is never empty.
  const allSubreddits = useMemo<{ slug: string; count: number }[]>(() => {
    const observed = new Map((subs ?? []).map((s) => [s.slug, s.count] as const));
    const built = DEFAULT_SUBREDDITS.map((slug) => ({
      slug: slug as string,
      count: observed.get(slug) ?? 0,
    }));
    const extra = (subs ?? []).filter(
      (s) => !(DEFAULT_SUBREDDITS as readonly string[]).includes(s.slug),
    );
    return [...built, ...extra];
  }, [subs]);

  const queryUrl = useMemo(() => {
    const p = new URLSearchParams();
    p.set('scope', scope);
    p.set('sort', sort);
    if (activeSub) p.set('subreddit', activeSub);
    p.set('pageSize', '30');
    return `/community/posts?${p.toString()}`;
  }, [scope, sort, activeSub]);

  const { data } = useQuery({
    enabled: !!token,
    queryKey: ['community.posts', scope, sort, activeSub],
    queryFn: () => api<{ items: Post[]; total: number }>(queryUrl, { token }),
  });

  const post = useMutation({
    mutationFn: () =>
      api('/community/posts', {
        method: 'POST',
        token,
        body: JSON.stringify({
          title: title.trim() || null,
          body,
          tags: [],
          isAnonymous: anon,
          visibility: 'public',
          subreddit: composerSub,
        }),
      }),
    onSuccess: () => {
      setTitle('');
      setBody('');
      toast.success('Posted');
      qc.invalidateQueries({ queryKey: ['community.posts'] });
      qc.invalidateQueries({ queryKey: ['community.subreddits'] });
    },
    onError: (e) => toast.error((e as Error).message),
  });

  const vote = useMutation({
    mutationFn: (args: { id: string; value: 1 | -1 }) =>
      api<{ upvotes: number; downvotes: number; score: number; myVote: 0 | 1 | -1 }>(
        `/community/posts/${args.id}/vote`,
        { method: 'POST', token, body: JSON.stringify({ value: args.value }) },
      ),
    onMutate: async ({ id, value }) => {
      await qc.cancelQueries({ queryKey: ['community.posts', scope, sort, activeSub] });
      const prev = qc.getQueryData<{ items: Post[] }>(['community.posts', scope, sort, activeSub]);
      qc.setQueryData<{ items: Post[]; total: number }>(
        ['community.posts', scope, sort, activeSub],
        (old) => {
          if (!old) return old as never;
          return {
            ...old,
            items: old.items.map((p) => {
              if (p.id !== id) return p;
              const { upDelta, downDelta, scoreDelta, myNewVote } = computeVoteDelta(
                p.myVote,
                value,
              );
              return {
                ...p,
                upvotes: p.upvotes + upDelta,
                downvotes: p.downvotes + downDelta,
                score: p.score + scoreDelta,
                myVote: myNewVote,
              };
            }),
          };
        },
      );
      return { prev };
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.prev) qc.setQueryData(['community.posts', scope, sort, activeSub], ctx.prev);
    },
    onSettled: () => qc.invalidateQueries({ queryKey: ['community.posts'] }),
  });

  const remove = useMutation({
    mutationFn: (id: string) => api(`/community/posts/${id}`, { method: 'DELETE', token }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['community.posts'] }),
  });

  // Quick stats summarized from the loaded feed — purely cosmetic in the hero.
  const totalPosts = data?.total ?? 0;
  const visibleSubs = allSubreddits.length;

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* ============ ORBIE HERO ============ */}
      <section className="relative overflow-hidden rounded-2xl border bg-gradient-to-br from-indigo-50 via-background to-purple-50 dark:from-indigo-950/40 dark:via-background dark:to-purple-950/40 p-6 md:p-8">
        {/* Blurry rainbow accent strip */}
        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-rose-500 via-amber-400 via-emerald-500 via-blue-500 to-violet-500 opacity-70" />
        <div className="absolute -bottom-24 -right-20 h-72 w-72 rounded-full bg-indigo-300/30 blur-3xl dark:bg-indigo-800/30" />

        <div className="relative flex flex-col md:flex-row items-center md:items-start gap-6">
          <div className="shrink-0 text-indigo-500 dark:text-indigo-300">
            <CommunityMascot size={104} />
          </div>
          <div className="flex-1 text-center md:text-left">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-background/70 backdrop-blur border px-2.5 py-0.5 text-[10px] font-medium uppercase tracking-wider">
              <span className="h-1.5 w-1.5 rounded-full bg-indigo-500 animate-pulse" />
              Community · SkillVerify
            </div>
            <h1 className="mt-2 text-3xl md:text-4xl font-bold tracking-tight">
              Welcome to your{' '}
              <span className="bg-gradient-to-r from-indigo-500 via-purple-500 to-cyan-500 bg-clip-text text-transparent">
                community
              </span>
            </h1>
            <p className="mt-2 text-sm text-muted-foreground max-w-xl">
              The web of student communities. Discuss freely, share anonymously, message your peers
              — across institutes and within yours.
            </p>
            <div className="mt-3 flex flex-wrap gap-4 justify-center md:justify-start text-xs">
              <Stat n={totalPosts} label="posts in your feed" />
              <Stat n={visibleSubs} label="active sub-communities" />
              <Link
                href="/dashboard/messages"
                className="inline-flex items-center gap-1 rounded-full bg-foreground/90 hover:bg-foreground text-background px-3 py-1.5 font-medium transition"
              >
                <MessageCircle className="h-3 w-3" /> Open Messages
              </Link>
            </div>
          </div>
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-[200px_1fr]">
        {/* ---------- LEFT RAIL: sub-communities ---------- */}
        <aside className="space-y-2 lg:sticky lg:top-4 self-start">
          <div className="text-xs uppercase tracking-wider text-muted-foreground px-1">
            Communities
          </div>
          <button
            onClick={() => setActiveSub(null)}
            className={cn(
              'flex w-full items-center justify-between rounded-md px-2 py-1.5 text-sm hover:bg-secondary',
              activeSub === null && 'bg-secondary font-medium',
            )}
          >
            <span className="inline-flex items-center gap-1.5">
              <Hash className="h-3.5 w-3.5" /> All
            </span>
          </button>
          {allSubreddits.map((s) => (
            <button
              key={s.slug}
              onClick={() => setActiveSub(s.slug)}
              className={cn(
                'flex w-full items-center justify-between rounded-md px-2 py-1.5 text-sm hover:bg-secondary',
                activeSub === s.slug && 'bg-secondary font-medium',
              )}
            >
              <span className="inline-flex items-center gap-1.5">
                <Hash className="h-3.5 w-3.5" /> {s.slug}
              </span>
              {s.count > 0 && (
                <span className="text-[10px] text-muted-foreground tabular-nums">{s.count}</span>
              )}
            </button>
          ))}
        </aside>

        {/* ---------- MAIN FEED ---------- */}
        <div className="space-y-5 min-w-0">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h1 className="text-2xl font-semibold capitalize">
                {activeSub ? `r/${activeSub}` : 'Community'}
              </h1>
              <p className="text-sm text-muted-foreground">
                Discuss, share, ask — across institutes and within yours.
              </p>
            </div>
            <div className="inline-flex rounded-md border bg-secondary/30 p-1 text-sm">
              <button
                onClick={() => setScope('all')}
                className={cn(
                  'rounded px-3 py-1 transition',
                  scope === 'all' ? 'bg-background shadow-sm' : 'text-muted-foreground',
                )}
              >
                All
              </button>
              <button
                onClick={() => setScope('mine')}
                className={cn(
                  'rounded px-3 py-1 transition',
                  scope === 'mine' ? 'bg-background shadow-sm' : 'text-muted-foreground',
                )}
              >
                {profile?.user?.institution?.name ?? 'My institute'}
              </button>
            </div>
          </div>

          {/* Composer */}
          <Card>
            <CardContent className="p-4 space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <select
                  value={composerSub}
                  onChange={(e) => setComposerSub(e.target.value)}
                  className="h-8 rounded-md border border-input bg-transparent px-2 text-sm"
                >
                  {(DEFAULT_SUBREDDITS as readonly string[]).map((s) => (
                    <option key={s} value={s}>
                      r/{s}
                    </option>
                  ))}
                </select>
                <Input
                  placeholder="Title (optional)"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  maxLength={200}
                  className="flex-1 min-w-[200px]"
                />
              </div>
              <textarea
                className="w-full min-h-[80px] resize-none rounded-md border border-input bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                placeholder={
                  anon ? 'Share something anonymously…' : 'Share something with the community…'
                }
                value={body}
                onChange={(e) => setBody(e.target.value)}
                maxLength={5000}
              />
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer">
                  <input
                    type="checkbox"
                    checked={anon}
                    onChange={(e) => setAnon(e.target.checked)}
                    className="rounded"
                  />
                  Post anonymously
                </label>
                <Button
                  onClick={() => post.mutate()}
                  disabled={!body.trim() || post.isPending}
                  size="sm"
                >
                  <Send className="h-4 w-4" /> {post.isPending ? 'Posting…' : 'Post'}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Sort tabs */}
          <div className="flex gap-1 border-b">
            <SortTab active={sort === 'hot'} onClick={() => setSort('hot')} icon={Flame}>
              Hot
            </SortTab>
            <SortTab active={sort === 'new'} onClick={() => setSort('new')} icon={Clock}>
              New
            </SortTab>
            <SortTab active={sort === 'top'} onClick={() => setSort('top')} icon={TrendingUp}>
              Top
            </SortTab>
          </div>

          {/* Feed */}
          <div className="space-y-3">
            {data?.items.length === 0 && (
              <Card>
                <CardContent className="py-12 text-center text-sm text-muted-foreground">
                  No posts yet — be the first.
                </CardContent>
              </Card>
            )}
            {data?.items.map((p) => (
              <PostCard
                key={p.id}
                post={p}
                token={token}
                onVote={(value) => vote.mutate({ id: p.id, value })}
                onDelete={() => remove.mutate(p.id)}
                onSubClick={(s) => setActiveSub(s)}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function Stat({ n, label }: { n: number; label: string }) {
  return (
    <div className="inline-flex items-baseline gap-1 text-muted-foreground">
      <span className="font-semibold text-foreground tabular-nums">{n}</span>
      <span>{label}</span>
    </div>
  );
}

// Mirrors the backend math in CommunityService.vote — keeps the optimistic
// update consistent with what the server returns.
function computeVoteDelta(
  current: 0 | 1 | -1,
  next: 1 | -1,
): { upDelta: number; downDelta: number; scoreDelta: number; myNewVote: 0 | 1 | -1 } {
  if (current === next) {
    return next === 1
      ? { upDelta: -1, downDelta: 0, scoreDelta: -1, myNewVote: 0 }
      : { upDelta: 0, downDelta: -1, scoreDelta: 1, myNewVote: 0 };
  }
  if (current === 1 && next === -1) {
    return { upDelta: -1, downDelta: 1, scoreDelta: -2, myNewVote: -1 };
  }
  if (current === -1 && next === 1) {
    return { upDelta: 1, downDelta: -1, scoreDelta: 2, myNewVote: 1 };
  }
  return next === 1
    ? { upDelta: 1, downDelta: 0, scoreDelta: 1, myNewVote: 1 }
    : { upDelta: 0, downDelta: 1, scoreDelta: -1, myNewVote: -1 };
}

// ---------- subcomponents ----------

function SortTab({
  active,
  onClick,
  icon: Icon,
  children,
}: {
  active: boolean;
  onClick: () => void;
  icon: typeof Flame;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'inline-flex items-center gap-1.5 px-3 py-2 text-sm -mb-px border-b-2 transition',
        active
          ? 'border-primary text-foreground font-medium'
          : 'border-transparent text-muted-foreground hover:text-foreground',
      )}
    >
      <Icon className="h-3.5 w-3.5" /> {children}
    </button>
  );
}

function PostCard({
  post,
  token,
  onVote,
  onDelete,
  onSubClick,
}: {
  post: Post;
  token?: string;
  onVote: (v: 1 | -1) => void;
  onDelete: () => void;
  onSubClick: (s: string) => void;
}) {
  const [showComments, setShowComments] = useState(false);
  const ago = timeAgo(new Date(post.createdAt));

  return (
    <Card>
      <CardContent className="p-0">
        <div className="flex">
          {/* Vote rail */}
          <div className="flex flex-col items-center gap-1 px-2 py-3 border-r bg-secondary/20">
            <button
              onClick={() => onVote(1)}
              aria-label="Upvote"
              className={cn(
                'rounded p-1 transition hover:bg-secondary',
                post.myVote === 1 && 'text-emerald-500',
              )}
            >
              <ChevronUp className="h-5 w-5" />
            </button>
            <span
              className={cn(
                'text-xs font-semibold tabular-nums',
                post.score > 0 && 'text-emerald-600',
                post.score < 0 && 'text-rose-600',
              )}
            >
              {post.score}
            </span>
            <button
              onClick={() => onVote(-1)}
              aria-label="Downvote"
              className={cn(
                'rounded p-1 transition hover:bg-secondary',
                post.myVote === -1 && 'text-rose-500',
              )}
            >
              <ChevronDown className="h-5 w-5" />
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 min-w-0 p-4">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground flex-wrap">
              <button
                onClick={() => onSubClick(post.subreddit)}
                className="font-semibold text-foreground hover:underline"
              >
                r/{post.subreddit}
              </button>
              <span>·</span>
              <span>Posted by</span>
              {post.author.slug && !post.author.isAnonymous ? (
                <Link href={`/u/${post.author.slug}`} className="hover:underline">
                  {post.author.displayName}
                </Link>
              ) : (
                <span>{post.author.displayName}</span>
              )}
              {post.author.institution && <span>· {post.author.institution}</span>}
              <span>· {ago}</span>
              {post.visibility === 'college_only' && (
                <Badge variant="outline" className="text-[10px] h-4">
                  college
                </Badge>
              )}
            </div>

            {post.title && (
              <div className="mt-1 font-semibold text-base leading-snug">{post.title}</div>
            )}
            <p
              className={cn(
                'mt-1 text-sm whitespace-pre-wrap leading-relaxed',
                post.hiddenByMod && 'italic text-muted-foreground',
              )}
            >
              {post.body}
            </p>

            <div className="mt-3 flex items-center gap-1">
              <button
                onClick={() => setShowComments((s) => !s)}
                className="flex items-center gap-1.5 rounded-md px-2 py-1 text-xs text-muted-foreground hover:bg-secondary transition"
              >
                <MessageCircle className="h-4 w-4" />
                <span>{post.commentsCount} comments</span>
              </button>
              {post.canDelete && (
                <button
                  onClick={onDelete}
                  className="flex items-center gap-1.5 rounded-md px-2 py-1 text-xs text-muted-foreground hover:text-destructive transition"
                >
                  <Trash2 className="h-3.5 w-3.5" /> Delete
                </button>
              )}
            </div>

            {showComments && <CommentThread postId={post.id} token={token} />}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function CommentThread({ postId, token }: { postId: string; token?: string }) {
  const qc = useQueryClient();
  const [body, setBody] = useState('');
  const [anon, setAnon] = useState(false);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);

  const { data } = useQuery({
    queryKey: ['community.comments', postId],
    queryFn: () => api<Comment[]>(`/community/posts/${postId}/comments`, { token }),
  });

  const add = useMutation({
    mutationFn: () =>
      api(`/community/posts/${postId}/comments`, {
        method: 'POST',
        token,
        body: JSON.stringify({ body, isAnonymous: anon, parentCommentId: replyingTo }),
      }),
    onSuccess: () => {
      setBody('');
      setReplyingTo(null);
      qc.invalidateQueries({ queryKey: ['community.comments', postId] });
      qc.invalidateQueries({ queryKey: ['community.posts'] });
    },
    onError: (e) => toast.error((e as Error).message),
  });

  // Stitch flat list into a tree by parentCommentId
  const tree = useMemo(() => {
    const list = data ?? [];
    const byId = new Map<string, Comment & { children: Comment[] }>();
    list.forEach((c) => byId.set(c.id, { ...c, children: [] }));
    const roots: (Comment & { children: Comment[] })[] = [];
    for (const c of byId.values()) {
      if (c.parentCommentId && byId.has(c.parentCommentId)) {
        byId.get(c.parentCommentId)!.children.push(c);
      } else {
        roots.push(c);
      }
    }
    return roots;
  }, [data]);

  return (
    <div className="mt-3 space-y-3 border-t pt-3">
      {/* Composer */}
      <div className="flex items-start gap-2">
        <input
          className="flex-1 rounded-full border border-input bg-transparent px-4 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
          placeholder={replyingTo ? 'Reply…' : anon ? 'Comment anonymously…' : 'Write a comment…'}
          value={body}
          onChange={(e) => setBody(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey && body.trim()) {
              e.preventDefault();
              add.mutate();
            }
          }}
          maxLength={2000}
        />
        <Button
          onClick={() => add.mutate()}
          disabled={!body.trim() || add.isPending}
          size="sm"
          variant="outline"
        >
          <Send className="h-3.5 w-3.5" />
        </Button>
        {replyingTo && (
          <button
            type="button"
            onClick={() => setReplyingTo(null)}
            className="text-[10px] text-muted-foreground hover:text-foreground"
          >
            Cancel reply
          </button>
        )}
      </div>
      <label className="flex items-center gap-2 text-[11px] text-muted-foreground cursor-pointer">
        <input
          type="checkbox"
          checked={anon}
          onChange={(e) => setAnon(e.target.checked)}
          className="rounded"
        />
        Comment anonymously
      </label>

      {/* Tree */}
      {tree.length === 0 && (
        <p className="text-xs text-muted-foreground italic">No comments yet — start the thread.</p>
      )}
      <div className="space-y-3">
        {tree.map((c) => (
          <CommentNode key={c.id} node={c} depth={0} onReply={(id) => setReplyingTo(id)} />
        ))}
      </div>
    </div>
  );
}

function CommentNode({
  node,
  depth,
  onReply,
}: {
  node: Comment & { children: Comment[] };
  depth: number;
  onReply: (id: string) => void;
}) {
  // Indent each nesting level slightly; cap at 6 so long threads don't shove
  // off-screen.
  const indent = Math.min(depth, 6) * 16;
  return (
    <div style={{ marginLeft: indent }}>
      <div className="flex items-start gap-3">
        <Avatar author={node.author} small />
        <div className="flex-1 min-w-0">
          <div className="rounded-lg bg-secondary px-3 py-2">
            <div className="text-xs font-medium">
              {node.author.slug && !node.author.isAnonymous ? (
                <Link href={`/u/${node.author.slug}`} className="hover:underline">
                  {node.author.displayName}
                </Link>
              ) : (
                node.author.displayName
              )}
            </div>
            <div
              className={cn(
                'text-sm mt-0.5 whitespace-pre-wrap',
                node.hiddenByMod && 'italic text-muted-foreground',
              )}
            >
              {node.body}
            </div>
          </div>
          <div className="flex items-center gap-3 mt-1 px-1 text-[10px] text-muted-foreground">
            <span>{timeAgo(new Date(node.createdAt))}</span>
            <button onClick={() => onReply(node.id)} className="hover:text-foreground">
              Reply
            </button>
          </div>
        </div>
      </div>

      {node.children.length > 0 && (
        <div className="mt-2 border-l border-border/60 pl-3 space-y-3">
          {node.children.map((child) => (
            <CommentNode
              key={child.id}
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              node={child as any}
              depth={depth + 1}
              onReply={onReply}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function Avatar({ author, small }: { author: Author; small?: boolean }) {
  const size = small ? 'h-7 w-7 text-[10px]' : 'h-9 w-9 text-xs';
  if (author.avatarUrl && !author.isAnonymous) {
    return (
      <img src={author.avatarUrl} alt="" className={`${size} rounded-full object-cover shrink-0`} />
    );
  }
  if (author.isAnonymous) {
    return (
      <div
        className={`${size} rounded-full bg-secondary flex items-center justify-center shrink-0`}
      >
        <UserIcon className={small ? 'h-3 w-3' : 'h-4 w-4'} />
      </div>
    );
  }
  const initials = author.displayName
    .split(' ')
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
  return (
    <div
      className={`${size} rounded-full bg-primary/20 text-primary flex items-center justify-center font-semibold shrink-0`}
    >
      {initials}
    </div>
  );
}

function timeAgo(date: Date): string {
  const sec = Math.floor((Date.now() - date.getTime()) / 1000);
  if (sec < 60) return 'just now';
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const days = Math.floor(hr / 24);
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString();
}
