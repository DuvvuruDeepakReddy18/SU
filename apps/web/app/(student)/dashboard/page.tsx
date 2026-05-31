import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { serverApi } from '@/lib/server-api';
import { VerificationPill } from '@/components/verification-pill';
import { DashboardAvatarWrapper } from '@/components/dashboard-avatar-wrapper';
import { ExternalLink, Sparkles, Code2, Trophy, Briefcase, Building2, Video } from 'lucide-react';

type Profile = {
  fullName: string;
  sharableSlug: string;
  cgpa: number | null;
  cgpaVerifiedAt: string | null;
  user: { institution: { name: string } | null };
};

type Status = {
  overall: 'verified' | 'partial' | 'unverified';
  fields: {
    collegeId: 'verified' | 'pending' | 'rejected' | 'unverified';
    cgpa: 'verified' | 'unverified';
    academicRecords: { verified: number };
    skills: { verified: number; total: number };
  };
};

type Summary = {
  skills: { id: string; highestVerificationLayer: string; skill: { name: string } }[];
  certs: { id: string }[];
  academic: { id: string }[];
  projects: { id: string }[];
};

type Sub = { verdict: string; problem: { points?: number; difficulty?: string } };

function levelFromPoints(pts: number): string {
  if (pts >= 1000) return 'L4';
  if (pts >= 500) return 'L3';
  if (pts >= 200) return 'L2';
  if (pts >= 50) return 'L1';
  return 'L0';
}

