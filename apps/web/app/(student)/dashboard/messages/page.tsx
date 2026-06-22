'use client';

import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { api } from '@/lib/api';
import { MessageCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Avatar } from '@/components/message-avatar';

type Thread = {
  counterpartId: string;
  fullName: string;
  avatarUrl: string | null;
  sharableSlug: string | null;
  lastBody: string;
  lastAt: string;
  lastFromMe: boolean;
  unread: number;
};

export default function MessagesInboxPage() {
  const { data: session } = useSession();

  const token = session?.accessToken as string | undefined;

  const { data: threads, isLoading } = useQuery({
    enabled: !!token,
    queryKey: ['messages.threads'],
    queryFn: () => api<Thread[]>('/messages', { token }),
    refetchInterval: 30_000, // poll every 30s for a passable real-time feel
  });

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <header>
        <h1 className="text-2xl font-semibold flex items-center gap-2">
          <MessageCircle className="h-5 w-5 text-primary" />
          Messages
        </h1>
        <p className="text-sm text-muted-foreground">
          1:1 chats with peers, recruiters, and freelance clients.
        </p>
      </header>

      {isLoading && (
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            Loading…
          </CardContent>
        </Card>
      )}

      {!isLoading && threads?.length === 0 && (
        <Card className="border-dashed">
          <CardContent className="py-12 text-center text-sm text-muted-foreground">
            No conversations yet. Open someone&apos;s public profile and click&nbsp;
            <span className="font-medium">Message</span> to start one.
          </CardContent>
        </Card>
      )}

      <div className="space-y-2">
        {threads?.map((t) => (
          <Link
            key={t.counterpartId}
            href={`/dashboard/messages/${t.counterpartId}`}
            className="block"
          >
            <Card
              className={cn(
                'transition hover:border-primary/40 hover:bg-secondary/30',
                t.unread > 0 && 'border-primary/30 bg-primary/5',
              )}
            >
              <CardContent className="flex items-center gap-3 p-3">
                <Avatar avatarUrl={t.avatarUrl} fullName={t.fullName} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <div className="font-medium truncate">{t.fullName}</div>
                    <div className="text-[10px] text-muted-foreground shrink-0">
                      {timeAgo(new Date(t.lastAt))}
                    </div>
                  </div>
                  <div
                    className={cn(
                      'text-xs truncate',
                      t.unread > 0 ? 'text-foreground font-medium' : 'text-muted-foreground',
                    )}
                  >
                    {t.lastFromMe && <span className="opacity-60">You: </span>}
                    {t.lastBody}
                  </div>
                </div>
                {t.unread > 0 && (
                  <div className="shrink-0 inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full bg-primary text-primary-foreground text-[10px] font-semibold">
                    {t.unread}
                  </div>
                )}
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}

function timeAgo(date: Date): string {
  const sec = Math.floor((Date.now() - date.getTime()) / 1000);
  if (sec < 60) return 'just now';
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const days = Math.floor(hr / 24);
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString();
}
