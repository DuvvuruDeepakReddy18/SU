'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { Trophy, Plus, Calendar, ListOrdered } from 'lucide-react';
import { OpportunitiesTabs } from '@/components/opportunities-tabs';
import { CompetitionRounds } from '@/components/competition-rounds';

type Competition = {
  id: string;
  title: string;
  category: string;
  description: string;
  prizes: string | null;
  startsAt: string;
  endsAt: string;
  bannerUrl: string | null;
  postedById: string | null;
  _count: { entries: number };
};

const CATEGORIES = [
  { value: '', label: 'All' },
  { value: 'case', label: 'Case Competition' },
  { value: 'video_editing', label: 'Video Editing' },
  { value: 'marketing', label: 'Marketing' },
  { value: 'debate', label: 'Debate' },
  { value: 'art', label: 'Drawing / Art' },
  { value: 'competitive_programming', label: 'Competitive Programming' },
  { value: 'hackathon', label: 'Hackathon' },
];

export default function CompetePage() {
  const { data: session } = useSession();

  const token = session?.accessToken as string | undefined;
  const currentUserId = session?.userId;
  const qc = useQueryClient();
  const [tab, setTab] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [openRounds, setOpenRounds] = useState<string | null>(null);
  const [form, setForm] = useState({
    title: '',
    category: 'case',
    description: '',
    prizes: '',
    startsAt: '',
    endsAt: '',
  });

  const { data } = useQuery({
    queryKey: ['compete', tab],
    queryFn: () => api<Competition[]>(`/competitions${tab ? `?category=${tab}` : ''}`),
  });

  const post = useMutation({
    mutationFn: () => api('/competitions', { method: 'POST', token, body: JSON.stringify(form) }),
    onSuccess: () => {
      toast.success('Competition posted');
      setShowForm(false);
      qc.invalidateQueries({ queryKey: ['compete'] });
    },
    onError: (e) => toast.error((e as Error).message),
  });

  const enter = useMutation({
    mutationFn: (id: string) =>
      api(`/competitions/${id}/enter`, { method: 'POST', token, body: '{}' }),
    onSuccess: () => toast.success('Entered'),
    onError: (e) => toast.error((e as Error).message),
  });

  return (
    <div className="space-y-4">
      <OpportunitiesTabs />
      <div className="space-y-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-semibold">Competitions</h1>
            <p className="text-sm text-muted-foreground">
              Participate, compete, and earn verification levels.
            </p>
          </div>
          <Button onClick={() => setShowForm(!showForm)}>
            <Plus className="h-4 w-4" /> Host competition
          </Button>
        </div>

        <div className="flex flex-wrap gap-1">
          {CATEGORIES.map((c) => (
            <button
              key={c.value || 'all'}
              onClick={() => setTab(c.value)}
              className={`rounded-md border px-3 py-1 text-xs ${tab === c.value ? 'bg-primary text-primary-foreground' : ''}`}
            >
              {c.label}
            </button>
          ))}
        </div>

        {showForm && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Host a competition</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3 md:grid-cols-2">
              <Input
                placeholder="Title"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
              />
              <select
                className="rounded-md border bg-background px-3 py-2 text-sm"
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
              >
                {CATEGORIES.filter((c) => c.value).map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>
              <textarea
                className="md:col-span-2 flex min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm"
                placeholder="Description"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
              <Input
                placeholder="Prizes (e.g. 1st: $500, 2nd: $300)"
                value={form.prizes}
                onChange={(e) => setForm({ ...form, prizes: e.target.value })}
              />
              <div className="grid grid-cols-2 gap-2">
                <Input
                  type="datetime-local"
                  value={form.startsAt}
                  onChange={(e) => setForm({ ...form, startsAt: e.target.value })}
                />
                <Input
                  type="datetime-local"
                  value={form.endsAt}
                  onChange={(e) => setForm({ ...form, endsAt: e.target.value })}
                />
              </div>
              <div className="md:col-span-2">
                <Button
                  onClick={() => post.mutate()}
                  disabled={post.isPending || !form.title || !form.startsAt || !form.endsAt}
                >
                  Post
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid gap-4 md:grid-cols-2">
          {data?.length === 0 && (
            <Card className="md:col-span-2">
              <CardContent className="p-12 text-center text-sm text-muted-foreground">
                <Trophy className="h-8 w-8 mx-auto mb-2 opacity-50" />
                No competitions yet — be the first to host one.
              </CardContent>
            </Card>
          )}
          {data?.map((c) => (
            <Card key={c.id}>
              <CardContent className="p-5 space-y-3">
                <Badge variant="default" className="capitalize">
                  {c.category.replace('_', ' ')}
                </Badge>
                <div className="font-semibold text-lg">{c.title}</div>
                <p className="text-sm text-muted-foreground">{c.description}</p>
                <div className="text-xs text-muted-foreground flex items-center gap-1">
                  <Calendar className="h-3 w-3" /> {new Date(c.startsAt).toLocaleDateString()} →{' '}
                  {new Date(c.endsAt).toLocaleDateString()}
                </div>
                {c.prizes && (
                  <div className="text-xs text-amber-600 dark:text-amber-400">🏆 {c.prizes}</div>
                )}
                <div className="flex items-center justify-between pt-2">
                  <span className="text-xs text-muted-foreground">{c._count.entries} entries</span>
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setOpenRounds(openRounds === c.id ? null : c.id)}
                    >
                      <ListOrdered className="h-3.5 w-3.5" /> Rounds
                    </Button>
                    <Button size="sm" onClick={() => enter.mutate(c.id)}>
                      Enter Competition
                    </Button>
                  </div>
                </div>
                {openRounds === c.id && (
                  <CompetitionRounds
                    competitionId={c.id}
                    isOrganiser={!!currentUserId && c.postedById === currentUserId}
                    currentUserId={currentUserId}
                    token={token}
                    onClose={() => setOpenRounds(null)}
                  />
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
