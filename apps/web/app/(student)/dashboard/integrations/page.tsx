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
import {
  Github,
  Linkedin,
  Code2,
  Trophy,
  Link2,
  Plus,
  Trash2,
  ExternalLink,
  FileCheck,
} from 'lucide-react';
import { toast } from 'sonner';
import { ProfileTabs } from '@/components/profile-tabs';

type CustomLink = { label: string; url: string; icon?: string };

type LinkKey = 'githubUrl' | 'linkedinUrl' | 'leetcodeUrl' | 'codechefUrl';

type Profile = {
  githubUrl: string | null;
  linkedinUrl: string | null;
  leetcodeUrl: string | null;
  codechefUrl: string | null;
  customLinks: CustomLink[] | null;
};

const LINK_PROVIDERS: {
  key: LinkKey;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  placeholder: string;
  help: string;
}[] = [
  {
    key: 'githubUrl',
    label: 'GitHub',
    icon: Github,
    placeholder: 'https://github.com/your-username',
    help: 'Your public repos back up L3 "Proven" projects.',
  },
  {
    key: 'linkedinUrl',
    label: 'LinkedIn',
    icon: Linkedin,
    placeholder: 'https://linkedin.com/in/your-name',
    help: 'Shown on your portfolio for recruiters.',
  },
  {
    key: 'leetcodeUrl',
    label: 'LeetCode',
    icon: Code2,
    placeholder: 'https://leetcode.com/u/your-username',
    help: 'Your problem-solving profile.',
  },
  {
    key: 'codechefUrl',
    label: 'CodeChef',
    icon: Trophy,
    placeholder: 'https://codechef.com/users/your-username',
    help: 'Your contest profile.',
  },
];

export default function IntegrationsPage() {
  const { data: session } = useSession();

  const token = session?.accessToken as string | undefined;
  const qc = useQueryClient();
  const config = useConfig();

  const { data: profile } = useQuery({
    enabled: !!token,
    queryKey: ['profile.me'],
    queryFn: () => api<Profile>('/profile/me', { token }),
  });

  // Save a single profile link. The API validates the host (e.g. github.com)
  // and returns "This doesn't look like a GitHub URL" on a mismatch.
  const saveLink = useMutation({
    mutationFn: (body: Partial<Record<LinkKey, string | null>>) =>
      api('/profile/me', { method: 'PATCH', token, body: JSON.stringify(body) }),
    onSuccess: () => {
      toast.success('Saved');
      qc.invalidateQueries({ queryKey: ['profile.me'] });
    },
    onError: (e) => toast.error((e as Error).message),
  });

  const connectDigiLocker = useMutation({
    mutationFn: () =>
      api<{ url: string }>('/integrations/digilocker/connect', { method: 'POST', token }),
    onSuccess: (res) => {
      if (res?.url) window.location.href = res.url;
    },
    onError: (e) => toast.error((e as Error).message),
  });

  // Surface the result when DigiLocker redirects back, then clean the URL.
  useEffect(() => {
    const status = new URLSearchParams(window.location.search).get('digilocker');
    if (!status) return;
    if (status === 'linked') toast.success('DigiLocker linked.');
    else toast.error("Couldn't link DigiLocker. Please try again.");
    window.history.replaceState({}, '', window.location.pathname);
  }, []);

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
    <div className="space-y-4">
      <ProfileTabs />
      <div className="space-y-6">
        <div>
          <h2 className="text-lg font-semibold">Your profiles</h2>
          <p className="text-sm text-muted-foreground">
            Paste your profile link. We check it&apos;s the right site and show it on your portfolio
            as a clickable link.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {LINK_PROVIDERS.map((p) => (
            <ProfileLinkTile
              key={p.key}
              provider={p}
              value={profile?.[p.key] ?? null}
              saving={saveLink.isPending}
              onSave={(url) =>
                saveLink.mutate({ [p.key]: url } as Partial<Record<LinkKey, string | null>>)
              }
            />
          ))}

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileCheck className="h-4 w-4" /> DigiLocker / NAD
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Imports your academic records and degree certificates directly from the
                Govt-of-India DigiLocker registry, bypassing manual marksheet uploads.
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
                    <code className="text-foreground">DIGILOCKER_CLIENT_ID</code> in env and this
                    tile flips to a connect button.
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
              Add any other profile link to show on your portfolio: Kaggle, HackerRank, personal
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
    </div>
  );
}

function ProfileLinkTile({
  provider,
  value,
  onSave,
  saving,
}: {
  provider: (typeof LINK_PROVIDERS)[number];
  value: string | null;
  onSave: (url: string | null) => void;
  saving: boolean;
}) {
  const Icon = provider.icon;
  const [editing, setEditing] = useState(false);
  const [url, setUrl] = useState(value ?? '');

  useEffect(() => {
    setUrl(value ?? '');
    setEditing(false);
  }, [value]);

  const connected = !!value && !editing;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Icon className="h-4 w-4" /> {provider.label}
          {connected && (
            <Badge variant="success" className="ml-auto">
              Added
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-muted-foreground">{provider.help}</p>
        {connected ? (
          <div className="flex items-center justify-between gap-2">
            <a
              href={value ?? '#'}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-sm text-primary hover:underline min-w-0"
            >
              <ExternalLink className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">{value}</span>
            </a>
            <div className="flex gap-1 shrink-0">
              <Button size="sm" variant="outline" onClick={() => setEditing(true)}>
                Change
              </Button>
              <Button size="sm" variant="ghost" onClick={() => onSave(null)} disabled={saving}>
                Remove
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex gap-2">
            <Input
              placeholder={provider.placeholder}
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && url.trim() && onSave(url.trim())}
            />
            <Button size="sm" disabled={saving || !url.trim()} onClick={() => onSave(url.trim())}>
              Save
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
