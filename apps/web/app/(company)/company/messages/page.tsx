'use client';

import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Card, CardContent } from '@/components/ui/card';
import { Inbox } from 'lucide-react';
import { initials, LAYER_META, type CandidateCard } from '@/components/company/candidate-card';
import { cn } from '@/lib/utils';

type Inquiry = {
  id: string;
  message: string;
  status: 'pending' | 'accepted' | 'declined';
  createdAt: string;
  candidate: CandidateCard;
};

const STATUS_META: Record<string, { label: string; cls: string }> = {
  pending: { label: 'Pending', cls: 'bg-amber-500/15 text-amber-700' },
  accepted: { label: 'Accepted', cls: 'bg-emerald-500/15 text-emerald-700' },
  declined: { label: 'Declined', cls: 'bg-rose-500/15 text-rose-600' },
};

export default function CompanyMessagesPage() {
  const { data: session } = useSession();

  const token = session?.accessToken as string | undefined;

  const { data, isLoading } = useQuery({
    enabled: !!token,
    queryKey: ['recruiters.inquiries'],
    queryFn: () => api<Inquiry[]>('/recruiters/inquiries', { token }),
  });

  return (
    <div className="max-w-3xl space-y-5">
      <div>
        <h1 className="text-2xl font-semibold">Contact requests</h1>
        <p className="text-sm text-muted-foreground">
          Messages you&apos;ve sent. Once a candidate accepts, their contact details unlock on their
          profile.
        </p>
      </div>

      {isLoading ? (
        <div className="text-sm text-muted-foreground">Loading…</div>
      ) : (data?.length ?? 0) === 0 ? (
        <div className="rounded-xl border border-dashed p-10 text-center text-sm text-muted-foreground">
          <Inbox className="mx-auto mb-2 h-6 w-6" />
          No contact requests yet. Reach out from a candidate&apos;s profile.
        </div>
      ) : (
        <div className="space-y-3">
          {data?.map((iq) => {
            const status = STATUS_META[iq.status] ?? STATUS_META.pending;
            const layer = LAYER_META[iq.candidate.topLayer] ?? LAYER_META.L0_UNVERIFIED;
            return (
              <Card key={iq.id}>
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-primary/15 text-xs font-semibold text-primary">
                      {initials(iq.candidate.fullName)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/company/candidates/${iq.candidate.userId}`}
                          className="font-medium hover:underline"
                        >
                          {iq.candidate.fullName}
                        </Link>
                        <span className={cn('rounded px-1 text-[9px] font-bold', layer.cls)}>
                          {layer.label}
                        </span>
                        <span className={cn('ml-auto rounded px-2 py-0.5 text-[11px]', status.cls)}>
                          {status.label}
                        </span>
                      </div>
                      <p className="mt-1.5 text-sm text-muted-foreground line-clamp-3">
                        {iq.message}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
