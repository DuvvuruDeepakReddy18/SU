'use client';

import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Card, CardContent } from '@/components/ui/card';
import { Users, BarChart3, Briefcase, ArrowRight, ShieldCheck } from 'lucide-react';

type Analytics = {
  totalStudents: number;
  idVerified: number;
  cgpaVerified: number;
  placed: number;
};

export default function InstitutionHomePage() {
  const { data: session } = useSession();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const token = (session as any)?.accessToken as string | undefined;

  const { data: a } = useQuery({
    enabled: !!token,
    queryKey: ['institution-admin.analytics'],
    queryFn: () => api<Analytics>('/institution-admin/analytics', { token }),
  });

  return (
    <div className="max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Welcome</h1>
        <p className="text-sm text-muted-foreground">
          Oversee your students&apos; verified profiles, post campus drives, and track placement
          analytics. Verification stays with SkillVerify — your stats stay credible.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Students" value={a?.totalStudents ?? '—'} />
        <Stat label="ID verified" value={a?.idVerified ?? '—'} />
        <Stat label="CGPA verified" value={a?.cgpaVerified ?? '—'} />
        <Stat label="Placed" value={a?.placed ?? '—'} />
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <QuickCard
          href="/institution/students"
          icon={Users}
          title="Student roster"
          body="See every student's verification layer and academic status."
        />
        <QuickCard
          href="/institution/analytics"
          icon={BarChart3}
          title="Analytics"
          body="Layer distribution, verified %, placements — export-ready."
        />
        <QuickCard
          href="/institution/drives"
          icon={Briefcase}
          title="Post a drive"
          body="Campus placement drives, visible only to your students."
        />
      </div>

      <Card>
        <CardContent className="flex items-start gap-3 p-5 text-sm text-muted-foreground">
          <ShieldCheck className="h-5 w-5 shrink-0 text-emerald-600" />
          <div>
            <span className="font-medium text-foreground">Read-only verification.</span> You can see
            each student&apos;s verification status, but only SkillVerify approves it — so the
            placement numbers you export carry weight with recruiters.
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number | string }) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="text-2xl font-semibold">{value}</div>
        <div className="text-xs text-muted-foreground">{label}</div>
      </CardContent>
    </Card>
  );
}

function QuickCard({
  href,
  icon: Icon,
  title,
  body,
}: {
  href: string;
  icon: typeof Users;
  title: string;
  body: string;
}) {
  return (
    <Link href={href}>
      <Card className="h-full transition hover:border-primary/40 hover:shadow-sm">
        <CardContent className="p-5">
          <div className="grid h-9 w-9 place-items-center rounded-lg bg-primary/10 text-primary">
            <Icon className="h-4 w-4" />
          </div>
          <div className="mt-3 flex items-center gap-1 font-medium">
            {title} <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
          </div>
          <p className="mt-1 text-xs text-muted-foreground">{body}</p>
        </CardContent>
      </Card>
    </Link>
  );
}
