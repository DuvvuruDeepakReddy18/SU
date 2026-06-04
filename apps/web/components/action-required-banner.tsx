'use client';

import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { useQuery } from '@tanstack/react-query';
import { AlertCircle, Clock, X } from 'lucide-react';
import { useState } from 'react';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';

type Status = {
  fields: {
    collegeId: 'verified' | 'pending' | 'rejected' | 'unverified';
  };
};

type QueueInfo = { position: number | null; queueLength: number };

/**
 * The top-of-dashboard ribbon that tells the user the most important thing
 * about their account right now. Three states, in priority order:
 *
 *   1. REJECTED  → red, "Action required: re-upload your college ID"
 *   2. PENDING   → amber, "Under review · ETA < 24h · You're #N in line"
 *   3. nothing   → don't render at all
 *
 * Dismissable per-session (state lives in localStorage). Will re-show the
 * next time the page reloads if the status hasn't changed.
 */
export function ActionRequiredBanner() {
  const { data: session } = useSession();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const token = (session as any)?.accessToken as string | undefined;

  const { data: status } = useQuery({
    enabled: !!token,
    queryKey: ['verifications.status'],
    queryFn: () => api<Status>('/verifications/me/status', { token }),
  });

  // Only fetch queue position when we actually need to render it.
  const wantQueue = status?.fields.collegeId === 'pending';
  const { data: queue } = useQuery({
    enabled: !!token && wantQueue,
    queryKey: ['verifications.queue-position'],
    queryFn: () => api<QueueInfo>('/verifications/me/queue-position', { token }),
    refetchInterval: 60_000,
  });

  const collegeId = status?.fields.collegeId;
  // Dismiss key includes the status so the user has to dismiss again if it
  // transitions (e.g. pending → rejected they get a fresh banner).
  const dismissKey = `sv:dismiss-action-banner:${collegeId ?? 'none'}`;
  const [dismissed, setDismissed] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem(dismissKey) === '1';
  });

  if (!collegeId || dismissed) return null;
  if (collegeId !== 'rejected' && collegeId !== 'pending') return null;

  const dismiss = () => {
    if (typeof window !== 'undefined') localStorage.setItem(dismissKey, '1');
    setDismissed(true);
  };

  if (collegeId === 'rejected') {
    return (
      <BannerShell
        tone="red"
        icon={<AlertCircle className="h-4 w-4 shrink-0" />}
        cta={
          <Link
            href="/dashboard/verifications"
            className="rounded-md bg-rose-600 hover:bg-rose-700 text-white px-3 py-1.5 text-xs font-semibold shadow-sm"
          >
            Re-upload college ID
          </Link>
        }
        onDismiss={dismiss}
      >
        <strong>Action required:</strong> your college ID was rejected. Re-upload to keep your
        profile recommended to recruiters.
      </BannerShell>
    );
  }

  // Pending
  const pos = queue?.position;
  return (
    <BannerShell
      tone="amber"
      icon={<Clock className="h-4 w-4 shrink-0" />}
      cta={
        <Link
          href="/dashboard/verifications"
          className="rounded-md bg-amber-600 hover:bg-amber-700 text-white px-3 py-1.5 text-xs font-semibold shadow-sm"
        >
          View status
        </Link>
      }
      onDismiss={dismiss}
    >
      <strong>College ID under review.</strong> Reviewers usually get to it within{' '}
      <strong>24 hours</strong>.
      {pos && <span className="ml-1 opacity-80">You're #{pos} in line.</span>}
    </BannerShell>
  );
}

function BannerShell({
  tone,
  icon,
  children,
  cta,
  onDismiss,
}: {
  tone: 'red' | 'amber';
  icon: React.ReactNode;
  children: React.ReactNode;
  cta: React.ReactNode;
  onDismiss: () => void;
}) {
  const palette =
    tone === 'red'
      ? 'border-rose-300/60 bg-rose-50 text-rose-900 dark:border-rose-700/60 dark:bg-rose-950/40 dark:text-rose-100'
      : 'border-amber-300/60 bg-amber-50 text-amber-900 dark:border-amber-700/60 dark:bg-amber-950/40 dark:text-amber-100';
  return (
    <div
      className={cn(
        'flex items-center gap-3 rounded-lg border px-4 py-2.5 text-sm shadow-sm',
        palette,
      )}
      role="status"
    >
      {icon}
      <div className="flex-1 leading-snug">{children}</div>
      {cta}
      <button
        onClick={onDismiss}
        aria-label="Dismiss"
        className="rounded p-1 text-current opacity-60 hover:opacity-100 transition"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
