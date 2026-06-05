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
import { Building2, Plus } from 'lucide-react';
import { OpportunitiesTabs } from '@/components/opportunities-tabs';

type Drive = {
  id: string;
  company: string;
  role: string;
  description: string | null;
  packageLpa: number | null;
  minLevel: string;
  jobType: string;
  skills: string[];
  location: string | null;
  scope: string;
  closesAt: string | null;
  _count: { applications: number };
};

// Internships have their own board (/dashboard/internships), so they're
// excluded here.
const TYPES = [
  { value: '', label: 'All jobs' },
  { value: 'full_time', label: 'Full-Time' },
  { value: 'contract', label: 'Contract' },
  { value: 'ppo', label: 'PPO' },
];

export default function PlacementsPage() {
  const { data: session } = useSession();

  const token = session?.accessToken as string | undefined;
  const qc = useQueryClient();
  const [tab, setTab] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    company: '',
    role: '',
    description: '',
    packageLpa: '',
    minLevel: 'L3_PROVEN',
    jobType: 'full_time',
    skills: '',
    location: '',
  });

  const { data: drives } = useQuery({
    enabled: !!token,
    queryKey: ['placements', tab],
    queryFn: () =>
      api<Drive[]>(
        // A specific type filters to it; "All" excludes internships (they have
        // their own board).
        `/placements?${tab ? `jobType=${tab}` : 'excludeJobType=internship'}`,
        { token },
      ),
  });

  const post = useMutation({
    mutationFn: () =>
      api('/placements', {
        method: 'POST',
        token,
        body: JSON.stringify({
          ...form,
          packageLpa: form.packageLpa ? Number(form.packageLpa) : undefined,
          skills: form.skills
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean),
        }),
      }),
    onSuccess: () => {
      toast.success('Drive posted');
      setShowForm(false);
      qc.invalidateQueries({ queryKey: ['placements'] });
    },
    onError: (e) => toast.error((e as Error).message),
  });

  const apply = useMutation({
    mutationFn: (id: string) => api(`/placements/${id}/apply`, { method: 'POST', token }),
    onSuccess: () => toast.success('Application sent'),
    onError: (e) => toast.error((e as Error).message),
  });

  return (
    <div className="space-y-4">
      <OpportunitiesTabs />
      <div className="space-y-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-semibold">Campus Placement Board</h1>
            <p className="text-sm text-muted-foreground">
              Verified skills meet real opportunities. L3+ auto-qualifies for most drives.
            </p>
          </div>
          <Button onClick={() => setShowForm(!showForm)}>
            <Plus className="h-4 w-4" /> Post Drive
          </Button>
        </div>

        <div className="flex flex-wrap gap-1">
          {TYPES.map((t) => (
            <button
              key={t.value || 'all'}
              onClick={() => setTab(t.value)}
              className={`rounded-md border px-3 py-1 text-xs ${tab === t.value ? 'bg-primary text-primary-foreground' : ''}`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {showForm && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Post Placement Drive</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3 md:grid-cols-2">
              <Input
                placeholder="Company (e.g. Google)"
                value={form.company}
                onChange={(e) => setForm({ ...form, company: e.target.value })}
              />
              <Input
                placeholder="Role (e.g. SDE-1)"
                value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value })}
              />
              <textarea
                className="md:col-span-2 flex min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm"
                placeholder="Description"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
              <Input
                placeholder="Package (LPA)"
                type="number"
                value={form.packageLpa}
                onChange={(e) => setForm({ ...form, packageLpa: e.target.value })}
              />
              <select
                className="rounded-md border bg-background px-3 py-2 text-sm"
                value={form.minLevel}
                onChange={(e) => setForm({ ...form, minLevel: e.target.value })}
              >
                <option value="L0_UNVERIFIED">L0 — anyone</option>
                <option value="L1_ACADEMIC">L1 — Academic</option>
                <option value="L2_CERTIFIED">L2 — Certified</option>
                <option value="L3_PROVEN">L3 — Proven (recommended)</option>
                <option value="L4_EXPERT">L4 — Expert</option>
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
              <div className="md:col-span-2">
                <Button
                  onClick={() => post.mutate()}
                  disabled={post.isPending || !form.company || !form.role}
                >
                  Post Drive
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="space-y-3">
          {drives?.length === 0 && (
            <Card>
              <CardContent className="p-12 text-center text-sm text-muted-foreground">
                <Building2 className="h-8 w-8 mx-auto mb-2 opacity-50" />
                No drives yet.
              </CardContent>
            </Card>
          )}
          {drives?.map((d) => (
            <Card key={d.id}>
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="font-semibold text-lg">
                      {d.role} · {d.company}
                    </div>
                    <div className="text-xs text-muted-foreground capitalize">
                      {d.jobType.replace('_', ' ')} · {d.location ?? 'Remote'}
                      {d.packageLpa != null && ` · ${d.packageLpa} LPA`}
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <Badge variant={d.minLevel === 'L0_UNVERIFIED' ? 'secondary' : 'default'}>
                      Min: {d.minLevel.replace('_', ' ')}
                    </Badge>
                    <Button size="sm" onClick={() => apply.mutate(d.id)}>
                      Apply
                    </Button>
                  </div>
                </div>
                {d.description && (
                  <p className="mt-3 text-sm text-muted-foreground">{d.description}</p>
                )}
                {d.skills.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1">
                    {d.skills.map((s) => (
                      <Badge key={s} variant="outline">
                        {s}
                      </Badge>
                    ))}
                  </div>
                )}
                <div className="mt-3 text-xs text-muted-foreground">
                  {d._count.applications} applicant{d._count.applications === 1 ? '' : 's'}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
