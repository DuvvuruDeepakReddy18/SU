'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut, useSession } from 'next-auth/react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  GraduationCap,
  Users,
  BarChart3,
  Briefcase,
  Trophy,
  LogOut,
  Loader2,
  Clock,
  XCircle,
} from 'lucide-react';

type Me = {
  status: 'pending' | 'approved' | 'rejected';
  fullName: string | null;
  rejectionReason: string | null;
  institution: { name: string };
};

const NAV = [
  { href: '/institution', label: 'Home', icon: GraduationCap, exact: true },
  { href: '/institution/students', label: 'Students', icon: Users },
  { href: '/institution/analytics', label: 'Analytics', icon: BarChart3 },
  { href: '/institution/drives', label: 'Campus drives', icon: Briefcase },
  { href: '/institution/competitions', label: 'Competitions', icon: Trophy },
];

export function InstitutionShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { data: session } = useSession();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const token = (session as any)?.accessToken as string | undefined;

  const { data: me, isLoading } = useQuery({
    enabled: !!token,
    queryKey: ['institution-admin.me'],
    queryFn: () => api<Me>('/institution-admin/me', { token }),
  });

  if (isLoading || !me) {
    return (
      <div className="grid min-h-screen place-items-center text-muted-foreground">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  if (me.status !== 'approved') {
    return <StatusGate me={me} />;
  }

  return (
    <div className="flex min-h-screen">
      <aside className="hidden w-60 shrink-0 border-r md:flex md:flex-col">
        <div className="px-5 py-4">
          <Link href="/institution" className="font-semibold text-lg">
            <span className="text-primary">Skill</span>Verify
            <span className="ml-1 rounded bg-secondary px-1.5 py-0.5 text-[10px] align-middle text-muted-foreground">
              for institutions
            </span>
          </Link>
          <div className="mt-1 truncate text-xs text-muted-foreground">{me.institution.name}</div>
        </div>
        <nav className="flex-1 space-y-1 px-2">
          {NAV.map((item) => {
            const active = item.exact
              ? pathname === item.href
              : pathname === item.href || pathname.startsWith(item.href + '/');
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors',
                  active
                    ? 'bg-secondary text-foreground'
                    : 'text-muted-foreground hover:bg-secondary/60',
                )}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <button
          onClick={() => signOut({ callbackUrl: '/' })}
          className="mx-2 mb-4 flex items-center gap-3 rounded-md px-3 py-2 text-sm text-muted-foreground hover:bg-secondary/60"
        >
          <LogOut className="h-4 w-4" /> Sign out
        </button>
      </aside>

      <div className="flex flex-1 flex-col">
        <header className="flex h-14 items-center justify-between border-b px-4 md:px-6">
          <div className="text-sm text-muted-foreground">{me.fullName ?? 'Placement cell'}</div>
          <div className="rounded-full bg-emerald-500/15 px-2.5 py-1 text-xs text-emerald-700">
            Verified institution
          </div>
        </header>
        <main className="flex-1 px-4 py-6 md:px-6 md:py-8">{children}</main>
      </div>
    </div>
  );
}

function StatusGate({ me }: { me: Me }) {
  const rejected = me.status === 'rejected';
  return (
    <div className="grid min-h-screen place-items-center px-6">
      <div className="max-w-md text-center">
        <div
          className={cn(
            'mx-auto grid h-14 w-14 place-items-center rounded-full',
            rejected ? 'bg-rose-500/15 text-rose-600' : 'bg-amber-500/15 text-amber-600',
          )}
        >
          {rejected ? <XCircle className="h-7 w-7" /> : <Clock className="h-7 w-7" />}
        </div>
        <h1 className="mt-5 text-2xl font-semibold">
          {rejected ? 'Request not approved' : 'Verification in progress'}
        </h1>
        <p className="mt-3 text-sm text-muted-foreground">
          {rejected ? (
            <>
              We weren&apos;t able to verify your account for <strong>{me.institution.name}</strong>
              .{me.rejectionReason ? ` ${me.rejectionReason}` : ''} Reply to our email from your
              official college address if you think this was a mistake.
            </>
          ) : (
            <>
              Thanks for requesting access for <strong>{me.institution.name}</strong>. We verify
              every institution account before unlocking student data — usually within a business
              day. We&apos;ll email you the moment you&apos;re approved.
            </>
          )}
        </p>
        <div className="mt-6 flex justify-center gap-3">
          <Link href="/">
            <Button variant="outline">Back to site</Button>
          </Link>
          <Button variant="ghost" onClick={() => signOut({ callbackUrl: '/' })}>
            Sign out
          </Button>
        </div>
      </div>
    </div>
  );
}
