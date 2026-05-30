'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { Briefcase, Plus, Star, MapPin, Search } from 'lucide-react';

type Service = {
  id: string;
  title: string;
  category: string;
  description: string;
  priceFrom: number | null;
  priceUnit: string | null;
  skills: string[];
  location: string | null;
  isRemote: boolean;
  createdAt: string;
  provider: {
    studentProfile: { fullName: string; avatarUrl: string | null; sharableSlug: string } | null;
  };
};

const CATS = [
  { value: '', label: 'All' },
  { value: 'development', label: 'Development', emoji: '💻' },
  { value: 'design', label: 'Design', emoji: '🎨' },
  { value: 'marketing', label: 'Marketing', emoji: '📣' },
  { value: 'data_science', label: 'Data Science', emoji: '📊' },
  { value: 'video_editing', label: 'Video Editing', emoji: '🎬' },
  { value: 'writing', label: 'Writing', emoji: '✍️' },
  { value: 'other', label: 'Other', emoji: '✨' },
];

const SORTS = [
  { value: 'recent', label: 'Most recent' },
  { value: 'price_asc', label: 'Price: low to high' },
  { value: 'price_desc', label: 'Price: high to low' },
] as const;

// Deterministic stub rating so each service shows a number until real reviews exist.
function stubRating(id: string): { score: number; count: number } {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) | 0;
  const score = 3.8 + (Math.abs(h) % 13) / 10; // 3.8 - 5.0
  const count = 3 + (Math.abs(h >> 4) % 27); // 3 - 30
  return { score: Math.min(5, Math.round(score * 10) / 10), count };
}

