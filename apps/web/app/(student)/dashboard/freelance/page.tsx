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
import { Briefcase, Plus } from 'lucide-react';

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
  provider: {
    studentProfile: { fullName: string; avatarUrl: string | null; sharableSlug: string } | null;
  };
};

const CATS = [
  { value: '', label: 'All' },
  { value: 'development', label: 'Development' },
  { value: 'design', label: 'Design' },
  { value: 'marketing', label: 'Marketing' },
  { value: 'data_science', label: 'Data Science' },
  { value: 'video_editing', label: 'Video Editing' },
  { value: 'writing', label: 'Writing' },
  { value: 'other', label: 'Other' },
];

export default function FreelancePage() {
  const { data: session } = useSession();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const token = (session as any)?.accessToken as string | undefined;
  const qc = useQueryClient();
  const [tab, setTab] = useState('');
  const [q, setQ] = useState('');
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
    queryKey: ['freelance', tab, q],
    queryFn: () => api<Service[]>(`/freelance/services?category=${tab}&q=${encodeURIComponent(q)}`),
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
      <div className="text-center py-6">
        <h1 className="text-3xl font-semibold">
          Find the perfect <span className="text-primary">professional</span>
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Verified freelancers ready to bring your ideas to life.
        </p>
        <div className="mt-4 flex max-w-xl mx-auto gap-2">
          <Input
            placeholder="What service are you looking for?"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-1">
          {CATS.map((c) => (
            <button
              key={c.value || 'all'}
              onClick={() => setTab(c.value)}
              className={`rounded-md border px-3 py-1 text-xs ${tab === c.value ? 'bg-primary text-primary-foreground' : ''}`}
            >
              {c.label}
            </button>
          ))}
        </div>
        <Button onClick={() => setShowForm(!showForm)} size="sm">
          <Plus className="h-4 w-4" /> List Service
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">List a service</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 md:grid-cols-2">
            <Input
              placeholder="Service title"
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
                  {c.label}
                </option>
              ))}
            </select>
            <textarea
              className="md:col-span-2 flex min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm"
              placeholder="Description — what you'll deliver"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
            <Input
              placeholder="Starting price"
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
              placeholder="Skills (comma-separated)"
              value={form.skills}
              onChange={(e) => setForm({ ...form, skills: e.target.value })}
            />
            <Input
              placeholder="Location"
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
            <div className="md:col-span-2">
              <Button
                onClick={() => post.mutate()}
                disabled={post.isPending || !form.title || !form.description}
              >
                List Service
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
        {data?.length === 0 && (
          <Card className="md:col-span-2 lg:col-span-3">
            <CardContent className="p-12 text-center text-sm text-muted-foreground">
              <Briefcase className="h-8 w-8 mx-auto mb-2 opacity-50" />
              No services yet.
            </CardContent>
          </Card>
        )}
        {data?.map((s) => (
          <Card key={s.id}>
            <CardContent className="p-5 space-y-3">
              <Badge variant="outline" className="capitalize">
                {s.category.replace('_', ' ')}
              </Badge>
              <div className="font-semibold">{s.title}</div>
              <p className="text-sm text-muted-foreground line-clamp-3">{s.description}</p>
              {s.skills.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {s.skills.slice(0, 4).map((sk) => (
                    <Badge key={sk} variant="secondary">
                      {sk}
                    </Badge>
                  ))}
                </div>
              )}
              <div className="flex items-center justify-between pt-2 text-xs text-muted-foreground">
                <span>by {s.provider.studentProfile?.fullName ?? 'Unknown'}</span>
                {s.priceFrom != null && (
                  <span>
                    from ₹{s.priceFrom} / {s.priceUnit ?? 'project'}
                  </span>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
