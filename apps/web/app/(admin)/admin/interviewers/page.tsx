'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { api } from '@/lib/api';
import { UserPlus, Copy, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

type Interviewer = {
  userId: string;
  fullName: string | null;
  bio: string | null;
  expertise: string[];
  active: boolean;
  licenseStatus: string;
  licenseDueAt: string | null;
  claimed: number;
  passed: number;
  user: { email: string };
};

export default function InterviewersPage() {
  const { data: session } = useSession();

  const token = session?.accessToken as string | undefined;
  const qc = useQueryClient();
  const [form, setForm] = useState({ fullName: '', email: '', expertise: '', bio: '' });
  const [lastTemp, setLastTemp] = useState<{ email: string; tempPassword: string } | null>(null);

  const { data } = useQuery({
    enabled: !!token,
    queryKey: ['admin.interviewers'],
    queryFn: () => api<Interviewer[]>('/admin/interviewers', { token }),
  });

  const invite = useMutation({
    mutationFn: () =>
      api<{ email: string; tempPassword: string }>('/admin/interviewers/invite', {
        method: 'POST',
        token,
        body: JSON.stringify({
          fullName: form.fullName,
          email: form.email,
          bio: form.bio.trim() || undefined,
          expertise: form.expertise
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean),
        }),
      }),
    onSuccess: (res) => {
      setLastTemp(res);
      setForm({ fullName: '', email: '', expertise: '', bio: '' });
      qc.invalidateQueries({ queryKey: ['admin.interviewers'] });
      toast.success('Interviewer invited');
    },
    onError: (e) => toast.error((e as Error).message.slice(0, 160)),
  });

  const toggleActive = useMutation({
    mutationFn: ({ userId, active }: { userId: string; active: boolean }) =>
      api(`/admin/interviewers/${userId}/active`, {
        method: 'POST',
        token,
        body: JSON.stringify({ active }),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin.interviewers'] }),
  });

  const setLicense = useMutation({
    mutationFn: ({
      userId,
      action,
    }: {
      userId: string;
      action: 'renew' | 'suspend' | 'reactivate';
    }) =>
      api(`/admin/interviewers/${userId}/license`, {
        method: 'POST',
        token,
        body: JSON.stringify({ action }),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin.interviewers'] });
      toast.success('License updated');
    },
    onError: (e) => toast.error((e as Error).message),
  });

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-semibold">Interviewers</h1>
        <p className="text-sm text-muted-foreground">
          Invite vetted experts to conduct L4 interviews. They sign in with a temporary password and
          claim interviews from the shared pool.
        </p>
      </div>

      {/* Invite form */}
      <Card>
        <CardContent className="p-4 space-y-3">
          <div className="flex items-center gap-2 text-sm font-medium">
            <UserPlus className="h-4 w-4" /> Invite an interviewer
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            <Input
              placeholder="Full name *"
              value={form.fullName}
              onChange={(e) => setForm({ ...form, fullName: e.target.value })}
            />
            <Input
              type="email"
              placeholder="Email *"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
          </div>
          <Input
            placeholder="Expertise (comma-separated: React, System Design)"
            value={form.expertise}
            onChange={(e) => setForm({ ...form, expertise: e.target.value })}
          />
          <Input
            placeholder="Short bio (optional)"
            value={form.bio}
            onChange={(e) => setForm({ ...form, bio: e.target.value })}
          />
          <div className="flex justify-end">
            <Button
              disabled={!form.fullName.trim() || !form.email.trim() || invite.isPending}
              onClick={() => invite.mutate()}
            >
              {invite.isPending ? 'Inviting…' : 'Invite'}
            </Button>
          </div>

          {lastTemp && (
            <div className="flex items-center justify-between gap-2 rounded-md border border-emerald-500/30 bg-emerald-500/5 px-3 py-2 text-sm">
              <div>
                <span className="text-muted-foreground">Temp password for </span>
                <span className="font-medium">{lastTemp.email}</span>:{' '}
                <code className="rounded bg-secondary px-1.5 py-0.5">{lastTemp.tempPassword}</code>
              </div>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(lastTemp.tempPassword);
                  toast.success('Copied');
                }}
                className="rounded p-1 text-muted-foreground hover:bg-secondary"
                aria-label="Copy password"
              >
                <Copy className="h-4 w-4" />
              </button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* List */}
      <div className="space-y-2">
        {data?.map((iv) => (
          <Card key={iv.userId}>
            <CardContent className="flex items-center justify-between gap-4 p-4">
              <div className="min-w-0">
                <div className="flex items-center gap-2 font-medium">
                  {iv.fullName ?? iv.user.email}
                  {iv.active ? (
                    <span className="inline-flex items-center gap-0.5 rounded bg-emerald-500/15 px-1.5 py-0.5 text-[10px] text-emerald-700">
                      <CheckCircle2 className="h-3 w-3" /> active
                    </span>
                  ) : (
                    <span className="rounded bg-secondary px-1.5 py-0.5 text-[10px] text-muted-foreground">
                      inactive
                    </span>
                  )}
                </div>
                <div className="text-xs text-muted-foreground">
                  {iv.user.email}
                  {iv.expertise.length > 0 && ` · ${iv.expertise.join(', ')}`}
                </div>
                <div className="text-[11px] text-muted-foreground">
                  {iv.claimed} claimed · {iv.passed} passed · license: {iv.licenseStatus}
                  {iv.licenseDueAt &&
                    ` (renews by ${new Date(iv.licenseDueAt).toLocaleDateString()})`}
                </div>
              </div>
              <div className="flex shrink-0 flex-col gap-1.5">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => toggleActive.mutate({ userId: iv.userId, active: !iv.active })}
                >
                  {iv.active ? 'Deactivate' : 'Reactivate'}
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  disabled={setLicense.isPending}
                  onClick={() => setLicense.mutate({ userId: iv.userId, action: 'renew' })}
                >
                  Renew license
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  disabled={setLicense.isPending}
                  onClick={() =>
                    setLicense.mutate({
                      userId: iv.userId,
                      action: iv.licenseStatus === 'suspended' ? 'reactivate' : 'suspend',
                    })
                  }
                >
                  {iv.licenseStatus === 'suspended' ? 'Unsuspend' : 'Suspend'} license
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
        {data?.length === 0 && (
          <Card>
            <CardContent className="p-6 text-center text-sm text-muted-foreground">
              No interviewers yet. Invite one above.
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
