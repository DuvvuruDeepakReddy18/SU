'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { ChevronLeft, Send, Check, X } from 'lucide-react';

type Author = {
  studentProfile: { fullName: string; avatarUrl: string | null; sharableSlug: string } | null;
};

type Message = {
  id: string;
  body: string;
  createdAt: string;
  author: Author;
};

type InquiryDetail = {
  id: string;
  brief: string;
  budgetInr: number | null;
  deadlineAt: string | null;
  status: string;
  providerNote: string | null;
  createdAt: string;
  role: 'client' | 'provider';
  service: {
    id: string;
    title: string;
    category: string;
    priceFrom: number | null;
    priceUnit: string | null;
  };
  client: Author;
  provider: Author;
  messages: Message[];
};

const STATUS_VARIANT: Record<string, 'default' | 'success' | 'warning' | 'secondary'> = {
  pending: 'warning',
  accepted: 'success',
  declined: 'secondary',
  completed: 'success',
  cancelled: 'secondary',
};

export default function InquiryDetailPage({ params }: { params: { id: string } }) {
  const { data: session } = useSession();

  const token = session?.accessToken as string | undefined;
  const qc = useQueryClient();
  const [body, setBody] = useState('');

  const { data } = useQuery({
    enabled: !!token,
    queryKey: ['inquiry', params.id],
    queryFn: () => api<InquiryDetail>(`/freelance/inquiries/${params.id}`, { token }),
    refetchInterval: 5000,
  });

  const sendMsg = useMutation({
    mutationFn: () =>
      api(`/freelance/inquiries/${params.id}/messages`, {
        method: 'POST',
        token,
        body: JSON.stringify({ body }),
      }),
    onSuccess: () => {
      setBody('');
      qc.invalidateQueries({ queryKey: ['inquiry', params.id] });
    },
    onError: (e) => toast.error((e as Error).message),
  });

  const setStatus = useMutation({
    mutationFn: (status: 'accepted' | 'declined' | 'completed' | 'cancelled') =>
      api(`/freelance/inquiries/${params.id}/status`, {
        method: 'POST',
        token,
        body: JSON.stringify({ status }),
      }),
    onSuccess: () => {
      toast.success('Status updated');
      qc.invalidateQueries({ queryKey: ['inquiry', params.id] });
      qc.invalidateQueries({ queryKey: ['inquiries.sent'] });
      qc.invalidateQueries({ queryKey: ['inquiries.received'] });
    },
    onError: (e) => toast.error((e as Error).message),
  });

  if (!data) {
    return <div className="animate-pulse h-96 rounded bg-secondary" />;
  }

  const counterpart =
    data.role === 'client' ? data.provider.studentProfile : data.client.studentProfile;

  return (
    <div className="max-w-3xl mx-auto space-y-4">
      <Link
        href="/dashboard/freelance/inquiries"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ChevronLeft className="h-4 w-4" /> Inquiries
      </Link>

      {/* Header */}
      <Card>
        <CardContent className="p-5 space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="text-xs uppercase tracking-wider text-muted-foreground capitalize">
                {data.service.category.replace('_', ' ')}
              </div>
              <Link
                href={`/dashboard/freelance/${data.service.id}`}
                className="font-semibold text-lg hover:underline"
              >
                {data.service.title}
              </Link>
              <div className="text-xs text-muted-foreground mt-0.5">
                {data.role === 'client' ? 'Provider: ' : 'Client: '}
                <span className="text-foreground">{counterpart?.fullName ?? 'Unknown'}</span>
                {' · '}
                {new Date(data.createdAt).toLocaleString('en-IN', {
                  day: 'numeric',
                  month: 'short',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </div>
            </div>
            <Badge variant={STATUS_VARIANT[data.status] ?? 'secondary'}>{data.status}</Badge>
          </div>

          {/* Brief */}
          <div className="rounded-md border bg-secondary/30 p-3 space-y-1">
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
              Original brief
            </div>
            <p className="text-sm whitespace-pre-wrap">{data.brief}</p>
            {(data.budgetInr || data.deadlineAt) && (
              <div className="text-xs text-muted-foreground flex gap-4 pt-1">
                {data.budgetInr != null && <span>Budget: ₹{data.budgetInr}</span>}
                {data.deadlineAt && (
                  <span>Needed by: {new Date(data.deadlineAt).toLocaleDateString()}</span>
                )}
              </div>
            )}
          </div>

          {/* Status actions */}
          {data.status === 'pending' && data.role === 'provider' && (
            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={() => setStatus.mutate('accepted')}
                disabled={setStatus.isPending}
              >
                <Check className="h-3.5 w-3.5" /> Accept
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setStatus.mutate('declined')}
                disabled={setStatus.isPending}
              >
                <X className="h-3.5 w-3.5" /> Decline
              </Button>
            </div>
          )}
          {data.status === 'accepted' && (
            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={() => setStatus.mutate('completed')}
                disabled={setStatus.isPending}
              >
                Mark completed
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setStatus.mutate('cancelled')}
                disabled={setStatus.isPending}
              >
                Cancel
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Messages */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Conversation</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {data.messages.length === 0 && (
            <p className="text-xs text-muted-foreground italic">
              No messages yet — start the conversation below.
            </p>
          )}
          {data.messages.map((m) => {
            const name = m.author.studentProfile?.fullName ?? 'Unknown';
            const isMe =
              (data.role === 'client' &&
                m.author.studentProfile?.sharableSlug ===
                  data.client.studentProfile?.sharableSlug) ||
              (data.role === 'provider' &&
                m.author.studentProfile?.sharableSlug ===
                  data.provider.studentProfile?.sharableSlug);
            return (
              <div key={m.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm ${
                    isMe
                      ? 'bg-primary text-primary-foreground rounded-br-sm'
                      : 'bg-secondary rounded-bl-sm'
                  }`}
                >
                  <div className="text-[10px] opacity-70 mb-0.5">
                    {name} ·{' '}
                    {new Date(m.createdAt).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </div>
                  <div className="whitespace-pre-wrap">{m.body}</div>
                </div>
              </div>
            );
          })}

          <div className="flex items-center gap-2 pt-2">
            <input
              className="flex-1 rounded-full border border-input bg-transparent px-4 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
              placeholder="Type a message…"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey && body.trim()) {
                  e.preventDefault();
                  sendMsg.mutate();
                }
              }}
            />
            <Button onClick={() => sendMsg.mutate()} disabled={!body.trim() || sendMsg.isPending}>
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
