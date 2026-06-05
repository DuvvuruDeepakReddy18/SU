'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { Trophy, ChevronUp } from 'lucide-react';

type LeaderEntry = {
  entryId: string;
  name: string;
  avg: number | null;
  judgeCount: number;
  rank: number;
  advancing: boolean;
};
type Round = {
  id: string;
  name: string;
  sequence: number;
  status: 'upcoming' | 'active' | 'closed';
  advanceCount: number | null;
  leaderboard: LeaderEntry[];
};
type Judge = { userId: string; name: string };

/**
 * Rounds + jury scoring for one competition. Everyone sees the per-round
 * leaderboards; judges can score entries in an active round; the organiser can
 * add rounds and open/close them.
 */
export function CompetitionRounds({
  competitionId,
  isOrganiser,
  currentUserId,
  token,
  onClose,
}: {
  competitionId: string;
  isOrganiser: boolean;
  currentUserId?: string;
  token?: string;
  onClose: () => void;
}) {
  const qc = useQueryClient();
  const key = ['competition-rounds', competitionId];
  const [newRound, setNewRound] = useState({ name: '', advanceCount: '' });

  const { data: rounds } = useQuery({
    queryKey: key,
    queryFn: () => api<Round[]>(`/competitions/${competitionId}/rounds`),
  });
  const { data: judges } = useQuery({
    queryKey: ['competition-judges', competitionId],
    queryFn: () => api<Judge[]>(`/competitions/${competitionId}/judges`, { token }),
    enabled: !!token,
  });
  const isJudge = isOrganiser || (judges ?? []).some((j) => j.userId === currentUserId);

  const refresh = () => qc.invalidateQueries({ queryKey: key });

  const addRound = useMutation({
    mutationFn: () =>
      api(`/competitions/${competitionId}/rounds`, {
        method: 'POST',
        token,
        body: JSON.stringify({
          name: newRound.name,
          ...(newRound.advanceCount ? { advanceCount: Number(newRound.advanceCount) } : {}),
        }),
      }),
    onSuccess: () => {
      toast.success('Round added');
      setNewRound({ name: '', advanceCount: '' });
      refresh();
      qc.invalidateQueries({ queryKey: ['competition-judges', competitionId] });
    },
    onError: (e) => toast.error((e as Error).message),
  });

  const setStatus = useMutation({
    mutationFn: ({ roundId, status }: { roundId: string; status: string }) =>
      api(`/competitions/rounds/${roundId}/status`, {
        method: 'PATCH',
        token,
        body: JSON.stringify({ status }),
      }),
    onSuccess: refresh,
    onError: (e) => toast.error((e as Error).message),
  });

  return (
    <div className="mt-3 space-y-3 rounded-md border bg-secondary/20 p-3">
      <div className="flex items-center justify-between">
        <span className="flex items-center gap-1.5 text-sm font-medium">
          <Trophy className="h-3.5 w-3.5" /> Rounds &amp; results
        </span>
        <button onClick={onClose} aria-label="Collapse" className="text-muted-foreground">
          <ChevronUp className="h-4 w-4" />
        </button>
      </div>

      {rounds?.length === 0 && (
        <p className="text-xs text-muted-foreground">
          {isOrganiser
            ? 'No rounds yet. Add the first round below to start jury scoring.'
            : 'The organiser hasn’t set up rounds yet.'}
        </p>
      )}

      {rounds?.map((r) => (
        <div key={r.id} className="rounded border bg-background p-3">
          <div className="mb-2 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">
                Round {r.sequence}: {r.name}
              </span>
              <Badge
                variant={
                  r.status === 'active'
                    ? 'default'
                    : r.status === 'closed'
                      ? 'secondary'
                      : 'outline'
                }
              >
                {r.status}
              </Badge>
              {r.advanceCount != null && (
                <span className="text-[11px] text-muted-foreground">
                  top {r.advanceCount} advance
                </span>
              )}
            </div>
            {isOrganiser && (
              <select
                value={r.status}
                onChange={(e) => setStatus.mutate({ roundId: r.id, status: e.target.value })}
                className="h-7 rounded border bg-background px-1.5 text-xs"
              >
                <option value="upcoming">upcoming</option>
                <option value="active">active</option>
                <option value="closed">closed</option>
              </select>
            )}
          </div>

          {r.leaderboard.length === 0 ? (
            <p className="text-xs text-muted-foreground">No entries yet.</p>
          ) : (
            <ul className="divide-y text-sm">
              {r.leaderboard.map((e) => (
                <ScoreRow
                  key={e.entryId}
                  entry={e}
                  roundId={r.id}
                  canScore={isJudge && r.status === 'active'}
                  token={token}
                  onScored={refresh}
                />
              ))}
            </ul>
          )}
        </div>
      ))}

      {isOrganiser && (
        <div className="flex flex-wrap items-end gap-2 border-t pt-3">
          <Input
            className="h-8 w-44"
            placeholder="New round name"
            value={newRound.name}
            onChange={(e) => setNewRound({ ...newRound, name: e.target.value })}
          />
          <Input
            className="h-8 w-28"
            type="number"
            min={1}
            placeholder="advance #"
            value={newRound.advanceCount}
            onChange={(e) => setNewRound({ ...newRound, advanceCount: e.target.value })}
          />
          <Button
            size="sm"
            disabled={!newRound.name || addRound.isPending}
            onClick={() => addRound.mutate()}
          >
            Add round
          </Button>
        </div>
      )}
    </div>
  );
}

function ScoreRow({
  entry,
  roundId,
  canScore,
  token,
  onScored,
}: {
  entry: LeaderEntry;
  roundId: string;
  canScore: boolean;
  token?: string;
  onScored: () => void;
}) {
  const [score, setScore] = useState('');
  const save = useMutation({
    mutationFn: () =>
      api(`/competitions/rounds/${roundId}/scores`, {
        method: 'POST',
        token,
        body: JSON.stringify({ entryId: entry.entryId, score: Number(score) }),
      }),
    onSuccess: () => {
      toast.success('Score saved');
      setScore('');
      onScored();
    },
    onError: (e) => toast.error((e as Error).message),
  });

  return (
    <li className="flex items-center justify-between gap-2 py-1.5">
      <div className="flex min-w-0 items-center gap-2">
        <span className="w-5 text-xs text-muted-foreground tabular-nums">#{entry.rank}</span>
        <span className="truncate">{entry.name}</span>
        {entry.advancing && (
          <Badge variant="success" className="text-[10px]">
            advancing
          </Badge>
        )}
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <span className="text-xs text-muted-foreground tabular-nums">
          {entry.avg == null ? '—' : entry.avg} {entry.judgeCount > 0 && `(${entry.judgeCount})`}
        </span>
        {canScore && (
          <>
            <Input
              className="h-7 w-16"
              type="number"
              min={0}
              max={100}
              placeholder="0-100"
              value={score}
              onChange={(e) => setScore(e.target.value)}
            />
            <Button
              size="sm"
              variant="outline"
              className="h-7"
              disabled={score === '' || save.isPending}
              onClick={() => save.mutate()}
            >
              Save
            </Button>
          </>
        )}
      </div>
    </li>
  );
}
