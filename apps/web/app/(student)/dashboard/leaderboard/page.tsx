'use client';

import { useMemo, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';
import { Crown, Trophy, Award } from 'lucide-react';

type Row = {
  rank: number;
  score: number;
  userId: string;
  profile: { fullName: string; avatarUrl: string | null; sharableSlug: string } | null;
};

type SkillRow = Row & { layer: string; institution: string | null };

type Profile = {
  user: { institutionId: string | null; institution: { name: string } | null };
};

type Skill = { id: string; name: string };

type Scope = 'global' | 'institute' | 'skill';

const LAYER_BADGE: Record<
  string,
  { label: string; variant: 'default' | 'success' | 'warning' | 'secondary' }
> = {
  L1_ACADEMIC: { label: 'L1', variant: 'warning' },
  L2_CERTIFIED: { label: 'L2', variant: 'default' },
  L3_PROVEN: { label: 'L3', variant: 'success' },
  L4_EXPERT: { label: 'L4', variant: 'success' },
};

export default function LeaderboardPage() {
  const { data: session } = useSession();

  const token = session?.accessToken as string | undefined;
  const [scope, setScope] = useState<Scope>('global');
  const [skillId, setSkillId] = useState<string>('');
  const [skillInstituteOnly, setSkillInstituteOnly] = useState(false);

  const { data: profile } = useQuery({
    enabled: !!token,
    queryKey: ['profile.me'],
    queryFn: () => api<Profile>('/profile/me', { token }),
  });
  const institutionId = profile?.user?.institutionId ?? null;
  const institutionName = profile?.user?.institution?.name ?? 'My institute';

  // Skills catalog for the picker (only fetched when the Skill tab is opened).
  const { data: skills } = useQuery({
    enabled: scope === 'skill',
    queryKey: ['skills.catalog'],
    queryFn: () => api<Skill[]>('/skills/catalog'),
  });

  // Global / institute (snapshot-based)
  const { data: snapshotData } = useQuery({
    enabled: scope !== 'skill' && (scope === 'global' || !!institutionId),
    queryKey: ['leaderboard', scope, institutionId],
    queryFn: () => {
      const url =
        scope === 'institute' && institutionId
          ? `/leaderboard?scope=college&id=${institutionId}`
          : '/leaderboard?scope=global';
      return api<{ scope: string; items: Row[] }>(url);
    },
  });

  // Skill leaderboard (on-demand)
  const skillUrl = useMemo(() => {
    if (!skillId) return null;
    const params = new URLSearchParams({ skillId });
    if (skillInstituteOnly && institutionId) params.set('institutionId', institutionId);
    return `/leaderboard/skill?${params.toString()}`;
  }, [skillId, skillInstituteOnly, institutionId]);
  const { data: skillData } = useQuery({
    enabled: scope === 'skill' && !!skillUrl,
    queryKey: ['leaderboard.skill', skillId, skillInstituteOnly, institutionId],
    queryFn: () =>
      api<{ scope: string; skillId: string; skillName: string | null; items: SkillRow[] }>(
        skillUrl!,
      ),
  });

  const title =
    scope === 'global'
      ? 'Global leaderboard'
      : scope === 'institute'
        ? `${institutionName} leaderboard`
        : skillData?.skillName
          ? `${skillData.skillName} — top performers`
          : 'Skill leaderboard';

  return (
    <div className="space-y-5 max-w-3xl">
      <header>
        <h1 className="text-2xl font-semibold flex items-center gap-2">
          <Trophy className="h-5 w-5 text-primary" />
          Leaderboard
        </h1>
        <p className="text-sm text-muted-foreground">
          Verified profiles climb fastest. Recruiters search this list.
        </p>
      </header>

      <div className="inline-flex rounded-md border bg-secondary/30 p-1">
        <Tab active={scope === 'global'} onClick={() => setScope('global')}>
          Global
        </Tab>
        <Tab
          active={scope === 'institute'}
          onClick={() => setScope('institute')}
          disabled={!institutionId}
        >
          {institutionName}
        </Tab>
        <Tab active={scope === 'skill'} onClick={() => setScope('skill')}>
          By skill
        </Tab>
      </div>

      {scope === 'skill' && (
        <Card>
          <CardContent className="p-4 flex flex-wrap items-center gap-3">
            <select
              value={skillId}
              onChange={(e) => setSkillId(e.target.value)}
              className="rounded-md border bg-background px-3 py-2 text-sm flex-1 min-w-[200px]"
            >
              <option value="">Pick a skill…</option>
              {skills?.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
            <label className="inline-flex items-center gap-2 text-xs text-muted-foreground cursor-pointer">
              <input
                type="checkbox"
                checked={skillInstituteOnly}
                onChange={(e) => setSkillInstituteOnly(e.target.checked)}
                disabled={!institutionId}
              />
              Limit to {institutionName}
            </label>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{title}</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {scope === 'skill' ? (
            <SkillTable rows={skillData?.items ?? []} ready={!!skillId} />
          ) : (
            <SnapshotTable rows={snapshotData?.items ?? []} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function Tab({
  active,
  onClick,
  disabled,
  children,
}: {
  active: boolean;
  onClick: () => void;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'rounded px-3 py-1 text-sm transition disabled:opacity-50',
        active ? 'bg-background shadow-sm' : 'text-muted-foreground',
      )}
    >
      {children}
    </button>
  );
}

function SnapshotTable({ rows }: { rows: Row[] }) {
  if (rows.length === 0) {
    return (
      <div className="p-6 text-sm text-muted-foreground">
        No rankings yet — solve a problem to appear.
      </div>
    );
  }
  return (
    <ul className="divide-y">
      {rows.map((r) => (
        <li key={r.userId} className="flex items-center justify-between px-6 py-3">
          <div className="flex items-center gap-3">
            <RankBadge rank={r.rank} />
            {r.profile ? (
              <Link href={`/u/${r.profile.sharableSlug}`} className="font-medium hover:underline">
                {r.profile.fullName}
              </Link>
            ) : (
              <span className="text-muted-foreground">Unknown user</span>
            )}
          </div>
          <span className="text-sm text-muted-foreground">{r.score} pts</span>
        </li>
      ))}
    </ul>
  );
}

function SkillTable({ rows, ready }: { rows: SkillRow[]; ready: boolean }) {
  if (!ready) {
    return (
      <div className="p-6 text-sm text-muted-foreground">
        Pick a skill above to see who&apos;s leading that domain.
      </div>
    );
  }
  if (rows.length === 0) {
    return (
      <div className="p-6 text-sm text-muted-foreground">
        Nobody has verified this skill yet. Be the first.
      </div>
    );
  }
  return (
    <ul className="divide-y">
      {rows.map((r) => {
        const meta = LAYER_BADGE[r.layer];
        return (
          <li key={r.userId} className="flex items-center justify-between gap-3 px-6 py-3">
            <div className="flex items-center gap-3 min-w-0">
              <RankBadge rank={r.rank} />
              <div className="min-w-0">
                {r.profile ? (
                  <Link
                    href={`/u/${r.profile.sharableSlug}`}
                    className="font-medium hover:underline truncate block"
                  >
                    {r.profile.fullName}
                  </Link>
                ) : (
                  <span className="text-muted-foreground">Unknown user</span>
                )}
                {r.institution && (
                  <div className="text-[10px] text-muted-foreground truncate">{r.institution}</div>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {meta && <Badge variant={meta.variant}>{meta.label}</Badge>}
              <span className="text-xs text-muted-foreground tabular-nums">{r.score} pts</span>
            </div>
          </li>
        );
      })}
    </ul>
  );
}

function RankBadge({ rank }: { rank: number }) {
  if (rank === 1) {
    return (
      <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-gradient-to-br from-amber-300 to-yellow-500 text-white shadow-sm">
        <Crown className="h-3.5 w-3.5" />
      </span>
    );
  }
  if (rank === 2 || rank === 3) {
    return (
      <span
        className={cn(
          'inline-flex items-center justify-center w-7 h-7 rounded-full text-white shadow-sm',
          rank === 2
            ? 'bg-gradient-to-br from-slate-300 to-slate-500'
            : 'bg-gradient-to-br from-amber-700 to-orange-700',
        )}
      >
        <Award className="h-3.5 w-3.5" />
      </span>
    );
  }
  return (
    <span className="w-7 text-right font-semibold tabular-nums text-muted-foreground">{rank}</span>
  );
}
