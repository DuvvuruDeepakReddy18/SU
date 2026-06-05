'use client';

import { useMemo, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { api } from '@/lib/api';
import { Search, Inbox } from 'lucide-react';
import { cn } from '@/lib/utils';
import { CandidateCardView, type CandidateCard } from '@/components/company/candidate-card';

type SearchResult = { items: CandidateCard[]; total: number; page: number; pageSize: number };

const LAYER_FILTERS = [
  { value: '', label: 'Any layer' },
  { value: 'L1_ACADEMIC', label: 'L1+' },
  { value: 'L2_CERTIFIED', label: 'L2+' },
  { value: 'L3_PROVEN', label: 'L3+' },
  { value: 'L4_EXPERT', label: 'L4' },
];

export default function CandidatesPage() {
  const { data: session } = useSession();

  const token = session?.accessToken as string | undefined;
  const qc = useQueryClient();

  const [q, setQ] = useState('');
  const [skill, setSkill] = useState('');
  const [minLayer, setMinLayer] = useState('');
  const [location, setLocation] = useState('');
  // Applied filters (only change on submit) so we don't fire a query per keystroke.
  const [applied, setApplied] = useState({ q: '', skill: '', minLayer: '', location: '' });

  const queryString = useMemo(() => {
    const p = new URLSearchParams();
    if (applied.q) p.set('q', applied.q);
    if (applied.skill) p.set('skill', applied.skill);
    if (applied.minLayer) p.set('minLayer', applied.minLayer);
    if (applied.location) p.set('location', applied.location);
    p.set('pageSize', '24');
    return p.toString();
  }, [applied]);

  const { data, isLoading } = useQuery({
    enabled: !!token,
    queryKey: ['recruiters.candidates', queryString],
    queryFn: () => api<SearchResult>(`/recruiters/candidates?${queryString}`, { token }),
  });

  const { data: saved } = useQuery({
    enabled: !!token,
    queryKey: ['recruiters.saved'],
    queryFn: () => api<{ candidate: { userId: string } }[]>('/recruiters/saved', { token }),
  });
  const savedIds = new Set(saved?.map((s) => s.candidate.userId));

  const toggleSave = useMutation({
    mutationFn: ({ id, isSaved }: { id: string; isSaved: boolean }) =>
      api(`/recruiters/saved/${id}`, {
        method: isSaved ? 'DELETE' : 'POST',
        token,
        body: isSaved ? undefined : JSON.stringify({}),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['recruiters.saved'] }),
  });

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setApplied({ q, skill, minLayer, location });
  }

  return (
    <div className="space-y-5 max-w-5xl">
      <div>
        <h1 className="text-2xl font-semibold">Find candidates</h1>
        <p className="text-sm text-muted-foreground">
          Every result is a verified, public student profile. Contact unlocks when they accept your
          message.
        </p>
      </div>

      {/* Filters */}
      <form onSubmit={submit} className="rounded-xl border bg-card p-3 space-y-3">
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          <Input placeholder="Name or headline" value={q} onChange={(e) => setQ(e.target.value)} />
          <Input
            placeholder="Skill (e.g. React)"
            value={skill}
            onChange={(e) => setSkill(e.target.value)}
          />
          <Input
            placeholder="Location"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
          />
          <Button type="submit" className="gap-1">
            <Search className="h-4 w-4" /> Search
          </Button>
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-xs text-muted-foreground mr-1">Min verification:</span>
          {LAYER_FILTERS.map((f) => (
            <button
              key={f.value}
              type="button"
              onClick={() => {
                setMinLayer(f.value);
                setApplied((a) => ({ ...a, minLayer: f.value }));
              }}
              className={cn(
                'rounded-full border px-2.5 py-1 text-xs transition',
                minLayer === f.value
                  ? 'border-primary bg-primary/10 text-foreground'
                  : 'text-muted-foreground hover:bg-secondary',
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
      </form>

      {/* Results */}
      {isLoading ? (
        <div className="text-sm text-muted-foreground">Searching…</div>
      ) : (data?.items.length ?? 0) === 0 ? (
        <div className="rounded-xl border border-dashed p-10 text-center text-sm text-muted-foreground">
          <Inbox className="mx-auto mb-2 h-6 w-6" />
          No candidates match these filters yet.
        </div>
      ) : (
        <>
          <div className="text-xs text-muted-foreground">{data?.total} candidates</div>
          <div className="grid gap-3 md:grid-cols-2">
            {data?.items.map((c) => (
              <CandidateCardView
                key={c.userId}
                c={c}
                saved={savedIds.has(c.userId)}
                onToggleSave={() =>
                  toggleSave.mutate({ id: c.userId, isSaved: savedIds.has(c.userId) })
                }
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
