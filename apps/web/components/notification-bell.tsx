'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import { Bell, CheckCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { api } from '@/lib/api';

type NotificationPayload = { title?: string; body?: string; href?: string };
type Notification = {
  id: string;
  type: string;
  payload: NotificationPayload;
  readAt: string | null;
  createdAt: string;
};

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const s = Math.floor(diff / 1000);
  if (s < 60) return 'just now';
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}d ago`;
  return new Date(iso).toLocaleDateString();
}

/**
 * Notification bell — used across every portal topbar. Polls every 30s, shows
 * an unread-count badge, and opens a dropdown of recent notifications. Clicking
 * one marks it read and deep-links to the relevant page.
 */
export function NotificationBell() {
  const { data: session } = useSession();

  const token = session?.accessToken as string | undefined;
  const router = useRouter();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const { data: notifications = [] } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => api<Notification[]>('/notifications', { token }),
    enabled: !!token,
    refetchInterval: 30_000,
    refetchOnWindowFocus: true,
  });

  const unread = notifications.filter((n) => !n.readAt).length;

  const markRead = useMutation({
    mutationFn: (id: string) => api(`/notifications/${id}/read`, { method: 'POST', token }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  });

  const markAll = useMutation({
    mutationFn: () => api('/notifications/read-all', { method: 'POST', token }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  });

  // Close on outside click.
  useEffect(() => {
    if (!open) return;
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, [open]);

  function handleClick(n: Notification) {
    if (!n.readAt) markRead.mutate(n.id);
    if (n.payload?.href) {
      setOpen(false);
      router.push(n.payload.href);
    }
  }

  return (
    <div className="relative" ref={ref}>
      <Button
        variant="ghost"
        size="icon"
        aria-label="Notifications"
        onClick={() => setOpen((v) => !v)}
      >
        <Bell className="h-4 w-4" />
        {unread > 0 && (
          <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-semibold leading-none text-white">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </Button>

      {open && (
        <div className="absolute right-0 z-50 mt-2 w-80 overflow-hidden rounded-lg border bg-popover shadow-lg">
          <div className="flex items-center justify-between border-b px-3 py-2">
            <span className="text-sm font-medium">Notifications</span>
            {unread > 0 && (
              <button
                type="button"
                onClick={() => markAll.mutate()}
                disabled={markAll.isPending}
                className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
              >
                <CheckCheck className="h-3.5 w-3.5" /> Mark all read
              </button>
            )}
          </div>

          <div className="max-h-96 overflow-y-auto overscroll-contain">
            {notifications.length === 0 ? (
              <p className="px-3 py-8 text-center text-sm text-muted-foreground">
                You&apos;re all caught up.
              </p>
            ) : (
              notifications.map((n) => (
                <button
                  key={n.id}
                  type="button"
                  onClick={() => handleClick(n)}
                  className={`flex w-full gap-2 border-b px-3 py-2.5 text-left last:border-b-0 hover:bg-muted/50 ${
                    n.readAt ? '' : 'bg-primary/5'
                  }`}
                >
                  <span
                    className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${
                      n.readAt ? 'bg-transparent' : 'bg-primary'
                    }`}
                    aria-hidden
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-medium">
                      {n.payload?.title ?? 'Update'}
                    </span>
                    {n.payload?.body && (
                      <span className="mt-0.5 block text-xs text-muted-foreground">
                        {n.payload.body}
                      </span>
                    )}
                    <span className="mt-1 block text-[11px] text-muted-foreground">
                      {timeAgo(n.createdAt)}
                    </span>
                  </span>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