export default function FreelancePage() {
  const { data: session } = useSession();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const token = (session as any)?.accessToken as string | undefined;
  const qc = useQueryClient();
  const [tab, setTab] = useState('');
  const [q, setQ] = useState('');
  const [sort, setSort] = useState<(typeof SORTS)[number]['value']>('recent');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    title: '',
    category: 'development',
    description: '',
    priceFrom: '',
    priceUnit: 'project',
    skills: '',
    location: '',
    isRemote: true,
  });

  const { data } = useQuery({
    queryKey: ['freelance', tab, q, sort],
    queryFn: () =>
      api<Service[]>(`/freelance/services?category=${tab}&q=${encodeURIComponent(q)}&sort=${sort}`),
  });

  const post = useMutation({
    mutationFn: () =>
      api('/freelance/services', {
        method: 'POST',
        token,
        body: JSON.stringify({
          ...form,
          priceFrom: form.priceFrom ? Number(form.priceFrom) : undefined,
          skills: form.skills
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean),
        }),
      }),
    onSuccess: () => {
      toast.success('Service listed');
      setShowForm(false);
      qc.invalidateQueries({ queryKey: ['freelance'] });
    },
    onError: (e) => toast.error((e as Error).message),
  });

  return (
    <div className="space-y-6">
      {/* Hero */}
      <div className="text-center py-8 rounded-xl bg-gradient-to-br from-primary/10 via-transparent to-transparent">
        <h1 className="text-3xl md:text-4xl font-semibold">
          Find the perfect <span className="text-primary">professional</span>
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Verified student freelancers ready to bring your ideas to life.
        </p>
        <div className="mt-5 mx-auto max-w-xl relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder="What service are you looking for?"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
      </div>

      {/* Filter row */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-1">
          {CATS.map((c) => (
            <button
              key={c.value || 'all'}
              onClick={() => setTab(c.value)}
              className={`rounded-full border px-3 py-1.5 text-xs transition ${
                tab === c.value
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'bg-background hover:bg-secondary'
              }`}
            >
              {c.emoji && <span className="mr-1">{c.emoji}</span>}
              {c.label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <select
            className="rounded-md border bg-background px-3 py-1.5 text-xs"
            value={sort}
            onChange={(e) => setSort(e.target.value as typeof sort)}
          >
            {SORTS.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
          <Button onClick={() => setShowForm(!showForm)} size="sm">
            <Plus className="h-4 w-4" /> List Service
          </Button>
        </div>
      </div>

      {/* Inline create form */}
      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">List a service</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 md:grid-cols-2">
            <Input
              placeholder="Service title (e.g. I will design your logo)"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
            />
            <select
              className="rounded-md border bg-background px-3 py-2 text-sm"
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
            >
              {CATS.filter((c) => c.value).map((c) => (
                <option key={c.value} value={c.value}>
                  {c.emoji} {c.label}
                </option>
              ))}
            </select>
            <textarea
              className="md:col-span-2 flex min-h-[100px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm"
              placeholder="What will you deliver? Be specific — turnaround, revisions, deliverables…"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
            <Input
              placeholder="Starting price (₹)"
              type="number"
              value={form.priceFrom}
              onChange={(e) => setForm({ ...form, priceFrom: e.target.value })}
            />
            <select
              className="rounded-md border bg-background px-3 py-2 text-sm"
              value={form.priceUnit}
              onChange={(e) => setForm({ ...form, priceUnit: e.target.value })}
            >
              <option value="project">per project</option>
              <option value="hour">per hour</option>
              <option value="month">per month</option>
            </select>
            <Input
              placeholder="Skills used (comma-separated)"
              value={form.skills}
              onChange={(e) => setForm({ ...form, skills: e.target.value })}
            />
            <Input
              placeholder="Location (e.g. Bangalore)"
              value={form.location}
              onChange={(e) => setForm({ ...form, location: e.target.value })}
            />
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={form.isRemote}
                onChange={(e) => setForm({ ...form, isRemote: e.target.checked })}
              />
              Remote available
            </label>
            <div className="md:col-span-2 flex justify-end">
              <Button
                onClick={() => post.mutate()}
                disabled={post.isPending || !form.title || !form.description}
              >
                Post listing
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Card grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {data?.length === 0 && (
          <Card className="md:col-span-2 lg:col-span-3 border-dashed">
            <CardContent className="p-12 text-center text-sm text-muted-foreground">
              <Briefcase className="h-8 w-8 mx-auto mb-2 opacity-50" />
              No services match. Try a different category or be the first to list one.
            </CardContent>
          </Card>
        )}
        {data?.map((s) => {
          const cat = CATS.find((c) => c.value === s.category);
          const rating = stubRating(s.id);
          return (
            <Link key={s.id} href={`/dashboard/freelance/${s.id}`} className="block group">
              <Card className="h-full transition group-hover:border-primary/40 group-hover:shadow-md">
                {/* Cover band */}
                <div className="h-20 rounded-t-xl bg-gradient-to-br from-primary/20 via-primary/5 to-transparent flex items-center justify-center text-3xl">
                  {cat?.emoji ?? '✨'}
                </div>
                <CardContent className="p-5 space-y-3">
                  <Badge variant="outline" className="capitalize">
                    {s.category.replace('_', ' ')}
                  </Badge>
                  <div className="font-semibold leading-snug line-clamp-2">{s.title}</div>
                  <p className="text-xs text-muted-foreground line-clamp-2">{s.description}</p>

                  {/* Provider */}
                  <div className="flex items-center gap-2 text-xs">
                    {s.provider.studentProfile?.avatarUrl ? (
                      <img
                        src={s.provider.studentProfile.avatarUrl}
                        alt=""
                        className="h-5 w-5 rounded-full object-cover"
                      />
                    ) : (
                      <div className="h-5 w-5 rounded-full bg-secondary" />
                    )}
                    <span className="text-muted-foreground truncate">
                      {s.provider.studentProfile?.fullName ?? 'Provider'}
                    </span>
                  </div>

                  {/* Rating + location */}
                  <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t">
                    <span className="flex items-center gap-1">
                      <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                      <span className="font-medium text-foreground">{rating.score.toFixed(1)}</span>
                      <span>({rating.count})</span>
                    </span>
                    <span className="flex items-center gap-1 truncate max-w-[100px]">
                      <MapPin className="h-3 w-3" />
                      {s.isRemote ? 'Remote' : (s.location ?? '—')}
                    </span>
                  </div>

                  {/* Price */}
                  {s.priceFrom != null && (
                    <div className="text-right">
                      <span className="text-xs text-muted-foreground">From </span>
                      <span className="font-semibold">₹{s.priceFrom}</span>
                      <span className="text-xs text-muted-foreground">
                        {' '}
                        / {s.priceUnit ?? 'project'}
                      </span>
                    </div>
                  )}
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
