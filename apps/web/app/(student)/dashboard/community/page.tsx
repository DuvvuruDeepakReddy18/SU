'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { api } from '@/lib/api';
import { Heart, MessageCircle, Send, Trash2, User as UserIcon } from 'lucide-react';
import { toast } from 'sonner';

type Author = {
  displayName: string;
  avatarUrl: string | null;
  slug: string | null;
  isAnonymous: boolean;
};

type Post = {
  id: string;
  body: string;
  tags: string[];
  visibility: string;
  likes: number;
  commentsCount: number;
  likedByMe: boolean;
  canDelete: boolean;
  createdAt: string;
  author: Author;
};

type Comment = {
  id: string;
  body: string;
  createdAt: string;
  author: Author;
};

export default function CommunityPage() {
  const { data: session } = useSession();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const token = (session as any)?.accessToken as string | undefined;
  const qc = useQueryClient();

  const [body, setBody] = useState('');
  const [anon, setAnon] = useState(false);
  const [scope, setScope] = useState<'all' | 'mine'>('all');

  // Used to label the "My institute" tab.
  const { data: profile } = useQuery({
    enabled: !!token,
    queryKey: ['profile.me'],
    queryFn: () =>
      api<{ user: { institution: { name: string } | null } }>('/profile/me', { token }),
  });

  const { data } = useQuery({
    enabled: !!token,
    queryKey: ['community.posts', scope],
    queryFn: () =>
      api<{ items: Post[]; total: number }>(`/community/posts?scope=${scope}`, { token }),
  });

  const post = useMutation({
    mutationFn: () =>
      api('/community/posts', {
        method: 'POST',
        token,
        body: JSON.stringify({ body, tags: [], isAnonymous: anon, visibility: 'public' }),
      }),
    onSuccess: () => {
      setBody('');
      qc.invalidateQueries({ queryKey: ['community.posts'] });
    },
    onError: (e) => toast.error((e as Error).message),
  });

  const like = useMutation({
    mutationFn: (id: string) =>
      api<{ liked: boolean; likes: number }>(`/community/posts/${id}/like`, {
        method: 'POST',
        token,
      }),
    onMutate: async (id: string) => {
      // Optimistic: toggle locally
      await qc.cancelQueries({ queryKey: ['community.posts'] });
      const prev = qc.getQueryData<{ items: Post[] }>(['community.posts']);
      qc.setQueryData<{ items: Post[]; total: number }>(['community.posts'], (old) => {
        if (!old) return old as never;
        return {
          ...old,
          items: old.items.map((p) =>
            p.id === id
              ? { ...p, likedByMe: !p.likedByMe, likes: p.likes + (p.likedByMe ? -1 : 1) }
              : p,
          ),
        };
      });
      return { prev };
    },
    onError: (_e, _id, ctx) => {
      if (ctx?.prev) qc.setQueryData(['community.posts'], ctx.prev);
    },
    onSettled: () => qc.invalidateQueries({ queryKey: ['community.posts'] }),
  });

  const remove = useMutation({
    mutationFn: (id: string) => api(`/community/posts/${id}`, { method: 'DELETE', token }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['community.posts'] }),
  });

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Community</h1>
          <p className="text-sm text-muted-foreground">
            Network, discuss, share — across institutes.
          </p>
        </div>
        <div className="inline-flex rounded-md border bg-secondary/30 p-1 text-sm">
          <button
            onClick={() => setScope('all')}
            className={`rounded px-3 py-1 transition ${scope === 'all' ? 'bg-background shadow-sm' : 'text-muted-foreground'}`}
          >
            All
          </button>
          <button
            onClick={() => setScope('mine')}
            className={`rounded px-3 py-1 transition ${scope === 'mine' ? 'bg-background shadow-sm' : 'text-muted-foreground'}`}
          >
            {profile?.user?.institution?.name ?? 'My institute'}
          </button>
        </div>
      </div>

      {/* Composer */}
      <Card>
        <CardContent className="p-4 space-y-3">
          <textarea
            className="w-full min-h-[90px] resize-none rounded-md border border-input bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
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

      {/* Feed */}
      <div className="space-y-4">
        {data?.items.length === 0 && (
          <Card>
            <CardContent className="py-12 text-center text-sm text-muted-foreground">
              No posts yet — be the first to start a conversation.
            </CardContent>
          </Card>
        )}
        {data?.items.map((p) => (
          <PostCard
            key={p.id}
            post={p}
            token={token}
            onLike={() => like.mutate(p.id)}
            onDelete={() => remove.mutate(p.id)}
          />
        ))}
      </div>
    </div>
  );
}

