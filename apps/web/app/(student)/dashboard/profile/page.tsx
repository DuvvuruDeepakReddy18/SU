'use client';

import { useEffect, useRef, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  Sparkles,
  Upload,
  FileText,
  Pencil,
  Github,
  Linkedin,
  Code2,
  Trophy,
  Globe,
  CheckCircle2,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { api } from '@/lib/api';

type Profile = {
  fullName: string;
  headline: string | null;
  bio: string | null;
  phone: string | null;
  location: string | null;
  cgpa: number | null;
  graduationYear: number | null;
  isPublic: boolean;
  sharableSlug: string;
  avatarUrl: string | null;
  resumeUrl: string | null;
  linkedinUrl: string | null;
  githubUrl: string | null;
  leetcodeUrl: string | null;
  codechefUrl: string | null;
  portfolioUrl: string | null;
};

export default function ProfilePage() {
  const { data: session } = useSession();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const token = (session as any)?.accessToken as string | undefined;
  const qc = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);

  const [editing, setEditing] = useState(false);
  const [parsing, setParsing] = useState(false);
  const [justParsed, setJustParsed] = useState<string[] | null>(null);
  const [form, setForm] = useState<Partial<Profile>>({});

  const {
    data: profile,
    error: profileError,
    isLoading: profileLoading,
  } = useQuery({
    enabled: !!token,
    queryKey: ['profile.me'],
    queryFn: () => api<Profile>('/profile/me', { token }),
    retry: 1,
  });
  useEffect(() => {
    if (profile) setForm(profile);
  }, [profile]);

  // Feature flags — used to hide the file-upload UI when the API has no S3 config.
  const { data: features } = useQuery({
    queryKey: ['config'],
    queryFn: () =>
      api<{ storage: boolean; ai: boolean; github: boolean; google: boolean }>('/config'),
  });
  const storageEnabled = features?.storage ?? true;

  const hasResume = !!profile?.resumeUrl;
  // Heuristic for "profile not really set up yet": no headline/bio AND no skills count etc.
  // We just use "no resume" as the trigger for the onboarding hero.

  const update = useMutation({
    mutationFn: (body: Partial<Profile>) =>
      api('/profile/me', { method: 'PATCH', token, body: JSON.stringify(body) }),
    onSuccess: () => {
      toast.success('Saved');
      setEditing(false);
      qc.invalidateQueries({ queryKey: ['profile.me'] });
    },
    onError: (e) => toast.error((e as Error).message),
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  function summarizeParsed(parsed: any): string[] {
    const populated: string[] = [];
    const p = parsed ?? {};
    if (p.fullName) populated.push('name');
    if (p.headline) populated.push('headline');
    if (p.bio) populated.push('bio');
    if (p.phone) populated.push('phone');
    if (p.location) populated.push('location');
    if (p.linkedinUrl) populated.push('LinkedIn');
    if (p.githubUrl) populated.push('GitHub');
    if (p.leetcodeUrl) populated.push('LeetCode');
    if (p.codechefUrl) populated.push('CodeChef');
    if (p.portfolioUrl) populated.push('portfolio');
    if (p.skills?.length) populated.push(`${p.skills.length} skills`);
    if (p.projects?.length) populated.push(`${p.projects.length} projects`);
    if (p.education?.length) populated.push('CGPA + graduation year');
    return populated;
  }

  async function onResume(file: File) {
    setParsing(true);
    setJustParsed(null);
    const fd = new FormData();
    fd.append('file', file);
    const tid = toast.loading('Uploading and reading your resume with AI…');
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/profile/resume`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: fd,
      });
      if (!res.ok) {
        const txt = await res.text();
        throw new Error(txt.slice(0, 300));
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const data = (await res.json()) as { parsed: any };
      setJustParsed(summarizeParsed(data.parsed));
      toast.success('Your profile has been filled in', { id: tid });
      qc.invalidateQueries({ queryKey: ['profile.me'] });
    } catch (err) {
      toast.error('Resume parsing failed — ' + (err as Error).message.slice(0, 100), { id: tid });
    } finally {
      setParsing(false);
    }
  }

  async function onResumeText(text: string) {
    if (text.trim().length < 30) {
      toast.error('Please paste at least a few lines from your resume.');
      return;
    }
    setParsing(true);
    setJustParsed(null);
    const tid = toast.loading('Reading your resume with AI…');
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/profile/resume-text`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      });
      if (!res.ok) {
        const txt = await res.text();
        throw new Error(txt.slice(0, 300));
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const data = (await res.json()) as { parsed: any };
      setJustParsed(summarizeParsed(data.parsed));
      toast.success('Your profile has been filled in', { id: tid });
      qc.invalidateQueries({ queryKey: ['profile.me'] });
    } catch (err) {
      toast.error('Resume parsing failed — ' + (err as Error).message.slice(0, 100), { id: tid });
    } finally {
      setParsing(false);
    }
  }

  async function onAvatar(file: File) {
    const fd = new FormData();
    fd.append('file', file);
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/profile/avatar`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: fd,
    });
    if (!res.ok) return toast.error('Avatar upload failed');
    toast.success('Avatar updated');
    qc.invalidateQueries({ queryKey: ['profile.me'] });
  }

  if (!token) {
    return (
      <Card className="max-w-2xl">
        <CardContent className="py-8 space-y-3">
          <p className="font-medium">Your session is missing an access token.</p>
          <p className="text-sm text-muted-foreground">
            Sign out and sign back in to refresh — this usually happens after auth-related code
            changes.
          </p>
          <Button onClick={() => (window.location.href = '/api/auth/signout')}>Sign out</Button>
        </CardContent>
      </Card>
    );
  }
  if (profileError) {
    return (
      <Card className="max-w-2xl">
        <CardContent className="py-8 space-y-3">
          <p className="font-medium text-destructive">Couldn&apos;t load your profile</p>
          <pre className="text-xs whitespace-pre-wrap rounded bg-secondary p-3">
            {(profileError as Error).message}
          </pre>
          <div className="flex gap-2">
            <Button onClick={() => qc.invalidateQueries({ queryKey: ['profile.me'] })}>
              Retry
            </Button>
            <Button variant="outline" onClick={() => (window.location.href = '/api/auth/signout')}>
              Sign out
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }
  if (!profile || profileLoading) return <ProfileSkeleton />;

  // --- Onboarding hero — no resume yet ---
  if (!hasResume && !editing && !justParsed) {
    return (
      <div className="max-w-3xl">
        <UploadHero
          parsing={parsing}
          storageEnabled={storageEnabled}
          onFile={onResume}
          onText={onResumeText}
          onSkip={() => setEditing(true)}
        />
      </div>
    );
  }

  // --- Edit mode (the original form) ---
  if (editing) {
    return (
      <div className="max-w-3xl space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Edit profile</h2>
          <Button variant="ghost" size="sm" onClick={() => setEditing(false)}>
            Done editing
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Public profile</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Row label="Full name">
              <Input
                value={form.fullName ?? ''}
                onChange={(e) => setForm({ ...form, fullName: e.target.value })}
              />
            </Row>
            <Row label="Headline">
              <Input
                value={form.headline ?? ''}
                onChange={(e) => setForm({ ...form, headline: e.target.value })}
                placeholder="e.g. CS undergrad @ IIT, ML enthusiast"
              />
            </Row>
            <Row label="Bio">
              <textarea
                className="flex min-h-[100px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm"
                value={form.bio ?? ''}
                onChange={(e) => setForm({ ...form, bio: e.target.value })}
              />
            </Row>
            <div className="grid gap-4 md:grid-cols-2">
              <Row label="Phone">
                <Input
                  value={form.phone ?? ''}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                />
              </Row>
              <Row label="Location">
                <Input
                  value={form.location ?? ''}
                  onChange={(e) => setForm({ ...form, location: e.target.value })}
                />
              </Row>
              <Row label="CGPA">
                <Input
                  type="number"
                  step="0.01"
                  value={form.cgpa ?? ''}
                  onChange={(e) =>
                    setForm({ ...form, cgpa: e.target.value ? Number(e.target.value) : null })
                  }
                />
              </Row>
              <Row label="Graduation year">
                <Input
                  type="number"
                  value={form.graduationYear ?? ''}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      graduationYear: e.target.value ? Number(e.target.value) : null,
                    })
                  }
                />
              </Row>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Links</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <LinkRow
              icon={Linkedin}
              label="LinkedIn"
              value={form.linkedinUrl}
              onChange={(v) => setForm({ ...form, linkedinUrl: v })}
              placeholder="https://linkedin.com/in/…"
            />
            <LinkRow
              icon={Github}
              label="GitHub"
              value={form.githubUrl}
              onChange={(v) => setForm({ ...form, githubUrl: v })}
              placeholder="https://github.com/…"
            />
            <LinkRow
              icon={Code2}
              label="LeetCode"
              value={form.leetcodeUrl}
              onChange={(v) => setForm({ ...form, leetcodeUrl: v })}
              placeholder="https://leetcode.com/…"
            />
            <LinkRow
              icon={Trophy}
              label="CodeChef"
              value={form.codechefUrl}
              onChange={(v) => setForm({ ...form, codechefUrl: v })}
              placeholder="https://codechef.com/users/…"
            />
            <LinkRow
              icon={Globe}
              label="Portfolio"
              value={form.portfolioUrl}
              onChange={(v) => setForm({ ...form, portfolioUrl: v })}
              placeholder="https://yoursite.com"
            />
          </CardContent>
        </Card>

        {storageEnabled && (
          <Card>
            <CardHeader>
              <CardTitle>Avatar</CardTitle>
            </CardHeader>
            <CardContent className="flex items-center gap-4">
              {profile.avatarUrl ? (
                <img
                  src={profile.avatarUrl}
                  className="h-16 w-16 rounded-full object-cover"
                  alt=""
                />
              ) : (
                <div className="h-16 w-16 rounded-full bg-secondary" />
              )}
              <Input
                type="file"
                accept="image/*"
                onChange={(e) => e.target.files?.[0] && onAvatar(e.target.files[0])}
              />
            </CardContent>
          </Card>
        )}

        <div className="flex gap-2">
          <Button onClick={() => update.mutate(form)} disabled={update.isPending}>
            {update.isPending ? 'Saving…' : 'Save changes'}
          </Button>
          <Button variant="outline" onClick={() => setEditing(false)}>
            Cancel
          </Button>
        </div>
      </div>
    );
  }

  // --- Review mode (resume uploaded — read-only summary) ---
  return (
    <div className="max-w-3xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Your profile</h2>
          <p className="text-sm text-muted-foreground">
            Filled in from your resume. Review and tweak when you have a minute.
          </p>
        </div>
        <div className="flex gap-2">
          {storageEnabled && (
            <Button variant="outline" size="sm" onClick={() => fileRef.current?.click()}>
              <Upload className="h-4 w-4" /> Re-upload resume
            </Button>
          )}
          <Button size="sm" onClick={() => setEditing(true)}>
            <Pencil className="h-4 w-4" /> Edit
          </Button>
        </div>
      </div>

      <input
        ref={fileRef}
        type="file"
        accept="application/pdf"
        hidden
        onChange={(e) => e.target.files?.[0] && onResume(e.target.files[0])}
      />

      {parsing && (
        <Card>
          <CardContent className="flex items-center gap-3 py-6">
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
            <span className="text-sm">Reading your resume with AI…</span>
          </CardContent>
        </Card>
      )}

      {justParsed && !parsing && <ParsedSummary fields={justParsed} />}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-primary" /> About
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <ReadField label="Name" value={profile.fullName} />
          <ReadField label="Headline" value={profile.headline} />
          <ReadField label="Bio" value={profile.bio} multiline />
          <div className="grid gap-3 md:grid-cols-2">
            <ReadField label="Phone" value={profile.phone} />
            <ReadField label="Location" value={profile.location} />
            <ReadField label="CGPA" value={profile.cgpa?.toFixed(2) ?? null} />
            <ReadField label="Graduation year" value={profile.graduationYear?.toString() ?? null} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Links</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-2 md:grid-cols-2 text-sm">
          <ReadLink icon={Linkedin} label="LinkedIn" url={profile.linkedinUrl} />
          <ReadLink icon={Github} label="GitHub" url={profile.githubUrl} />
          <ReadLink icon={Code2} label="LeetCode" url={profile.leetcodeUrl} />
          <ReadLink icon={Trophy} label="CodeChef" url={profile.codechefUrl} />
          <ReadLink icon={Globe} label="Portfolio" url={profile.portfolioUrl} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Resume on file</CardTitle>
        </CardHeader>
        <CardContent>
          <a
            href={profile.resumeUrl ?? '#'}
            target="_blank"
            rel="noreferrer"
            className="text-sm text-primary hover:underline"
          >
            View uploaded PDF →
          </a>
        </CardContent>
      </Card>
    </div>
  );
}

// ---------- subcomponents ----------

function UploadHero({
  parsing,
  storageEnabled,
  onFile,
  onText,
  onSkip,
}: {
  parsing: boolean;
  storageEnabled: boolean;
  onFile: (f: File) => void;
  onText: (t: string) => void;
  onSkip: () => void;
}) {
  const [mode, setMode] = useState<'upload' | 'paste'>(storageEnabled ? 'upload' : 'paste');
  const [text, setText] = useState('');

  return (
    <Card className="border-dashed">
      <CardContent className="py-10">
        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
          <Sparkles className="h-6 w-6 text-primary" />
        </div>
        <h2 className="text-2xl font-semibold text-center">Start with your resume</h2>
        <p className="mt-2 text-sm text-muted-foreground max-w-md mx-auto text-center">
          We&apos;ll read it with AI and fill your profile — bio, skills, projects, GitHub,
          LinkedIn, CGPA — in a few seconds. You can review and tweak after.
        </p>

        {/* Mode tabs: upload PDF vs paste text */}
        {storageEnabled && (
          <div className="mt-6 flex justify-center gap-1">
            <button
              onClick={() => setMode('upload')}
              className={`rounded-md border px-3 py-1 text-xs ${mode === 'upload' ? 'bg-primary text-primary-foreground' : ''}`}
            >
              Upload PDF
            </button>
            <button
              onClick={() => setMode('paste')}
              className={`rounded-md border px-3 py-1 text-xs ${mode === 'paste' ? 'bg-primary text-primary-foreground' : ''}`}
            >
              Paste text
            </button>
          </div>
        )}

        {mode === 'upload' && storageEnabled ? (
          <div className="mt-6 text-center">
            <label className="inline-flex">
              <input
                type="file"
                accept="application/pdf"
                disabled={parsing}
                className="hidden"
                onChange={(e) => e.target.files?.[0] && onFile(e.target.files[0])}
              />
              <span
                className={
                  parsing
                    ? 'inline-flex items-center gap-2 rounded-md bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground opacity-70'
                    : 'inline-flex cursor-pointer items-center gap-2 rounded-md bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90'
                }
              >
                {parsing ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" /> Reading your resume…
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4" /> Upload resume (PDF)
                  </>
                )}
              </span>
            </label>
          </div>
        ) : (
          <div className="mt-6 mx-auto max-w-xl space-y-3">
            <textarea
              className="flex min-h-[200px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm"
              placeholder="Paste your resume here — name, education, skills, projects, experience…"
              value={text}
              onChange={(e) => setText(e.target.value)}
              disabled={parsing}
            />
            <Button
              className="w-full"
              onClick={() => onText(text)}
              disabled={parsing || text.trim().length < 30}
            >
              {parsing ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Reading your resume…
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" /> Fill profile with AI
                </>
              )}
            </Button>
            {!storageEnabled && (
              <p className="text-center text-xs text-muted-foreground">
                File uploads are disabled on this deployment. Paste your resume text instead.
              </p>
            )}
          </div>
        )}

        <div className="mt-6 text-center">
          <button
            onClick={onSkip}
            className="text-xs text-muted-foreground underline-offset-4 hover:underline"
          >
            Or fill it out manually
          </button>
        </div>
      </CardContent>
    </Card>
  );
}

function ParsedSummary({ fields }: { fields: string[] }) {
  return (
    <Card className="border-emerald-300/40 bg-emerald-50/40 dark:bg-emerald-900/10">
      <CardContent className="py-4">
        <div className="flex items-start gap-3">
          <CheckCircle2 className="mt-0.5 h-5 w-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <div>
            <p className="text-sm font-medium">Filled in from your resume:</p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {fields.map((f) => (
                <Badge key={f} variant="success">
                  {f}
                </Badge>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function ReadField({
  label,
  value,
  multiline,
}: {
  label: string;
  value: string | null;
  multiline?: boolean;
}) {
  return (
    <div>
      <div className="text-xs uppercase tracking-wider text-muted-foreground">{label}</div>
      {value ? (
        <div
          className={
            multiline ? 'mt-1 whitespace-pre-wrap text-foreground' : 'mt-1 text-foreground'
          }
        >
          {value}
        </div>
      ) : (
        <div className="mt-1 text-muted-foreground italic">Not set</div>
      )}
    </div>
  );
}

function ReadLink({
  icon: Icon,
  label,
  url,
}: {
  icon: typeof Github;
  label: string;
  url: string | null;
}) {
  return (
    <div className="flex items-center justify-between rounded-md border px-3 py-2">
      <span className="flex items-center gap-2">
        <Icon className="h-4 w-4 text-muted-foreground" />
        <span className="font-medium">{label}</span>
      </span>
      {url ? (
        <a
          href={url}
          target="_blank"
          rel="noreferrer"
          className="text-primary hover:underline truncate max-w-[180px]"
        >
          {url.replace(/^https?:\/\//, '')}
        </a>
      ) : (
        <span className="text-xs text-muted-foreground">Not set</span>
      )}
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="mb-1 text-xs font-medium text-muted-foreground">{label}</div>
      {children}
    </div>
  );
}

function LinkRow({
  icon: Icon,
  label,
  value,
  onChange,
  placeholder,
}: {
  icon: typeof Github;
  label: string;
  value?: string | null;
  onChange: (v: string) => void;
  placeholder: string;
}) {
  return (
    <div>
      <div className="mb-1 flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
        <Icon className="h-3.5 w-3.5" /> {label}
      </div>
      <Input
        value={value ?? ''}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}

function ProfileSkeleton() {
  return (
    <div className="space-y-4 max-w-3xl animate-pulse">
      <div className="h-56 rounded-xl bg-secondary" />
      <div className="h-24 rounded-xl bg-secondary" />
    </div>
  );
}
