'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { api } from '@/lib/api';
import { ChevronLeft, Inbox, Send } from 'lucide-react';

type Inquiry = {
  id: string;
  brief: string;
  budgetInr: number | null;
  status: string;
  createdAt: string;
  service: { id: string; title: string; category: string };
  client?: {
    studentProfile: { fullName: string; avatarUrl: string | null; sharableSlug: string } | null;
  };
  provider?: {
    studentProfile: { fullName: string; avatarUrl: string | null; sharableSlug: string } | null;
  };
};

const STATUS_VARIANT: Record<string, 'default' | 'success' | 'warning' | 'secondary'> = {
  pending: 'warning',
  accepted: 'success',
  declined: 'secondary',
  completed: 'success',
  cancelled: 'secondary',
};

export default function InquiriesPage() {
  const { data: session } = useSession();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const token = (session as any)?.accessToken as string | undefined;
  const [tab, setTab] = useState<'sent' | 'received'>('sent');

  const { data: sent } = useQuery({
    enabled: !!token,
    queryKey: ['inquiries.sent'],
    queryFn: () => api<Inquiry[]>('/freelance/inquiries/sent', { token }),
  });
  const { data: received } = useQuery({
    enabled: !!token,
    queryKey: ['inquiries.received'],
    queryFn: () => api<Inquiry[]>('/freelance/inquiries/received', { token }),
  });

  const items = tab === 'sent' ? sent : received;

  return (
    <div className="max-w-3xl mx-auto space-y-4">
      <Link
        href="/dashboard/freelance"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ChevronLeft className="h-4 w-4" /> Freelance
      </Link>

      <div>
        <h1 className="text-2xl font-semibold">Inquiries</h1>
        <p className="text-sm text-muted-foreground">
          Conversations between you and providers / clients.
        </p>
      </div>

      <div className="flex gap-1">
        <button
          onClick={() => setTab('sent')}
          className={`rounded-md border px-3 py-1.5 text-xs inline-flex items-center gap-1 ${
            tab === 'sent' ? 'bg-primary text-primary-foreground border-primary' : ''
          }`}
        >
          <Send className="h-3 w-3" /> Sent
          {sent != null && <span className="opacity-70">({sent.length})</span>}
        </button>
        <button
          onClick={() => setTab('received')}
          className={`rounded-md border px-3 py-1.5 text-xs inline-flex items-center gap-1 ${
            tab === 'received' ? 'bg-primary text-primary-foreground border-primary' : ''
          }`}
        >
          <Inbox className="h-3 w-3" /> Received
          {received != null && <span className="opacity-70">({received.length})</span>}
        </button>
      </div>

      {items?.length === 0 && (
        <Card className="border-dashed">
          <CardContent className="p-10 text-center text-sm text-muted-foreground">
            {tab === 'sent'
              ? "You haven't sent any inquiries yet. Browse services and inquire on one you like."
              : 'No inquiries received yet. List a service to start getting messages.'}
          </CardContent>
        </Card>
      )}

      <div className="space-y-2">
        {items?.map((i) => {
          const other = tab === 'sent' ? i.provider?.studentProfile : i.client?.studentProfile;
          return (
            <Link key={i.id} href={`/dashboard/freelance/inquiries/${i.id}`}>
              <Card className="hover:border-primary/40 transition">
                <CardContent className="p-4 space-y-2">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="text-xs uppercase tracking-wider text-muted-foreground capitalize">
                        {i.service.category.replace('_', ' ')}
                      </div>
                      <div className="font-semibold leading-snug truncate">{i.service.title}</div>
                      <div className="text-xs text-muted-foreground mt-0.5">
                        {tab === 'sent' ? 'with' : 'from'}{' '}
                        <span className="text-foreground">{other?.fullName ?? 'Unknown'}</span>
                      </div>
                    </div>
                    <Badge variant={STATUS_VARIANT[i.status] ?? 'secondary'}>{i.status}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-2">{i.brief}</p>
                  <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                    <span>{new Date(i.createdAt).toLocaleDateString()}</span>
                    {i.budgetInr != null && <span>Budget: ₹{i.budgetInr}</span>}
                  </div>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
