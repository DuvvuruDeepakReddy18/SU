'use client';

import { ShieldCheck, ShieldAlert, Clock, ShieldX } from 'lucide-react';
import { cn } from '@/lib/utils';

type State = 'verified' | 'pending' | 'rejected' | 'unverified' | 'partial';

/**
 * Inline red/green/amber chip rendered next to fields like CGPA, skill count,
 * and on the dashboard profile summary. Drives recruiter-visibility rules.
 */
export function VerificationPill({
  state,
  label,
  size = 'sm',
}: {
  state: State;
  label?: string;
  size?: 'xs' | 'sm';
}) {
  const config = {
    verified: {
      cls: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
      Icon: ShieldCheck,
      text: label ?? 'VERIFIED',
    },
    partial: {
      cls: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
      Icon: ShieldAlert,
      text: label ?? 'PARTIAL',
    },
    pending: {
      cls: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
      Icon: Clock,
      text: label ?? 'PENDING',
    },
    rejected: {
      cls: 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300',
      Icon: ShieldX,
      text: label ?? 'REJECTED',
    },
    unverified: {
      cls: 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300',
      Icon: ShieldX,
      text: label ?? 'UNVERIFIED INFO',
    },
  }[state];

  const sizing = size === 'xs' ? 'text-[10px] px-1.5 py-0.5' : 'text-xs px-2 py-0.5';

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full font-semibold tracking-wide',
        sizing,
        config.cls,
      )}
    >
      <config.Icon className={size === 'xs' ? 'h-2.5 w-2.5' : 'h-3 w-3'} />
      {config.text}
    </span>
  );
}
