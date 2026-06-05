'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from 'sonner';
import { EVENTS, track } from '@/lib/analytics';
import { Plus, Briefcase, Users, Trash2 } from 'lucide-react';

type Job = {
  id: string;
  role: string;
  description: string | null;
  packageLpa: number | null;
  minLevel: string;
  jobType: string;
  skills: string[];
  location: string | null;
  closesAt: string | null;
  _count: { applications: number };
};

const MIN_LEVELS = [
  { value: 'L3_PROVEN', label: 'L3 — Proven (minimum)' },
  { value: 'L4_EXPERT', label: 'L4 — Expert' },
];
const JOB_TYPES = ['full_time', 'internship', 'contract', 'ppo'];

export default function JobsPage() {
  const { data: session } = useSession();

  const token = session?.accessToken as string | undefined;
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    role: '',
    description: '',
    packageLpa: '',
    minLevel: 'L3_PROVEN',
    jobType: 'full_time',
    skills: '',
    location: '',
  });

  const { data: jobs } = useQuery({
    enabled: !!token,
    queryKey: ['recruiters.jobs'],
    queryFn: () => api<Job[]>('/recruiters/jobs', { token }),
  });

  const create = useMutation({
    mutationFn: () =>
      api('/recruiters/jobs', {
        method: 'POST',
        token,
        idempotent: true,
        body: JSON.stringify({
          role: form.role,
          description: form.description.trim() || undefined,
          packageLpa: form.packageLpa ? Number(form.packageLpa) : undefined,
          minLevel: form.minLevel,
          jobType: form.jobType,
          skills: form.skills
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean),
          location: form.location.trim() || undefined,
        }),
      }),
    onSuccess: () => {
      track(EVENTS.JOB_POSTED);
      toast.success('Job posted');
      setOpen(false);
      setForm({
        role: '',
        description: '',
        packageLpa: '',
        minLevel: 'L3_PROVEN',
        jobType: 'full_time',
        skills: '',
        location: '',
      });
      qc.invalidateQueries({ queryKey: ['recruiters.jobs'] });
    },
    onError: (e) => toast.error((e as Error).message.slice(0, 160)),
  });

  const remove = useMutation({
    mutationFn: (id: string) => api(`/recruiters/jobs/${id}`, { method: 'DELETE', token }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['recruiters.jobs'] }),
  });

  return (
    <div className="max-w-4xl space-y-5">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Jobs</h1>
          <p className="text-sm text-muted-foreground">
            Post openings for verified students. Applicants must be L3+ to apply.
          </p>
        </div>
        <Button onClick={() => setOpen((o) => !o)} className="gap-1">
          <Plus className="h-4 w-4" /> Post a job
        </Button>
      </div>

      {open && (
        <Card>
          <CardContent className="p-4 space-y-3">
            <div className="grid gap-2 sm:grid-cols-2">
              <Input
                placeholder="Role (e.g. Frontend Engineer) *"
                value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value })}
              />
              <Input
                placeholder="Location (e.g. Remote / Bangalore)"
                value={form.location}
                onChange={(e) => setForm({ ...form, location: e.target.value })}
              />
            </div>
            <textarea
              placeholder="What's the role? Responsibilities, stack, expectations…"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={3}
              className="w-full resize-none rounded-md border border-input bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
            />
            <div className="grid gap-2 sm:grid-cols-3">
              <Input
                type="number"
                placeholder="Package (LPA)"
                value={form.packageLpa}
                onChange={(e) => setForm({ ...form, packageLpa: e.target.value })}
              />
              <select
                value={form.jobType}
                onChange={(e) => setForm({ ...form, jobType: e.target.value })}
                className="rounded-md border border-input bg-transparent px-3 py-2 text-sm"
              >
                {JOB_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t.replace('_', ' ')}
                  </option>
                ))}
              </select>
              <select
                value={form.minLevel}
                onChange={(e) => setForm({ ...form, minLevel: e.target.value })}
                className="rounded-md border border-input bg-transparent px-3 py-2 text-sm"
              >
                {MIN_LEVELS.map((l) => (
                  <option key={l.value} value={l.value}>
                    {l.label}
                  </option>
                ))}
              </select>
            </div>
            <Input
              placeholder="Required skills, comma-separated (React, TypeScript)"
              value={form.skills}
              onChange={(e) => setForm({ ...form, skills: e.target.value })}
            />
            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button
                disabled={!form.role.trim() || create.isPending}
                onClick={() => create.mutate()}
              >
                {create.isPending ? 'Posting…' : 'Post job'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {(jobs?.length ?? 0) === 0 ? (
        <div className="rounded-xl border border-dashed p-10 text-center text-sm text-muted-foreground">
          <Briefcase className="mx-auto mb-2 h-6 w-6" />
          No jobs posted yet.
        </div>
      ) : (
        <div className="space-y-3">
          {jobs?.map((j) => (
            <Card key={j.id}>
              <CardContent className="flex items-start justify-between gap-4 p-4">
                <div className="min-w-0">
                  <div className="font-medium">{j.role}</div>
                  <div className="mt-0.5 flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
                    <span>{j.jobType.replace('_', ' ')}</span>
                    {j.location && <span>{j.location}</span>}
                    {j.packageLpa != null && <span>{j.packageLpa} LPA</span>}
                    <span>Min {j.minLevel.replace('_', ' ')}</span>
                  </div>
                  {j.skills.length > 0 && (
                    <div className="mt-1.5 flex flex-wrap gap-1">
                      {j.skills.map((s) => (
                        <span key={s} className="rounded bg-secondary px-1.5 py-0.5 text-[10px]">
                          {s}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Link href={`/company/jobs/${j.id}`}>
                    <Button size="sm" variant="outline" className="gap-1">
                      <Users className="h-3.5 w-3.5" /> {j._count.applications}
                    </Button>
                  </Link>
                  <button
                    onClick={() => remove.mutate(j.id)}
                    aria-label="Delete job"
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
