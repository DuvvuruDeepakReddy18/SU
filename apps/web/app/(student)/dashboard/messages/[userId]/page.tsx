'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Send, ExternalLink } from 'lucide-react';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';
import { Avatar } from '@/components/message-avatar';
import { EVENTS, track } from '@/lib/analytics';

type Message = {
  id: string;
  body: string;
  senderId: string;
  recipientId: string;
  createdAt: string;
  readAt: string | null;
  fromMe: boolean;
};

type ThreadPayload = {
  counterpart: {
    id: string;
    fullName: string;
    avatarUrl: string | null;
    sharableSlug: string | null;
    headline: string | null;
    institution: string | null;
  };
  messages: Message[];
};

export default function MessageThreadPage({ params }: { params: { userId: string } }) {
  const { data: session } = useSession();

  const token = session?.accessToken as string | undefined;
  const qc = useQueryClient();
  const [draft, setDraft] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  const { data } = useQuery({
    enabled: !!token,
    queryKey: ['messages.thread', params.userId],
    queryFn: () => api<ThreadPayload>(`/messages/with/${params.userId}`, { token }),
    refetchInterval: 8_000,
  });

  // Scroll to bottom on new message.
  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [data?.messages.length]);

  const send = useMutation({
    mutationFn: () =>
      api(`/messages/with/${params.userId}`, {
        method: 'POST',
        token,
        body: JSON.stringify({ body: draft }),
      }),
    onSuccess: () => {
      track(EVENTS.DM_SENT, { recipientId: params.userId });
      setDraft('');
      qc.invalidateQueries({ queryKey: ['messages.thread', params.userId] });
      qc.invalidateQueries({ queryKey: ['messages.threads'] });
    },
  });

  if (!data) {
    return <div className="animate-pulse h-96 rounded bg-secondary" />;
  }

  return (
    <div className="max-w-2xl mx-auto flex flex-col h-[calc(100vh-7rem)]">
      {/* Header */}
      <header className="flex items-center gap-3 border-b pb-3">
        <Link
          href="/dashboard/messages"
          className="text-muted-foreground hover:text-foreground"
          aria-label="Back to inbox"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <Avatar avatarUrl={data.counterpart.avatarUrl} fullName={data.counterpart.fullName} />
        <div className="flex-1 min-w-0">
          <div className="font-semibold truncate">{data.counterpart.fullName}</div>
          <div className="text-xs text-muted-foreground truncate">
            {[data.counterpart.headline, data.counterpart.institution].filter(Boolean).join(' · ')}
          </div>
        </div>
        {data.counterpart.sharableSlug && (
          <Link href={`/u/${data.counterpart.sharableSlug}`} target="_blank">
            <Button size="sm" variant="outline" className="gap-1">
              <ExternalLink className="h-3.5 w-3.5" /> Profile
            </Button>
          </Link>
        )}
      </header>

      {/* Transcript */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto overscroll-contain py-4 space-y-2">
        {data.messages.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="py-8 text-center text-sm text-muted-foreground">
              No messages yet. Say hi.
            </CardContent>
          </Card>
        ) : (
          data.messages.map((m) => <Bubble key={m.id} msg={m} />)
        )}
      </div>

      {/* Composer */}
      <div className="border-t pt-3 flex items-end gap-2">
        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey && draft.trim()) {
              e.preventDefault();
              send.mutate();
            }
          }}
          rows={1}
          placeholder="Message…"
          className="flex-1 resize-none rounded-2xl border border-input bg-transparent px-4 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
          disabled={send.isPending}
          maxLength={2000}
        />
        <Button onClick={() => send.mutate()} disabled={send.isPending || !draft.trim()}>
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

function Bubble({ msg }: { msg: Message }) {
  return (
    <div className={cn('flex', msg.fromMe ? 'justify-end' : 'justify-start')}>
      <div
        className={cn(
          'rounded-2xl px-3 py-2 max-w-[75%] text-sm whitespace-pre-wrap leading-relaxed',
          msg.fromMe ? 'bg-primary text-primary-foreground' : 'bg-secondary text-foreground',
        )}
      >
        {msg.body}
        <div className="text-[9px] mt-0.5 opacity-60 text-right">
          {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          {msg.fromMe && msg.readAt && <span className="ml-1">✓✓</span>}
        </div>
      </div>
    </div>
  );
}
