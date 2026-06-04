'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { ArrowRight, Check, X, Sparkles, ShieldCheck, FileText, Plug, Code2 } from 'lucide-react';

type Profile = {
  onboardingStep: number;
  fullName: string | null;
  headline: string | null;
  bio: string | null;
  collegeIdStatus: string;
  collegeIdUrl: string | null;
  resumeUrl: string | null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  user?: any;
};

type Step = {
  key: string;
  title: string;
  body: string;
  href: string;
  cta: string;
  icon: React.ComponentType<{ className?: string }>;
  done: (p: Profile, skillCount: number, integrationCount: number) => boolean;
};

// The 4-step ramp from signup → "ready to share with recruiters". Each step
// owns one outcome that unlocks downstream features. Completion is derived
// from real profile state, not just `onboardingStep`, so a user who finishes
// a step out-of-order still gets credit.
const STEPS: Step[] = [
  {
    key: 'basics',
    title: 'Tell us about you',
    body: 'Add your name, a one-line headline, and a short bio. This is what recruiters see first.',
    href: '/dashboard/profile',
    cta: 'Edit profile',
    icon: FileText,
    done: (p) => Boolean(p.fullName && p.headline && p.bio),
  },
  {
    key: 'collegeId',
    title: 'Upload your college ID',
    body: 'Required to earn the verified-student badge. Reviewed within 48 hours.',
    href: '/dashboard/profile',
    cta: 'Upload',
    icon: ShieldCheck,
    done: (p) => Boolean(p.collegeIdUrl) && p.collegeIdStatus !== 'rejected',
  },
  {
    key: 'skills',
    title: 'Claim 3 skills',
    body: 'Pick from the catalog. Skills with at least one verification layer rank higher.',
    href: '/dashboard/skills',
    cta: 'Open skills',
    icon: Code2,
    done: (_p, skillCount) => skillCount >= 3,
  },
  {
    key: 'integrations',
    title: 'Connect one integration',
    body: 'GitHub, LeetCode, or LinkedIn — proves your work and unlocks L2/L3.',
    href: '/dashboard/integrations',
    cta: 'Connect',
    icon: Plug,
    done: (_p, _s, integrationCount) => integrationCount >= 1,
  },
];

/**
 * Top-of-dashboard ramp shown until the student finishes all 4 steps OR
 * dismisses it. `onboardingStep` reaches 4 once dismissed/completed and the
 * wizard never renders again. The actual step *progress* bar is derived from
 * real profile data — finishing a step elsewhere (e.g. via the profile edit
 * page) reflects here on next mount.
 */
export function OnboardingWizard() {
  const { data: session } = useSession();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const token = (session as any)?.accessToken as string | undefined;
  const qc = useQueryClient();
  const [collapsed, setCollapsed] = useState(false);

  const { data: profile } = useQuery({
    enabled: !!token,
    queryKey: ['profile.me'],
    queryFn: () => api<Profile>('/profile/me', { token }),
  });

  const { data: mySkills } = useQuery({
    enabled: !!token,
    queryKey: ['skills.mine'],
    queryFn: () => api<unknown[]>('/skills/me', { token }),
  });

  const { data: integrations } = useQuery({
    enabled: !!token,
    queryKey: ['integrations'],
    queryFn: () => api<Array<{ connected: boolean }>>('/integrations', { token }),
  });

  const dismiss = useMutation({
    mutationFn: () =>
      api('/profile/me', {
        method: 'PATCH',
        token,
        body: JSON.stringify({ onboardingStep: 4 }),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['profile.me'] }),
  });

  if (!profile || profile.onboardingStep >= 4) return null;

  const skillCount = mySkills?.length ?? 0;
  const integrationCount = integrations?.filter((i) => i.connected).length ?? 0;
  const done = STEPS.map((s) => s.done(profile, skillCount, integrationCount));
  const completedCount = done.filter(Boolean).length;

  // Auto-promote once everything is real-checked done.
  if (completedCount === STEPS.length) {
    if (!dismiss.isPending && profile.onboardingStep < 4) {
      dismiss.mutate();
    }
    return null;
  }

  const nextIdx = done.findIndex((d) => !d);
  const next = STEPS[nextIdx];
  const NextIcon = next.icon;
  const pct = Math.round((completedCount / STEPS.length) * 100);

  return (
    <div className="rounded-xl border bg-gradient-to-br from-primary/5 via-background to-emerald-50/40 dark:to-emerald-950/20 p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          <div className="text-sm font-medium">
            {completedCount} of {STEPS.length} done · {pct}% set up
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setCollapsed((c) => !c)}
            className="text-xs text-muted-foreground hover:text-foreground px-2"
          >
            {collapsed ? 'Expand' : 'Collapse'}
          </button>
          <button
            type="button"
            onClick={() => dismiss.mutate()}
            disabled={dismiss.isPending}
            aria-label="Dismiss setup checklist"
            className="rounded-md p-1 text-muted-foreground hover:bg-secondary"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-secondary">
        <div className="h-full bg-primary transition-all" style={{ width: `${pct}%` }} />
      </div>

      {!collapsed && (
        <>
          <div className="mt-4 flex items-start gap-3 rounded-lg border bg-card p-4">
            <div className="grid h-9 w-9 place-items-center rounded-full bg-primary/10 text-primary">
              <NextIcon className="h-4 w-4" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold">{next.title}</div>
              <p className="text-xs text-muted-foreground mt-0.5">{next.body}</p>
            </div>
            <Link href={next.href}>
              <Button size="sm">
                {next.cta} <ArrowRight className="h-3 w-3" />
              </Button>
            </Link>
          </div>

          <div className="mt-3 grid grid-cols-2 gap-2 md:grid-cols-4">
            {STEPS.map((s, i) => (
              <div
                key={s.key}
                className={cn(
                  'flex items-center gap-2 rounded-md border px-3 py-2 text-xs',
                  done[i]
                    ? 'border-emerald-500/30 bg-emerald-50/50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300'
                    : i === nextIdx
                      ? 'border-primary/40'
                      : 'text-muted-foreground',
                )}
              >
                {done[i] ? (
                  <Check className="h-3 w-3 shrink-0" />
                ) : (
                  <span className="grid h-3 w-3 place-items-center rounded-full border text-[8px] shrink-0">
                    {i + 1}
                  </span>
                )}
                <span className="truncate">{s.title}</span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
