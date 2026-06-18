'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { Bot, Trash2, Plus } from 'lucide-react';

type Knowledge = {
  id: string;
  title: string;
  content: string;
  source: string | null;
  createdAt: string;
};

export default function KnowledgePage() {
  const { data: session } = useSession();
  const token = session?.accessToken as string | undefined;
  const qc = useQueryClient();

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');

  const { data: items } = useQuery({
    enabled: !!token,
    queryKey: ['institution.knowledge'],
    queryFn: () => api<Knowledge[]>('/institution-admin/knowledge', { token }),
  });

  const add = useMutation({
    mutationFn: () =>
      api('/institution-admin/knowledge', {
        method: 'POST',
        token,
        body: JSON.stringify({ title: title.trim(), content: content.trim() }),
      }),
    onSuccess: () => {
      toast.success('Fact added');
      setTitle('');
      setContent('');
      qc.invalidateQueries({ queryKey: ['institution.knowledge'] });
    },
    onError: (e) => toast.error((e as Error).message),
  });

  const remove = useMutation({
    mutationFn: (id: string) =>
      api(`/institution-admin/knowledge/${id}`, { method: 'DELETE', token }),
    onSuccess: () => {
      toast.success('Removed');
      qc.invalidateQueries({ queryKey: ['institution.knowledge'] });
    },
    onError: (e) => toast.error((e as Error).message),
  });

  const canAdd = title.trim().length >= 2 && content.trim().length >= 5;

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-semibold">
          <Bot className="h-6 w-6 text-primary" /> Chatbot knowledge
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Add facts about your college (admissions, fees, courses, hostel, placements, contacts).
          SkillBot answers your students using ONLY these facts, so it never makes things up. Keep
          each entry short and specific.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Add a fact</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <div className="mb-1 text-xs font-medium text-muted-foreground">Title</div>
            <Input
              placeholder="e.g. B.Tech admission process"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>
          <div>
            <div className="mb-1 text-xs font-medium text-muted-foreground">Fact / answer</div>
            <textarea
              className="flex min-h-[90px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              placeholder="e.g. B.Tech admission is through JEE Main followed by counselling. Applications open in May each year."
              value={content}
              onChange={(e) => setContent(e.target.value)}
            />
          </div>
          <Button disabled={!canAdd || add.isPending} onClick={() => add.mutate()}>
            <Plus className="h-4 w-4" /> {add.isPending ? 'Adding…' : 'Add fact'}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Your facts {items ? `(${items.length})` : ''}</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {items && items.length === 0 && (
            <p className="px-6 py-6 text-sm text-muted-foreground">
              No facts yet. Add a few above and your students&apos; SkillBot will answer from them.
            </p>
          )}
          <ul className="divide-y">
            {items?.map((k) => (
              <li key={k.id} className="flex items-start justify-between gap-3 px-6 py-4">
                <div className="min-w-0">
                  <div className="text-sm font-medium">{k.title}</div>
                  <div className="mt-0.5 text-sm text-muted-foreground">{k.content}</div>
                </div>
                <button
                  onClick={() => remove.mutate(k.id)}
                  className="shrink-0 text-muted-foreground hover:text-destructive"
                  aria-label="Delete fact"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
