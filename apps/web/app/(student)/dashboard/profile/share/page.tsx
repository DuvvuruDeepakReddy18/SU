'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { toast } from 'sonner';
import { ArrowLeft, ChevronUp, ChevronDown, Copy, ExternalLink, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';
import {
  SHARE_THEMES,
  SHARE_SECTIONS,
  type ShareTheme,
  type ShareSection,
} from '@skillverify/shared';

type ProfileShape = {
  sharableSlug: string;
  isPublic: boolean;
  shareTheme: string;
  shareSectionsOrder: string[];
};

const SECTION_LABELS: Record<ShareSection, string> = {
  about: 'About / bio',
  skills: 'Verified skills',
  projects: 'Projects',
  certifications: 'Certifications',
};

const THEME_PREVIEWS: Record<ShareTheme, { bg: string; text: string }> = {
  default: { bg: 'bg-white border-zinc-200', text: 'text-zinc-900' },
  midnight: { bg: 'bg-slate-950 border-slate-800', text: 'text-slate-100' },
  minimal: { bg: 'bg-white border-zinc-100', text: 'text-zinc-900' },
};

export default function SharePage() {
  const { data: session } = useSession();

  const token = session?.accessToken as string | undefined;
  const qc = useQueryClient();

  const { data: profile } = useQuery({
    enabled: !!token,
    queryKey: ['profile.me'],
    queryFn: () => api<ProfileShape>('/profile/me', { token }),
  });

  // Local form state, seeded from server
  const [theme, setTheme] = useState<ShareTheme>('default');
  const [order, setOrder] = useState<ShareSection[]>([...SHARE_SECTIONS]);

  useEffect(() => {
    if (!profile) return;
    setTheme(((profile.shareTheme as ShareTheme) ?? 'default') as ShareTheme);
    setOrder(
      (profile.shareSectionsOrder ?? SHARE_SECTIONS).filter((s): s is ShareSection =>
        (SHARE_SECTIONS as readonly string[]).includes(s),
      ),
    );
  }, [profile]);

  const save = useMutation({
    mutationFn: () =>
      api('/profile/me', {
        method: 'PATCH',
        token,
        body: JSON.stringify({ shareTheme: theme, shareSectionsOrder: order }),
      }),
    onSuccess: () => {
      toast.success('Public portfolio updated');
      qc.invalidateQueries({ queryKey: ['profile.me'] });
    },
    onError: (e) => toast.error((e as Error).message),
  });

  function moveUp(i: number) {
    if (i === 0) return;
    const next = [...order];
    [next[i - 1], next[i]] = [next[i], next[i - 1]];
    setOrder(next);
  }
  function moveDown(i: number) {
    if (i === order.length - 1) return;
    const next = [...order];
    [next[i + 1], next[i]] = [next[i], next[i + 1]];
    setOrder(next);
  }

  const publicUrl =
    profile?.sharableSlug && typeof window !== 'undefined'
      ? `${window.location.origin}/u/${profile.sharableSlug}`
      : '';

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <Link
          href="/dashboard/profile"
          className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Back to profile
        </Link>
        <h1 className="text-2xl font-semibold flex items-center gap-2 mt-1">
          <Sparkles className="h-5 w-5 text-primary" /> Customize your shareable portfolio
        </h1>
        <p className="text-sm text-muted-foreground">
          Pick a theme and reorder sections. Recruiters and freelance clients open the public link
          at <span className="font-mono text-foreground">/u/{profile?.sharableSlug ?? '…'}</span>.
        </p>
      </div>

      {publicUrl && (
        <Card>
          <CardContent className="p-4 flex items-center justify-between gap-3">
            <div className="text-sm font-mono truncate">{publicUrl}</div>
            <div className="flex gap-2 shrink-0">
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  navigator.clipboard.writeText(publicUrl);
                  toast.success('Link copied');
                }}
              >
                <Copy className="h-3.5 w-3.5" /> Copy
              </Button>
              <a href={publicUrl} target="_blank" rel="noreferrer">
                <Button size="sm" variant="outline">
                  Open <ExternalLink className="h-3.5 w-3.5" />
                </Button>
              </a>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Theme</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-3">
          {SHARE_THEMES.map((t) => {
            const preview = THEME_PREVIEWS[t];
            return (
              <button
                key={t}
                onClick={() => setTheme(t)}
                className={cn(
                  'rounded-lg border p-3 text-left transition',
                  theme === t ? 'border-primary ring-2 ring-primary/30' : 'hover:border-primary/40',
                )}
              >
                <div
                  className={cn(
                    'h-20 rounded-md border mb-2 grid place-items-center text-xs font-mono',
                    preview.bg,
                    preview.text,
                  )}
                >
                  Preview
                </div>
                <div className="text-sm font-semibold capitalize">{t}</div>
                <div className="text-[10px] text-muted-foreground capitalize">
                  {t === 'default' && 'Matches the app theme'}
                  {t === 'midnight' && 'Dark cosmic, recruiter-friendly'}
                  {t === 'minimal' && 'White / serif, print-grade'}
                </div>
              </button>
            );
          })}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Section order</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {order.map((s, i) => (
            <div key={s} className="flex items-center justify-between rounded-md border p-2.5">
              <div className="flex items-center gap-3">
                <span className="text-xs text-muted-foreground tabular-nums w-4">{i + 1}.</span>
                <span className="text-sm font-medium">{SECTION_LABELS[s]}</span>
              </div>
              <div className="flex gap-1">
                <button
                  onClick={() => moveUp(i)}
                  disabled={i === 0}
                  className="rounded p-1 hover:bg-secondary disabled:opacity-30"
                  aria-label="Move up"
                >
                  <ChevronUp className="h-4 w-4" />
                </button>
                <button
                  onClick={() => moveDown(i)}
                  disabled={i === order.length - 1}
                  className="rounded p-1 hover:bg-secondary disabled:opacity-30"
                  aria-label="Move down"
                >
                  <ChevronDown className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <div className="flex gap-2 justify-end">
        <Button variant="outline" onClick={() => window.history.back()}>
          Cancel
        </Button>
        <Button onClick={() => save.mutate()} disabled={save.isPending}>
          {save.isPending ? 'Saving…' : 'Save'}
        </Button>
      </div>
    </div>
  );
}
