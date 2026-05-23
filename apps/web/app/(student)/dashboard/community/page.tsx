'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { api } from '@/lib/api';
import { ArrowUp, ArrowDown } from 'lucide-react';
import { toast } from 'sonner';

type Post = {
  id: string;
  body: string;
  tags: string[];
  visibility: string;
  upvotes: number;
  downvotes: number;
  createdAt: string;
  author: { displayName: string; avatarUrl: string | null; slug: string | null };
};

export default function CommunityPage() {
  const { data: session } = useSession();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const token = (session as any)?.accessToken as string | undefined;
  const qc = useQueryClient();

  const { data } = useQuery({
    enabled: !!token,
    queryKey: ['community.posts'],
    queryFn: () => api<{ items: Post[] }>('/community/posts', { token }),
  });

  const [body, setBody] = useState('');
  const [anon, setAnon] = useState(false);

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

  const vote = useMutation({
    mutationFn: ({ id, v }: { id: string; v: 1 | -1 }) =>
      api(`/community/posts/${id}/vote`, {
        method: 'POST',
        token,
        body: JSON.stringify({ value: v }),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['community.posts'] }),
  });

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_350px]">
      <div className="space-y-3">
        {data?.items.map((p) => (
          <Card key={p.id}>
            <CardContent className="pt-6 space-y-3">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>
                  {p.author.displayName} · {new Date(p.createdAt).toLocaleString()}
                </span>
                <Badge variant="outline">{p.visibility}</Badge>
              </div>
              <p className="text-sm whitespace-pre-wrap">{p.body}</p>
              <div className="flex items-center gap-2 text-xs">
                <Button size="sm" variant="ghost" onClick={() => vote.mutate({ id: p.id, v: 1 })}>
                  <ArrowUp className="h-3.5 w-3.5" /> {p.upvotes}
                </Button>
                <Button size="sm" variant="ghost" onClick={() => vote.mutate({ id: p.id, v: -1 })}>
                  <ArrowDown className="h-3.5 w-3.5" /> {p.downvotes}
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
        {data?.items.length === 0 && (
          <p className="text-sm text-muted-foreground">No posts yet — be the first.</p>
        )}
      </div>

      <Card className="h-fit">
        <CardHeader>
          <CardTitle>New post</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <textarea
            className="min-h-[120px] w-full rounded border bg-transparent p-2 text-sm"
            placeholder="Share a tip, ask a question…"
            value={body}
            onChange={(e) => setBody(e.target.value)}
          />
          <label className="flex items-center gap-2 text-xs">
            <input type="checkbox" checked={anon} onChange={(e) => setAnon(e.target.checked)} />
            Post anonymously
          </label>
          <Button onClick={() => post.mutate()} disabled={!body || post.isPending}>
            Post
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
