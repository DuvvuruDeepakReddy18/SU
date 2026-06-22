'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from 'sonner';
import { Plus, Briefcase, Users, Trash2 } from 'lucide-react';

type Drive = {
  id: string;
  company: string;
  role: string;
  packageLpa: number | null;
  minLevel: string;
  jobType: string;
  skills: string[];
  location: string | null;
  _count: { applications: number };
};

const JOB_TYPES = ['full_time', 'internship', 'contract', 'ppo'];
const MIN_LEVELS = [
  { value: 'L0', label: 'Open to all' },
  { value: 'L1_ACADEMIC', label: 'L1+' },
  { value: 'L2_CERTIFIED', label: 'L2+' },
  { value: 'L3_PROVEN', label: 'L3+' },
  { value: 'L4_EXPERT', label: 'L4' },
];

export default function DrivesPage() {
  const { data: session } = useSession();

  const token = session?.accessToken as string | undefined;
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    company: '',
    role: '',
    description: '',
    packageLpa: '',
    minLevel: 'L0',
    jobType: 'full_time',
    skills: '',
    location: '',
  });

  const { data: drives } = useQuery({
    enabled: !!token,
    queryKey: ['institution-admin.drives'],
    queryFn: () => api<Drive[]>('/institution-admin/drives', { token }),
  });

  const create = useMutation({
    mutationFn: () =>
      api('/institution-admin/drives', {
        method: 'POST',
        token,
        body: JSON.stringify({
          company: form.company,
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
      toast.success('Campus drive posted');
      setOpen(false);
      setForm({
        company: '',
        role: '',
        description: '',
        packageLpa: '',
        minLevel: 'L0',
        jobType: 'full_time',
        skills: '',
        location: '',
      });
      qc.invalidateQueries({ queryKey: ['institution-admin.drives'] });
    },
    onError: (e) => toast.error((e as Error).message.slice(0, 160)),
  });

  const remove = useMutation({
    mutationFn: (id: string) => api(`/institution-admin/drives/${id}`, { method: 'DELETE', token }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['institution-admin.drives'] }),
  });

  return (
    <div className="max-w-4xl space-y-5">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Campus drives</h1>
          <p className="text-sm text-muted-foreground">
            Visible only to your institution&apos;s students.
          </p>
        </div>
        <Button onClick={() => setOpen((o) => !o)} className="gap-1">
          <Plus className="h-4 w-4" /> Post a drive
        </Button>
      </div>

      {open && (
        <Card>
          <CardContent className="p-4 space-y-3">
            <div className="grid gap-2 sm:grid-cols-2">
              <Input
                placeholder="Company *"
                value={form.company}
                onChange={(e) => setForm({ ...form, company: e.target.value })}
              />
              <Input
                placeholder="Role *"
                value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value })}
              />
            </div>
            <textarea
              placeholder="Description"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={2}
              className="w-full resize-none rounded-md border border-input bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
            />
            <div className="grid gap-2 sm:grid-cols-4">
              <Input
                type="number"
                placeholder="LPA"
                value={form.packageLpa}
                onChange={(e) => setForm({ ...form, packageLpa: e.target.value })}
              />
              <Input
                placeholder="Location"
                value={form.location}
                onChange={(e) => setForm({ ...form, location: e.target.value })}
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
              placeholder="Skills, comma-separated"
              value={form.skills}
              onChange={(e) => setForm({ ...form, skills: e.target.value })}
            />
            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button
                disabled={!form.company.trim() || !form.role.trim() || create.isPending}
                onClick={() => create.mutate()}
              >
                {create.isPending ? 'Posting…' : 'Post drive'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {drives?.length === 0 ? (
        <div className="rounded-xl border border-dashed p-10 text-center text-sm text-muted-foreground">
          <Briefcase className="mx-auto mb-2 h-6 w-6" />
          No campus drives yet.
        </div>
      ) : (
        <div className="space-y-3">
          {drives?.map((d) => (
            <Card key={d.id}>
              <CardContent className="flex items-start justify-between gap-4 p-4">
                <div className="min-w-0">
                  <div className="font-medium">
                    {d.role} <span className="text-muted-foreground">· {d.company}</span>
                  </div>
                  <div className="mt-0.5 flex flex-wrap gap-x-3 text-xs text-muted-foreground">
                    <span>{d.jobType.replace('_', ' ')}</span>
                    {d.location && <span>{d.location}</span>}
                    {d.packageLpa != null && <span>{d.packageLpa} LPA</span>}
                    {d.minLevel !== 'L0' && <span>Min {d.minLevel.replace('_', ' ')}</span>}
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                    <Users className="h-3.5 w-3.5" /> {d._count.applications}
                  </span>
                  <button
                    onClick={() => remove.mutate(d.id)}
                    aria-label="Delete drive"
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
