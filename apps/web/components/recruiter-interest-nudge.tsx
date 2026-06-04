'use client';

import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Building2, ArrowRight } from 'lucide-react';

/**
 * Dashboard nudge shown only when a student has pending recruiter contact
 * requests. Links to the recruiter-interest inbox where they accept/decline.
 */
export function RecruiterInterestNudge() {
  const { data: session } = useSession();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const token = (session as any)?.accessToken as string | undefined;

  const { data } = useQuery({
    enabled: !!token,
    queryKey: ['me.recruiter-inquiries.count'],
    queryFn: () => api<{ count: number }>('/me/recruiter-inquiries/pending-count', { token }),
    refetchInterval: 120_000,
  });

  if (!data || data.count === 0) return null;

  return (
    <Link
      href="/dashboard/recruiter-interest"
      className="flex items-center gap-3 rounded-xl border border-emerald-500/30 bg-emerald-500/5 px-4 py-3 transition hover:bg-emerald-500/10"
    >
      <div className="grid h-9 w-9 place-items-center rounded-full bg-emerald-500/15 text-emerald-700">
        <Building2 className="h-4 w-4" />
      </div>
      <div className="flex-1 text-sm">
        <span className="font-medium">
          {data.count} {data.count === 1 ? 'company is' : 'companies are'} interested in you
        </span>
        <span className="text-muted-foreground"> — review and share your contact.</span>
      </div>
      <ArrowRight className="h-4 w-4 text-emerald-700" />
    </Link>
  );
}
