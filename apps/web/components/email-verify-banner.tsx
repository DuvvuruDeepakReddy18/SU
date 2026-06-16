'use client';

import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import { MailWarning, X } from 'lucide-react';
import { api } from '@/lib/api';
import { toast } from 'sonner';

type Me = { emailVerified: string | null; email: string };

/**
 * Soft, dismissible nudge shown across the dashboard until the signed-in user
 * confirms their email. Non-blocking by design — we never gate features on it,
 * we just keep asking gently.
 */
export function EmailVerifyBanner() {
  const { data: session } = useSession();

  const token = session?.accessToken as string | undefined;
  const [dismissed, setDismissed] = useState(false);

  const { data: me } = useQuery({
    queryKey: ['me-verify-status'],
    queryFn: () => api<Me>('/auth/me', { token }),
    enabled: !!token,
    staleTime: 5 * 60 * 1000,
  });

  const resend = useMutation({
    mutationFn: () => api('/auth/resend-verification', { method: 'POST', token }),
    onSuccess: () => toast.success('Verification email sent. Check your inbox.'),
    onError: (e) => toast.error((e as Error).message),
  });

  if (dismissed || !me || me.emailVerified) return null;

  return (
    <div className="flex items-center gap-3 border-b border-amber-200 bg-amber-50 px-4 py-2 text-sm text-amber-900 dark:border-amber-900/40 dark:bg-amber-950/40 dark:text-amber-200 md:px-6">
      <MailWarning className="h-4 w-4 shrink-0" />
      <span className="min-w-0 flex-1">
        Confirm your email to secure your account. We sent a link to{' '}
        <span className="font-medium">{me.email}</span>.
      </span>
      <button
        type="button"
        onClick={() => resend.mutate()}
        disabled={resend.isPending}
        className="shrink-0 font-medium underline underline-offset-2 hover:no-underline disabled:opacity-60"
      >
        {resend.isPending ? 'Sending…' : 'Resend'}
      </button>
      <button
        type="button"
        onClick={() => setDismissed(true)}
        aria-label="Dismiss"
        className="shrink-0 rounded p-0.5 hover:bg-amber-100 dark:hover:bg-amber-900/40"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
