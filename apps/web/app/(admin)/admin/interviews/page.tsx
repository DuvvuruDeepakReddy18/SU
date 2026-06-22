'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { Gavel, CheckCircle2, XCircle, Wallet } from 'lucide-react';

type ReviewItem = {
  id: string;
  scheduledAt: string;
  score: number | null;
  result: string | null;
  panelNotes: string | null;
  recordingUrl: string | null;
  skillName: string | null;
  studentName: string;
};

export default function AdminInterviewsPage() {
  const { data: session } = useSession();
  const token = session?.accessToken as string | undefined;
  const qc = useQueryClient();

  const { data: queue } = useQuery({
    enabled: !!token,
    queryKey: ['admin.interview-review'],
    queryFn: () => api<ReviewItem[]>('/admin/interviews/review-queue', { token }),
  });

  const release = useMutation({
    mutationFn: ({ id, pass }: { id: string; pass: boolean }) =>
      api(`/admin/interviews/${id}/release`, {
        method: 'POST',
        token,
        body: JSON.stringify({ pass }),
      }),
    onSuccess: (_d, v) => {
      toast.success(v.pass ? 'Released as pass. L4 awarded.' : 'Released as fail.');
      qc.invalidateQueries({ queryKey: ['admin.interview-review'] });
    },
    onError: (e) => toast.error((e as Error).message),
  });

  const [period, setPeriod] = useState({ start: '', end: '' });
  const payouts = useMutation({
    mutationFn: () =>
      api<{ created: number; interviewers: number }>('/admin/interviews/payouts/run', {
        method: 'POST',
        token,
        body: JSON.stringify({
          periodStart: new Date(`${period.start}T00:00:00`).toISOString(),
          periodEnd: new Date(`${period.end}T23:59:59`).toISOString(),
        }),
      }),
    onSuccess: (r) =>
      toast.success(
        `Payout batch built: ${r.created} payouts across ${r.interviewers} interviewers.`,
      ),
    onError: (e) => toast.error((e as Error).message),
  });

  return (
    <div className="max-w-3xl space-y-5">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-semibold">
          <Gavel className="h-6 w-6 text-primary" /> Interview review
        </h1>
        <p className="text-sm text-muted-foreground">
          Scored interviews wait here for review before results go live (the ~48h audit window).
          Releasing a pass is what awards the student L4 (Expert-Verified).
        </p>
      </div>

      <div className="space-y-2">
        {queue?.map((it) => (
          <Card key={it.id}>
            <CardContent className="flex items-start justify-between gap-3 p-4">
              <div className="min-w-0">
                <div className="font-medium">
                  {it.studentName} · {it.skillName ?? 'skill'}
                </div>
                <div className="text-xs text-muted-foreground">
                  Panel: {it.result === 'L4_VERIFIED' ? 'recommend pass' : 'recommend fail'}
                  {it.score != null && ` · score ${it.score}`} ·{' '}
                  {new Date(it.scheduledAt).toLocaleString()}
                </div>
                {it.panelNotes && (
                  <div className="mt-1 text-sm text-muted-foreground">{it.panelNotes}</div>
                )}
              </div>
              <div className="flex shrink-0 gap-2">
                <Button
                  size="sm"
                  disabled={release.isPending}
                  onClick={() => release.mutate({ id: it.id, pass: true })}
                >
                  <CheckCircle2 className="h-4 w-4" /> Pass
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={release.isPending}
                  onClick={() => release.mutate({ id: it.id, pass: false })}
                >
                  <XCircle className="h-4 w-4" /> Fail
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
        {(queue?.length ?? 0) === 0 && (
          <Card>
            <CardContent className="p-6 text-center text-sm text-muted-foreground">
              No interviews pending review.
            </CardContent>
          </Card>
        )}
      </div>

      <Card>
        <CardContent className="space-y-3 p-4">
          <div className="flex items-center gap-2 text-sm font-medium">
            <Wallet className="h-4 w-4" /> Run interviewer payout batch
          </div>
          <p className="text-xs text-muted-foreground">
            Builds payout records for interviews released in the period — paid per interview
            paneled, regardless of outcome. Idempotent per interviewer + period.
          </p>
          <div className="flex flex-wrap items-end gap-2">
            <div>
              <div className="mb-1 text-xs text-muted-foreground">Period start</div>
              <Input
                type="date"
                value={period.start}
                onChange={(e) => setPeriod({ ...period, start: e.target.value })}
              />
            </div>
            <div>
              <div className="mb-1 text-xs text-muted-foreground">Period end</div>
              <Input
                type="date"
                value={period.end}
                onChange={(e) => setPeriod({ ...period, end: e.target.value })}
              />
            </div>
            <Button
              disabled={!period.start || !period.end || payouts.isPending}
              onClick={() => payouts.mutate()}
            >
              {payouts.isPending ? 'Running…' : 'Run payouts'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
