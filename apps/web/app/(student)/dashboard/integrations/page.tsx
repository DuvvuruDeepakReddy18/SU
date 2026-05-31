'use client';

import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { api } from '@/lib/api';
import { useConfig } from '@/lib/use-config';
import { Github, Linkedin, Link2, Plus, Trash2, ExternalLink, FileCheck } from 'lucide-react';
import { toast } from 'sonner';

type Integration = {
  provider: string;
  connected: boolean;
  syncStatus: string;
  lastSyncedAt: string | null;
};

type CustomLink = { label: string; url: string; icon?: string };

type Profile = {
  customLinks: CustomLink[] | null;
};

export default function IntegrationsPage() {
  const { data: session } = useSession();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const token = (session as any)?.accessToken as string | undefined;
  const qc = useQueryClient();
  const config = useConfig();

  const { data } = useQuery({
    enabled: !!token,
    queryKey: ['integrations'],
    queryFn: () => api<Integration[]>('/integrations', { token }),
  });

  const { data: profile } = useQuery({
    enabled: !!token,
    queryKey: ['profile.me'],
    queryFn: () => api<Profile>('/profile/me', { token }),
  });

  const connectGithub = useMutation({
    mutationFn: () =>
      api<{ url: string }>('/integrations/github/connect', { method: 'POST', token }),
    onSuccess: (res) => {
      if (res?.url) window.location.href = res.url;
    },
  });

  const connectDigiLocker = useMutation({
    mutationFn: () =>
      api<{ url: string }>('/integrations/digilocker/connect', { method: 'POST', token }),
    onSuccess: (res) => {
      if (res?.url) window.location.href = res.url;
    },
    onError: (e) => toast.error((e as Error).message),
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

  // ---- Custom links ----
  const [links, setLinks] = useState<CustomLink[]>([]);
  const [newLabel, setNewLabel] = useState('');
  const [newUrl, setNewUrl] = useState('');

  useEffect(() => {
    if (profile?.customLinks) setLinks(profile.customLinks);
  }, [profile?.customLinks]);

  const saveLinks = useMutation({
    mutationFn: (next: CustomLink[]) =>
      api('/profile/me', {
        method: 'PATCH',
        token,
        body: JSON.stringify({ customLinks: next }),
      }),
    onSuccess: () => {
      toast.success('Saved');
      qc.invalidateQueries({ queryKey: ['profile.me'] });
    },
    onError: (e) => toast.error((e as Error).message),
  });

  function addLink() {
    if (!newLabel.trim() || !newUrl.trim()) {
      toast.error('Label and URL are required');
      return;
    }
    if (!/^https?:\/\//i.test(newUrl)) {
      toast.error('URL must start with http:// or https://');
      return;
    }
    const next = [...links, { label: newLabel.trim(), url: newUrl.trim() }];
    setLinks(next);
    setNewLabel('');
    setNewUrl('');
    saveLinks.mutate(next);
  }

  function removeLink(idx: number) {
    const next = links.filter((_, i) => i !== idx);
    setLinks(next);
    saveLinks.mutate(next);
  }

  return (
    <div className="space-y-6">
      {/* Built-in providers */}
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
              <p className="mt-2 text-sm text-muted-foreground">
                OAuth coming in Phase 2. For now, add the URL under <strong>Custom links</strong>{' '}
                below.
              </p>
            </CardContent>
          </Card>
        ))}

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileCheck className="h-4 w-4" /> DigiLocker / NAD
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Imports your academic records and degree certificates directly from the Govt-of-India
              DigiLocker registry — bypasses manual marksheet uploads.
            </p>
            {config.digiLocker ? (
              <Button
                onClick={() => connectDigiLocker.mutate()}
                disabled={connectDigiLocker.isPending}
              >
                {connectDigiLocker.isPending ? 'Redirecting…' : 'Connect DigiLocker'}
              </Button>
            ) : (
              <>
                <Badge variant="secondary">Coming soon</Badge>
                <p className="mt-1 text-xs text-muted-foreground">
                  Pending Govt-of-India API onboarding. When approved, your admin sets{' '}
                  <code className="text-foreground">DIGILOCKER_CLIENT_ID</code> in env and this tile
                  flips to a connect button.
                </p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Custom links */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Link2 className="h-4 w-4 text-primary" /> Custom links
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Add any profile link you want shown on your portfolio — Kaggle, HackerRank, personal
            blog, Medium, Behance, anything.
          </p>

          {links.length > 0 && (
            <ul className="space-y-2">
              {links.map((l, i) => (
                <li
                  key={`${l.label}-${i}`}
                  className="flex items-center justify-between rounded-md border p-3"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <ExternalLink className="h-4 w-4 text-muted-foreground shrink-0" />
                    <div className="min-w-0">
                      <div className="font-medium text-sm truncate">{l.label}</div>
                      <a
                        href={l.url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs text-primary hover:underline truncate block max-w-md"
                      >
                        {l.url}
                      </a>
                    </div>
                  </div>
                  <button
                    onClick={() => removeLink(i)}
                    className="text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </li>
              ))}
            </ul>
          )}

          <div className="grid gap-2 md:grid-cols-[1fr_2fr_auto] md:items-end">
            <div>
              <div className="mb-1 text-xs text-muted-foreground">Label</div>
              <Input
                placeholder="Kaggle"
                value={newLabel}
                onChange={(e) => setNewLabel(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addLink()}
              />
            </div>
            <div>
              <div className="mb-1 text-xs text-muted-foreground">URL</div>
              <Input
                placeholder="https://kaggle.com/your-username"
                value={newUrl}
                onChange={(e) => setNewUrl(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addLink()}
              />
            </div>
            <Button onClick={addLink} disabled={!newLabel.trim() || !newUrl.trim()}>
              <Plus className="h-4 w-4" /> Add
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
