'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ClipboardList, Calendar, User, Video, Award, MessageSquare } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

type Booking = {
  id: string;
  scheduledAt: string;
  status: string;
  meetingUrl: string | null;
  panelNotes: string | null;
  score: number | null;
  result: string | null;
  skillName: string | null;
  studentName: string;
  studentSlug: string | null;
};

const STATUS_META: Record<string, { label: string; cls: string }> = {
  scheduled: { label: 'To conduct', cls: 'bg-amber-500/15 text-amber-700' },
  passed: { label: 'Passed · L4 awarded', cls: 'bg-emerald-500/15 text-emerald-700' },
  failed: { label: 'Feedback given', cls: 'bg-slate-500/15 text-slate-600' },
};

export default function MyInterviewsPage() {
  const { data: session } = useSession();

  const token = session?.accessToken as string | undefined;
  const qc = useQueryClient();
  const [scoring, setScoring] = useState<string | null>(null);
  const [form, setForm] = useState<{
    verdict: 'pass' | 'feedback_only';
    score: string;
    notes: string;
  }>({
    verdict: 'pass',
    score: '',
    notes: '',
  });

  const { data, isLoading } = useQuery({
    enabled: !!token,
    queryKey: ['interviewer.mine'],
    queryFn: () => api<Booking[]>('/interviewer/mine', { token }),
  });

  const submit = useMutation({
    mutationFn: (id: string) =>
      api(`/interviewer/mine/${id}/score`, {
        method: 'POST',
        token,
        body: JSON.stringify({
          verdict: form.verdict,
          score: form.score ? Number(form.score) : undefined,
          notes: form.notes.trim() || undefined,
        }),
      }),
    onSuccess: () => {
      toast.success(
        form.verdict === 'pass' ? 'Passed — student promoted to L4' : 'Feedback recorded',
      );
      setScoring(null);
      setForm({ verdict: 'pass', score: '', notes: '' });
      qc.invalidateQueries({ queryKey: ['interviewer.mine'] });
    },
    onError: (e) => toast.error((e as Error).message.slice(0, 160)),
  });

  return (
    <div className="max-w-3xl space-y-5">
      <div>
        <h1 className="text-2xl font-semibold">My interviews</h1>
        <p className="text-sm text-muted-foreground">
          Conduct via the meeting link, then score. A pass awards the student L4 on the skill.
        </p>
      </div>

      {isLoading ? (
        <div className="text-sm text-muted-foreground">Loading…</div>
      ) : (data?.length ?? 0) === 0 ? (
        <div className="rounded-xl border border-dashed p-10 text-center text-sm text-muted-foreground">
          <ClipboardList className="mx-auto mb-2 h-6 w-6" />
          You haven&apos;t claimed any interviews yet.
        </div>
      ) : (
        <div className="space-y-3">
          {data?.map((b) => {
            const status = STATUS_META[b.status] ?? STATUS_META.scheduled;
            const done = b.status === 'passed' || b.status === 'failed';
            return (
              <Card key={b.id}>
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{b.skillName ?? 'Skill interview'}</span>
                        <span className={cn('rounded px-2 py-0.5 text-[11px]', status.cls)}>
                          {status.label}
                        </span>
                      </div>
                      <div className="mt-0.5 flex flex-wrap gap-x-3 text-xs text-muted-foreground">
                        <span className="inline-flex items-center gap-1">
                          <User className="h-3 w-3" />
                          {b.studentSlug ? (
                            <a
                              href={`/u/${b.studentSlug}`}
                              target="_blank"
                              rel="noreferrer"
                              className="hover:underline"
                            >
                              {b.studentName}
                            </a>
                          ) : (
                            b.studentName
                          )}
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <Calendar className="h-3 w-3" />{' '}
                          {new Date(b.scheduledAt).toLocaleString()}
                        </span>
                        {b.score != null && <span>Score {b.score}/100</span>}
                      </div>
                    </div>
                    {b.meetingUrl && !done && (
                      <a href={b.meetingUrl} target="_blank" rel="noreferrer">
                        <Button size="sm" variant="outline" className="gap-1">
                          <Video className="h-3.5 w-3.5" /> Join
                        </Button>
                      </a>
                    )}
                  </div>

                  {b.panelNotes && (
                    <div className="flex items-start gap-2 rounded-md bg-secondary/40 px-3 py-2 text-xs text-muted-foreground">
                      <MessageSquare className="h-3.5 w-3.5 shrink-0 mt-0.5" /> {b.panelNotes}
                    </div>
                  )}

                  {!done && (
                    <>
                      {scoring === b.id ? (
                        <div className="space-y-2 rounded-lg border bg-secondary/20 p-3">
                          <div className="flex gap-2">
                            <button
                              onClick={() => setForm({ ...form, verdict: 'pass' })}
                              className={cn(
                                'flex-1 rounded-md border px-3 py-2 text-sm transition',
                                form.verdict === 'pass'
                                  ? 'border-emerald-500/50 bg-emerald-500/10'
                                  : '',
                              )}
                            >
                              <Award className="mr-1 inline h-3.5 w-3.5" /> Pass · award L4
                            </button>
                            <button
                              onClick={() => setForm({ ...form, verdict: 'feedback_only' })}
                              className={cn(
                                'flex-1 rounded-md border px-3 py-2 text-sm transition',
                                form.verdict === 'feedback_only'
                                  ? 'border-slate-400/60 bg-slate-500/10'
                                  : '',
                              )}
                            >
                              Feedback only
                            </button>
                          </div>
                          <Input
                            type="number"
                            min={0}
                            max={100}
                            placeholder="Score (0–100, optional)"
                            value={form.score}
                            onChange={(e) => setForm({ ...form, score: e.target.value })}
                          />
                          <textarea
                            placeholder="Notes for the student (optional)"
                            value={form.notes}
                            onChange={(e) => setForm({ ...form, notes: e.target.value })}
                            rows={2}
                            className="w-full resize-none rounded-md border border-input bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                          />
                          <div className="flex justify-end gap-2">
                            <Button variant="ghost" size="sm" onClick={() => setScoring(null)}>
                              Cancel
                            </Button>
                            <Button
                              size="sm"
                              disabled={submit.isPending}
                              onClick={() => submit.mutate(b.id)}
                            >
                              {submit.isPending ? 'Submitting…' : 'Submit score'}
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <Button size="sm" onClick={() => setScoring(b.id)}>
                          Score interview
                        </Button>
                      )}
                    </>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