export default async function DashboardPage() {
  let profile: Profile | null = null;
  let summary: Summary | null = null;
  let status: Status | null = null;
  let subs: Sub[] = [];
  try {
    profile = await serverApi<Profile>('/profile/me');
    summary = await serverApi<Summary>('/verifications/me/summary');
    status = await serverApi<Status>('/verifications/me/status');
    subs = await serverApi<Sub[]>('/practice/submissions');
  } catch {
    /* backend may be unreachable */
  }

  const acDistinct = new Set(
    subs.filter((s) => s.verdict === 'AC').map((s) => JSON.stringify(s.problem)),
  );
  const points = [...acDistinct].reduce((sum, key) => {
    const p = JSON.parse(key) as { points?: number };
    return sum + (p.points ?? 10);
  }, 0);
  const level = levelFromPoints(points);

  const layerCounts = {
    L1_ACADEMIC:
      summary?.skills.filter((s) => s.highestVerificationLayer === 'L1_ACADEMIC').length ?? 0,
    L2_CERTIFIED:
      summary?.skills.filter((s) => s.highestVerificationLayer === 'L2_CERTIFIED').length ?? 0,
    L3_PROVEN:
      summary?.skills.filter((s) => s.highestVerificationLayer === 'L3_PROVEN').length ?? 0,
    L4_EXPERT:
      summary?.skills.filter((s) => s.highestVerificationLayer === 'L4_EXPERT').length ?? 0,
  };
  const totalSkills = summary?.skills.length ?? 0;

  return (
    <div className="space-y-6">
      <header className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold flex items-center gap-3">
            Welcome back{profile ? `, ${profile.fullName.split(' ')[0]}` : ''}
            {status && (
              <VerificationPill
                state={status.overall}
                label={
                  status.overall === 'verified'
                    ? 'VERIFIED PROFILE'
                    : status.overall === 'partial'
                      ? 'PARTIALLY VERIFIED'
                      : 'UNVERIFIED PROFILE'
                }
              />
            )}
          </h1>
          <p className="text-sm text-muted-foreground">
            {profile?.user?.institution?.name ?? 'Build a verified profile recruiters trust.'}
          </p>
        </div>
        {status?.overall !== 'verified' && (
          <Link href="/dashboard/verifications">
            <Button size="sm">Complete verification</Button>
          </Link>
        )}
      </header>

      {/* 3D avatar w/ orbiting nav bubbles */}
      <DashboardAvatarWrapper studentName={profile?.fullName} />

      {/* Hero row: points + level + portfolio link */}
      <div className="grid gap-4 lg:grid-cols-[1fr_350px]">
        <Card>
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <div className="text-xs uppercase tracking-wider text-muted-foreground">
                Total points
              </div>
              <div className="mt-1 text-4xl font-semibold">{points}</div>
              <div className="mt-1 text-sm text-muted-foreground">
                Earned by solving practice problems
              </div>
            </div>
            <div className="text-right">
              <div className="text-xs uppercase tracking-wider text-muted-foreground">
                Your level
              </div>
              <div className="mt-1 text-4xl font-semibold text-primary">{level}</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Sparkles className="h-4 w-4 text-primary" /> Public portfolio
            </CardTitle>
          </CardHeader>
          <CardContent>
            {profile?.sharableSlug && (
              <Link href={`/u/${profile.sharableSlug}`} target="_blank">
                <Button size="sm" variant="outline" className="w-full">
                  /u/{profile.sharableSlug} <ExternalLink className="h-3.5 w-3.5" />
                </Button>
              </Link>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Verification Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Verification overview</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-4">
          <LayerStat
            label="L1 Academic"
            count={layerCounts.L1_ACADEMIC}
            total={totalSkills}
            color="bg-amber-500"
          />
          <LayerStat
            label="L2 Certified"
            count={layerCounts.L2_CERTIFIED}
            total={totalSkills}
            color="bg-primary"
          />
          <LayerStat
            label="L3 Proven"
            count={layerCounts.L3_PROVEN}
            total={totalSkills}
            color="bg-emerald-500"
          />
          <LayerStat
            label="L4 Expert"
            count={layerCounts.L4_EXPERT}
            total={totalSkills}
            color="bg-violet-500"
          />
        </CardContent>
      </Card>

      {/* Stat row */}
      <div className="grid gap-4 md:grid-cols-4">
        <StatCard
          label="CGPA"
          value={profile?.cgpa != null ? profile.cgpa.toFixed(2) : '—'}
          pill={
            profile?.cgpa != null ? (
              <VerificationPill
                state={profile.cgpaVerifiedAt ? 'verified' : 'unverified'}
                size="xs"
              />
            ) : undefined
          }
        />
        <StatCard
          label="Skills verified"
          value={`${layerCounts.L1_ACADEMIC + layerCounts.L2_CERTIFIED + layerCounts.L3_PROVEN + layerCounts.L4_EXPERT}/${totalSkills}`}
        />
        <StatCard label="Certifications" value={summary?.certs.length ?? 0} />
        <StatCard label="Academic records" value={summary?.academic.length ?? 0} />
      </div>

      {/* Quick access tiles */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Quick access</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-3 lg:grid-cols-6">
          <Tile href="/dashboard/profile" icon={Sparkles} label="Portfolio" />
          <Tile href="/dashboard/practice" icon={Code2} label="Practice" />
          <Tile href="/dashboard/interviews" icon={Video} label="Interviews" />
          <Tile href="/dashboard/freelance" icon={Briefcase} label="Freelance" />
          <Tile href="/dashboard/placements" icon={Building2} label="Placements" />
          <Tile href="/dashboard/compete" icon={Trophy} label="Compete" />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Next steps</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2">
          <Step
            href="/dashboard/profile"
            title="Upload your resume"
            body="We auto-fill your profile in seconds."
          />
          <Step
            href="/dashboard/verifications"
            title="Add academic record"
            body="Unlocks Layer 1 on every claimed skill."
          />
          <Step
            href="/dashboard/integrations"
            title="Connect GitHub"
            body="Imports your projects for L3 verification."
          />
          <Step
            href="/dashboard/practice"
            title="Solve a problem"
            body="Earn points + leaderboard rank + AI feedback."
          />
        </CardContent>
      </Card>
    </div>
  );
}

function StatCard({
  label,
  value,
  pill,
}: {
  label: string;
  value: number | string;
  pill?: React.ReactNode;
}) {
  return (
    <Card>
      <CardContent className="p-5">
        <div className="text-xs uppercase tracking-wider text-muted-foreground">{label}</div>
        <div className="mt-1 flex items-center gap-2">
          <div className="text-3xl font-semibold">{value}</div>
          {pill}
        </div>
      </CardContent>
    </Card>
  );
}

function LayerStat({
  label,
  count,
  total,
  color,
}: {
  label: string;
  count: number;
  total: number;
  color: string;
}) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  return (
    <div>
      <div className="flex items-center justify-between text-xs">
        <span className="font-medium">{label}</span>
        <span className="text-muted-foreground">
          {count}/{total}
        </span>
      </div>
      <div className="mt-1 h-1.5 rounded-full bg-secondary overflow-hidden">
        <div className={`h-full ${color} transition-all`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function Tile({ href, icon: Icon, label }: { href: string; icon: typeof Sparkles; label: string }) {
  return (
    <Link
      href={href}
      className="flex flex-col items-center gap-2 rounded-md border p-4 text-center hover:bg-secondary/50"
    >
      <Icon className="h-5 w-5 text-primary" />
      <span className="text-xs font-medium">{label}</span>
    </Link>
  );
}

function Step({ href, title, body }: { href: string; title: string; body: string }) {
  return (
    <Link href={href} className="block rounded-md border p-4 hover:bg-secondary/50">
      <div className="flex items-center justify-between">
        <div className="font-medium">{title}</div>
        <Badge variant="outline">Go</Badge>
      </div>
      <p className="mt-1 text-sm text-muted-foreground">{body}</p>
    </Link>
  );
}
