'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { Plus, Trash2 } from 'lucide-react';

type Skill = { id: string; name: string; category: string };
type UserSkill = {
  id: string;
  selfRatedLevel: number;
  highestVerificationLayer: string;
  skill: Skill;
};

const LAYER_COLORS: Record<string, 'secondary' | 'warning' | 'default' | 'success'> = {
  L0_UNVERIFIED: 'secondary',
  L1_ACADEMIC: 'warning',
  L2_CERTIFIED: 'default',
  L3_PROVEN: 'success',
  L4_EXPERT: 'success',
};

export default function SkillsPage() {
  const { data: session } = useSession();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const token = (session as any)?.accessToken as string | undefined;
  const qc = useQueryClient();
  const [q, setQ] = useState('');

  const { data: catalog } = useQuery({
    queryKey: ['skills.catalog', q],
    queryFn: () =>
      api<{ items: Skill[] }>(`/skills/catalog?q=${encodeURIComponent(q)}&pageSize=30`),
  });

  const { data: mine } = useQuery({
    enabled: !!token,
    queryKey: ['skills.mine'],
    queryFn: () => api<UserSkill[]>('/skills/me', { token }),
  });

  const claim = useMutation({
    mutationFn: (skillId: string) =>
      api('/skills/me', {
        method: 'POST',
        token,
        body: JSON.stringify({ skillId, selfRatedLevel: 3 }),
      }),
    onSuccess: () => {
      toast.success('Skill added');
      qc.invalidateQueries({ queryKey: ['skills.mine'] });
    },
    onError: (e) => toast.error((e as Error).message),
  });

  const remove = useMutation({
    mutationFn: (id: string) => api(`/skills/me/${id}`, { method: 'DELETE', token }),
    onSuccess: () => {
      toast.success('Removed');
      qc.invalidateQueries({ queryKey: ['skills.mine'] });
    },
  });

  const claimedIds = new Set(mine?.map((m) => m.skill.id));

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>My skills</CardTitle>
        </CardHeader>
        <CardContent>
          {mine?.length === 0 && (
            <p className="text-sm text-muted-foreground">Claim skills from the catalog →</p>
          )}
          <ul className="space-y-2">
            {mine?.map((us) => (
              <li key={us.id} className="flex items-center justify-between rounded-md border p-3">
                <div>
                  <div className="font-medium">{us.skill.name}</div>
                  <div className="text-xs text-muted-foreground">{us.skill.category}</div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={LAYER_COLORS[us.highestVerificationLayer] ?? 'secondary'}>
                    {us.highestVerificationLayer.replace('_', ' ')}
                  </Badge>
                  <Button size="icon" variant="ghost" onClick={() => remove.mutate(us.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Skill catalog</CardTitle>
        </CardHeader>
        <CardContent>
          <Input
            placeholder="Search Python, AWS, React…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
          <ul className="mt-4 max-h-[60vh] space-y-2 overflow-auto">
            {catalog?.items.map((s) => (
              <li key={s.id} className="flex items-center justify-between rounded-md border p-3">
                <div>
                  <div className="font-medium">{s.name}</div>
                  <div className="text-xs text-muted-foreground">{s.category}</div>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={claimedIds.has(s.id)}
                  onClick={() => claim.mutate(s.id)}
                >
                  <Plus className="h-3.5 w-3.5" />
                  {claimedIds.has(s.id) ? 'Added' : 'Add'}
                </Button>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
