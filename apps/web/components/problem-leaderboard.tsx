'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Trophy } from 'lucide-react';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';

type LeaderboardRow = {
  rank: number;
  userId: string;
  runtimeMs: number;
  memoryKb: number | null;
  language: string;
  fullName: string;
  avatarUrl: string | null;
  sharableSlug: string;
  institutionName: string | null;
};

/**
 * Right-rail leaderboard panel for the problem detail page. Tabs between
 * global top-10 and the caller's own institution. Ranks by fastest accepted
 * runtimeMs across all users.
 */
export function ProblemLeaderboard({ slug }: { slug: string }) {
  const [scope, setScope] = useState<'global' | 'institute'>('global');
  const { data: session } = useSession();

  const token = session?.accessToken as string | undefined;

  const { data: profile } = useQuery({
    enabled: !!token,
    queryKey: ['profile.me'],
    queryFn: () =>
      api<{ user: { institutionId: string | null; institution: { name: string } | null } }>(
        '/profile/me',
        { token },
      ),
  });
  const institutionId = profile?.user?.institutionId ?? null;

  const queryParams =
    scope === 'institute' && institutionId
      ? `?scope=institute&institutionId=${institutionId}`
      : '?scope=global';

  const { data } = useQuery({
    queryKey: ['practice.leaderboard', slug, scope, institutionId],
    queryFn: () =>
      api<{ scope: string; items: LeaderboardRow[] }>(
        `/practice/problems/${slug}/leaderboard${queryParams}`,
      ),
    enabled: scope === 'global' || !!institutionId,
  });

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center justify-between text-sm">
          <span className="inline-flex items-center gap-1.5">
            <Trophy className="h-4 w-4 text-primary" /> Fastest solutions
          </span>
        </CardTitle>
        <div className="inline-flex rounded-md border bg-secondary/30 p-0.5 text-xs">
          <button
            onClick={() => setScope('global')}
            className={cn(
              'rounded px-2 py-0.5 transition',
              scope === 'global' ? 'bg-background shadow-sm' : 'text-muted-foreground',
            )}
          >
            Global
          </button>
          <button
            onClick={() => setScope('institute')}
            disabled={!institutionId}
            className={cn(
              'rounded px-2 py-0.5 transition disabled:opacity-50',
              scope === 'institute' ? 'bg-background shadow-sm' : 'text-muted-foreground',
            )}
            title={institutionId ? '' : 'Sign in to see your institute'}
          >
            My institute
          </button>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {(data?.items.length ?? 0) === 0 ? (
          <div className="px-4 py-6 text-xs text-muted-foreground text-center">
            No accepted solutions yet, be first.
          </div>
        ) : (
          <ul className="divide-y">
            {data?.items.map((r) => (
              <li key={r.userId} className="flex items-center justify-between px-3 py-2 text-xs">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="w-4 text-right font-semibold text-muted-foreground tabular-nums">
                    {r.rank}
                  </span>
                  {r.sharableSlug ? (
                    <Link
                      href={`/u/${r.sharableSlug}`}
                      className="truncate font-medium hover:underline"
                    >
                      {r.fullName}
                    </Link>
                  ) : (
                    <span className="truncate font-medium">{r.fullName}</span>
                  )}
                  {r.institutionName && scope === 'global' && (
                    <span className="text-[10px] text-muted-foreground truncate">
                      · {r.institutionName}
                    </span>
                  )}
                </div>
                <div className="text-right shrink-0">
                  <div className="tabular-nums font-mono">{r.runtimeMs} ms</div>
                  <div className="text-[10px] text-muted-foreground uppercase">{r.language}</div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
