'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from 'sonner';
import { Plus, Trophy, Users, Trash2 } from 'lucide-react';

type Competition = {
  id: string;
  title: string;
  category: string;
  startsAt: string;
  endsAt: string;
  _count: { entries: number };
};

const CATEGORIES = [
  'case',
  'video_editing',
  'marketing',
  'debate',
  'art',
  'competitive_programming',
  'hackathon',
];

export default function CompetitionsPage() {
  const { data: session } = useSession();

  const token = session?.accessToken as string | undefined;
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    title: '',
    category: 'hackathon',
    description: '',
    prizes: '',
    startsAt: '',
    endsAt: '',
  });

  const { data: comps } = useQuery({
    enabled: !!token,
    queryKey: ['institution-admin.competitions'],
    queryFn: () => api<Competition[]>('/institution-admin/competitions', { token }),
  });

  const create = useMutation({
    mutationFn: () =>
      api('/institution-admin/competitions', {
        method: 'POST',
        token,
        body: JSON.stringify({
          title: form.title,
          category: form.category,
          description: form.description,
          prizes: form.prizes.trim() || undefined,
          startsAt: form.startsAt,
          endsAt: form.endsAt,
        }),
      }),
    onSuccess: () => {
      toast.success('Competition posted');
      setOpen(false);
      setForm({
        title: '',
        category: 'hackathon',
        description: '',
        prizes: '',
        startsAt: '',
        endsAt: '',
      });
      qc.invalidateQueries({ queryKey: ['institution-admin.competitions'] });
    },
    onError: (e) => toast.error((e as Error).message.slice(0, 160)),
  });

  const remove = useMutation({
    mutationFn: (id: string) =>
      api(`/institution-admin/competitions/${id}`, { method: 'DELETE', token }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['institution-admin.competitions'] }),
  });

  const valid = form.title.trim() && form.description.trim() && form.startsAt && form.endsAt;

  return (
    <div className="max-w-4xl space-y-5">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Competitions</h1>
          <p className="text-sm text-muted-foreground">
            Institute-only contests, visible to your students.
          </p>
        </div>
        <Button onClick={() => setOpen((o) => !o)} className="gap-1">
          <Plus className="h-4 w-4" /> Post a competition
        </Button>
      </div>

      {open && (
        <Card>
          <CardContent className="p-4 space-y-3">
            <div className="grid gap-2 sm:grid-cols-2">
              <Input
                placeholder="Title *"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
              />
              <select
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                className="rounded-md border border-input bg-transparent px-3 py-2 text-sm"
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c.replace('_', ' ')}
                  </option>
                ))}
              </select>
            </div>
            <textarea
              placeholder="Description *"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={2}
              className="w-full resize-none rounded-md border border-input bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
            />
            <Input
              placeholder="Prizes (optional)"
              value={form.prizes}
              onChange={(e) => setForm({ ...form, prizes: e.target.value })}
            />
            <div className="grid gap-2 sm:grid-cols-2">
              <label className="text-xs text-muted-foreground">
                Starts
                <Input
                  type="date"
                  value={form.startsAt}
                  onChange={(e) => setForm({ ...form, startsAt: e.target.value })}
                />
              </label>
              <label className="text-xs text-muted-foreground">
                Ends
                <Input
                  type="date"
                  value={form.endsAt}
                  onChange={(e) => setForm({ ...form, endsAt: e.target.value })}
                />
              </label>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button disabled={!valid || create.isPending} onClick={() => create.mutate()}>
                {create.isPending ? 'Posting…' : 'Post competition'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {(comps?.length ?? 0) === 0 ? (
        <div className="rounded-xl border border-dashed p-10 text-center text-sm text-muted-foreground">
          <Trophy className="mx-auto mb-2 h-6 w-6" />
          No competitions yet.
        </div>
      ) : (
        <div className="space-y-3">
          {comps?.map((c) => (
            <Card key={c.id}>
              <CardContent className="flex items-start justify-between gap-4 p-4">
                <div className="min-w-0">
                  <div className="font-medium">{c.title}</div>
                  <div className="mt-0.5 flex flex-wrap gap-x-3 text-xs text-muted-foreground">
                    <span>{c.category.replace('_', ' ')}</span>
                    <span>
                      {new Date(c.startsAt).toLocaleDateString()} –{' '}
                      {new Date(c.endsAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                    <Users className="h-3.5 w-3.5" /> {c._count.entries}
                  </span>
                  <button
                    onClick={() => remove.mutate(c.id)}
                    aria-label="Delete competition"
                    className="rounded-md p-1.5 text-muted-foreground hover:bg-secondary"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