// ---------- subcomponents ----------

function PostCard({
  post,
  token,
  onLike,
  onDelete,
}: {
  post: Post;
  token?: string;
  onLike: () => void;
  onDelete: () => void;
}) {
  const [showComments, setShowComments] = useState(false);
  const ago = timeAgo(new Date(post.createdAt));

  return (
    <Card>
      <CardContent className="p-5 space-y-3">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <Avatar author={post.author} />
            <div>
              <div className="text-sm font-medium">
                {post.author.slug && !post.author.isAnonymous ? (
                  <Link href={`/u/${post.author.slug}`} className="hover:underline">
                    {post.author.displayName}
                  </Link>
                ) : (
                  post.author.displayName
                )}
              </div>
              <div className="text-xs text-muted-foreground flex items-center gap-2">
                <span>{ago}</span>
                {post.visibility === 'college_only' && (
                  <Badge variant="outline" className="text-[10px] h-4">
                    college
                  </Badge>
                )}
              </div>
            </div>
          </div>
          {post.canDelete && (
            <button
              onClick={onDelete}
              className="text-muted-foreground hover:text-destructive transition"
              aria-label="Delete post"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Body */}
        <p className="text-sm whitespace-pre-wrap leading-relaxed">{post.body}</p>

        {/* Action row */}
        <div className="flex items-center gap-1 pt-1">
          <button
            onClick={onLike}
            className={`flex items-center gap-1.5 rounded-md px-2 py-1 text-xs transition ${
              post.likedByMe
                ? 'text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40'
                : 'text-muted-foreground hover:bg-secondary'
            }`}
          >
            <Heart className={`h-4 w-4 ${post.likedByMe ? 'fill-current' : ''}`} />
            <span>{post.likes}</span>
          </button>
          <button
            onClick={() => setShowComments((s) => !s)}
            className="flex items-center gap-1.5 rounded-md px-2 py-1 text-xs text-muted-foreground hover:bg-secondary transition"
          >
            <MessageCircle className="h-4 w-4" />
            <span>{post.commentsCount}</span>
          </button>
        </div>

        {showComments && <CommentThread postId={post.id} token={token} />}
      </CardContent>
    </Card>
  );
}

function CommentThread({ postId, token }: { postId: string; token?: string }) {
  const qc = useQueryClient();
  const [body, setBody] = useState('');
  const [anon, setAnon] = useState(false);

  const { data } = useQuery({
    queryKey: ['community.comments', postId],
    queryFn: () => api<Comment[]>(`/community/posts/${postId}/comments`, { token }),
  });

  const add = useMutation({
    mutationFn: () =>
      api(`/community/posts/${postId}/comments`, {
        method: 'POST',
        token,
        body: JSON.stringify({ body, isAnonymous: anon }),
      }),
    onSuccess: () => {
      setBody('');
      qc.invalidateQueries({ queryKey: ['community.comments', postId] });
      qc.invalidateQueries({ queryKey: ['community.posts'] });
    },
    onError: (e) => toast.error((e as Error).message),
  });

  return (
    <div className="mt-3 space-y-3 border-t pt-3">
      {data?.length === 0 && (
        <p className="text-xs text-muted-foreground italic">No comments yet — start the thread.</p>
      )}
      <div className="space-y-3">
        {data?.map((c) => (
          <div key={c.id} className="flex items-start gap-3">
            <Avatar author={c.author} small />
            <div className="flex-1">
              <div className="rounded-lg bg-secondary px-3 py-2">
                <div className="text-xs font-medium">
                  {c.author.slug && !c.author.isAnonymous ? (
                    <Link href={`/u/${c.author.slug}`} className="hover:underline">
                      {c.author.displayName}
                    </Link>
                  ) : (
                    c.author.displayName
                  )}
                </div>
                <div className="text-sm mt-0.5 whitespace-pre-wrap">{c.body}</div>
              </div>
              <div className="text-[10px] text-muted-foreground mt-1 px-1">
                {timeAgo(new Date(c.createdAt))}
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className="flex items-start gap-2">
        <input
          className="flex-1 rounded-full border border-input bg-transparent px-4 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
          placeholder={anon ? 'Comment anonymously…' : 'Write a comment…'}
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
