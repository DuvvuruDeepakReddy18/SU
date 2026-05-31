'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';

type Row = {
  rank: number;
  score: number;
  userId: string;
  profile: { fullName: string; avatarUrl: string | null; sharableSlug: string } | null;
};

type Profile = {
  user: { institutionId: string | null; institution: { name: string } | null };
};

export default function LeaderboardPage() {
  const { data: session } = useSession();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const token = (session as any)?.accessToken as string | undefined;
  const [scope, setScope] = useState<'global' | 'institute'>('global');

  const { data: profile } = useQuery({
    enabled: !!token,
    queryKey: ['profile.me'],
    queryFn: () => api<Profile>('/profile/me', { token }),
  });
  const institutionId = profile?.user?.institutionId ?? null;
  const institutionName = profile?.user?.institution?.name ?? 'My institute';

  const queryUrl =
    scope === 'institute' && institutionId
      ? `/leaderboard?scope=college&id=${institutionId}`
      : '/leaderboard?scope=global';

  const { data } = useQuery({
    queryKey: ['leaderboard', scope, institutionId],
    queryFn: () => api<{ scope: string; items: Row[] }>(queryUrl),
    enabled: scope === 'global' || !!institutionId,
  });

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold">Leaderboard</h1>
        <p className="text-sm text-muted-foreground">
          Points are earned per accepted submission. Top performers get recruiter visibility.
        </p>
      </div>

      <div className="inline-flex rounded-md border bg-secondary/30 p-1">
        <button
          onClick={() => setScope('global')}
          className={cn(
            'rounded px-3 py-1 text-sm transition',
            scope === 'global' ? 'bg-background shadow-sm' : 'text-muted-foreground',
          )}
        >
          Global
        </button>
        <button
          onClick={() => setScope('institute')}
          disabled={!institutionId}
          className={cn(
            'rounded px-3 py-1 text-sm transition disabled:opacity-50',
            scope === 'institute' ? 'bg-background shadow-sm' : 'text-muted-foreground',
          )}
          title={institutionId ? '' : 'Set your institution first'}
        >
          {institutionName}
        </button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>
            {scope === 'global' ? 'Global leaderboard' : `${institutionName} leaderboard`}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <ul className="divide-y">
            {data?.items.map((r) => (
              <li key={r.userId} className="flex items-center justify-between px-6 py-3">
                <div className="flex items-center gap-3">
                  <span className="w-6 text-right font-semibold tabular-nums">{r.rank}</span>
                  {r.profile ? (
                    <Link
                      href={`/u/${r.profile.sharableSlug}`}
                      className="font-medium hover:underline"
                    >
                      {r.profile.fullName}
                    </Link>
                  ) : (
                    <span className="text-muted-foreground">Unknown user</span>
                  )}
                </div>
                <span className="text-sm text-muted-foreground">{r.score} pts</span>
              </li>
            ))}
            {(data?.items.length ?? 0) === 0 && (
              <li className="p-6 text-sm text-muted-foreground">
                No rankings yet — solve a problem to appear.
              </li>
            )}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
