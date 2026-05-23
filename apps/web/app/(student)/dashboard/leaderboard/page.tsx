'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { api } from '@/lib/api';

type Row = {
  rank: number;
  score: number;
  userId: string;
  profile: { fullName: string; avatarUrl: string | null; sharableSlug: string } | null;
};

export default function LeaderboardPage() {
  const [scope, setScope] = useState<'global' | 'college'>('global');

  const { data } = useQuery({
    queryKey: ['leaderboard', scope],
    queryFn: () => api<{ scope: string; items: Row[] }>(`/leaderboard?scope=${scope}`),
  });

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        {(['global', 'college'] as const).map((s) => (
          <button
            key={s}
            onClick={() => setScope(s)}
            className={`rounded-md border px-3 py-1 text-sm capitalize ${scope === s ? 'bg-primary text-primary-foreground' : ''}`}
          >
            {s}
          </button>
        ))}
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="capitalize">{scope} leaderboard</CardTitle>
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
            {data?.items.length === 0 && (
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
