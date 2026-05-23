'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { api } from '@/lib/api';
import { Github, Linkedin } from 'lucide-react';
import { toast } from 'sonner';

type Integration = {
  provider: string;
  connected: boolean;
  syncStatus: string;
  lastSyncedAt: string | null;
};

export default function IntegrationsPage() {
  const { data: session } = useSession();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const token = (session as any)?.accessToken as string | undefined;
  const qc = useQueryClient();

  const { data } = useQuery({
    enabled: !!token,
    queryKey: ['integrations'],
    queryFn: () => api<Integration[]>('/integrations', { token }),
  });

  const connectGithub = useMutation({
    mutationFn: () =>
      api<{ url: string }>('/integrations/github/connect', { method: 'POST', token }),
    onSuccess: (res) => {
      if (res?.url) window.location.href = res.url;
    },
  });

  const sync = useMutation({
    mutationFn: (provider: string) =>
      api(`/integrations/${provider}/sync`, { method: 'POST', token }),
    onSuccess: () => {
      toast.success('Sync started');
      qc.invalidateQueries({ queryKey: ['integrations'] });
    },
    onError: (e) => toast.error((e as Error).message),
  });

  const byProvider = Object.fromEntries((data ?? []).map((i) => [i.provider, i]));

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Github className="h-4 w-4" /> GitHub
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Imports your public repos as projects — needed for L3 verification.
          </p>
          {byProvider.github?.connected ? (
            <div className="space-y-2">
              <Badge variant="success">Connected</Badge>
              <Button onClick={() => sync.mutate('github')} disabled={sync.isPending}>
                {sync.isPending ? 'Syncing…' : 'Sync now'}
              </Button>
            </div>
          ) : (
            <Button onClick={() => connectGithub.mutate()}>Connect GitHub</Button>
          )}
        </CardContent>
      </Card>

      {(['linkedin', 'leetcode', 'coursera'] as const).map((p) => (
        <Card key={p}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 capitalize">
              {p === 'linkedin' ? <Linkedin className="h-4 w-4" /> : null}
              {p}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Badge variant="secondary">Coming soon</Badge>
            <p className="mt-2 text-sm text-muted-foreground">Available in Phase 2.</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
