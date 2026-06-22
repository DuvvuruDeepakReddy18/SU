'use client';

import { useSession } from 'next-auth/react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from 'sonner';
import { Building2, Inbox, ShieldCheck } from 'lucide-react';
import { EVENTS, track } from '@/lib/analytics';
import { cn } from '@/lib/utils';

type Inquiry = {
  id: string;
  message: string;
  status: 'pending' | 'accepted' | 'declined';
  createdAt: string;
  recruiterName: string;
  recruiterTitle: string | null;
  company: string;
  job: { id: string; role: string } | null;
};

const STATUS_META: Record<string, { label: string; cls: string }> = {
  pending: { label: 'Awaiting your response', cls: 'bg-amber-500/15 text-amber-700' },
  accepted: { label: 'Contact shared', cls: 'bg-emerald-500/15 text-emerald-700' },
  declined: { label: 'Declined', cls: 'bg-rose-500/15 text-rose-600' },
};

export default function RecruiterInterestPage() {
  const { data: session } = useSession();

  const token = session?.accessToken as string | undefined;
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    enabled: !!token,
    queryKey: ['me.recruiter-inquiries'],
    queryFn: () => api<Inquiry[]>('/me/recruiter-inquiries', { token }),
  });

  const respond = useMutation({
    mutationFn: ({ id, accept }: { id: string; accept: boolean }) =>
      api(`/me/recruiter-inquiries/${id}/respond`, {
        method: 'POST',
        token,
        body: JSON.stringify({ accept }),
      }),
    onSuccess: (_d, vars) => {
      if (vars.accept) track(EVENTS.INQUIRY_ACCEPTED);
      toast.success(vars.accept ? 'Contact shared with the recruiter' : 'Request declined');
      qc.invalidateQueries({ queryKey: ['me.recruiter-inquiries'] });
      qc.invalidateQueries({ queryKey: ['me.recruiter-inquiries.count'] });
    },
    onError: (e) => toast.error((e as Error).message.slice(0, 160)),
  });

  return (
    <div className="max-w-3xl space-y-5">
      <div>
        <h1 className="text-2xl font-semibold">Recruiter interest</h1>
        <p className="text-sm text-muted-foreground">
          Verified companies reaching out about you. Your phone and email are shared only if you
          accept.
        </p>
      </div>

      {isLoading ? (
        <div className="text-sm text-muted-foreground">Loading…</div>
      ) : data?.length === 0 ? (
        <div className="rounded-xl border border-dashed p-10 text-center text-sm text-muted-foreground">
          <Inbox className="mx-auto mb-2 h-6 w-6" />
          No recruiter messages yet. Keep climbing the verification layers to get noticed.
        </div>
      ) : (
        <div className="space-y-3">
          {data?.map((iq) => {
            const status = STATUS_META[iq.status] ?? STATUS_META.pending;
            return (
              <Card key={iq.id}>
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-primary/15 text-primary">
                      <Building2 className="h-5 w-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-medium">{iq.company}</span>
                        <span className="inline-flex items-center gap-1 text-[11px] text-emerald-700">
                          <ShieldCheck className="h-3 w-3" /> verified
                        </span>
                        <span className={cn('ml-auto rounded px-2 py-0.5 text-[11px]', status.cls)}>
                          {status.label}
                        </span>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {[iq.recruiterName, iq.recruiterTitle].filter(Boolean).join(' · ')}
                        {iq.job ? ` · hiring for ${iq.job.role}` : ''}
                      </div>
                      <p className="mt-2 text-sm">{iq.message}</p>
                    </div>
                  </div>

                  {iq.status === 'pending' && (
                    <div className="flex justify-end gap-2 border-t pt-3">
                      <Button
                        variant="ghost"
                        size="sm"
                        disabled={respond.isPending}
                        onClick={() => respond.mutate({ id: iq.id, accept: false })}
                      >
                        Decline
                      </Button>
                      <Button
                        size="sm"
                        disabled={respond.isPending}
                        onClick={() => respond.mutate({ id: iq.id, accept: true })}
                      >
                        Share my contact
                      </Button>
                    </div>
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
