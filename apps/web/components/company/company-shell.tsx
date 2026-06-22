'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut, useSession } from 'next-auth/react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { NotificationBell } from '@/components/notification-bell';
import { PortalMobileNav } from '@/components/portal-mobile-nav';
import {
  Building2,
  Search,
  Bookmark,
  Briefcase,
  MessageCircle,
  LogOut,
  Loader2,
  Clock,
  XCircle,
} from 'lucide-react';

type RecruiterMe = {
  status: 'pending' | 'approved' | 'rejected';
  fullName: string | null;
  rejectionReason: string | null;
  employer: { name: string };
};

const NAV = [
  { href: '/company', label: 'Home', icon: Building2, exact: true },
  { href: '/company/candidates', label: 'Find candidates', icon: Search },
  { href: '/company/saved', label: 'Shortlist', icon: Bookmark },
  { href: '/company/jobs', label: 'Jobs', icon: Briefcase },
  { href: '/company/messages', label: 'Messages', icon: MessageCircle },
];

export function CompanyShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { data: session } = useSession();

  const token = session?.accessToken as string | undefined;

  const { data: me, isLoading } = useQuery({
    enabled: !!token,
    queryKey: ['recruiters.me'],
    queryFn: () => api<RecruiterMe>('/recruiters/me', { token }),
  });

  if (isLoading || !me) {
    return (
      <div className="grid min-h-screen place-items-center text-muted-foreground">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  // Not yet approved → gate screens, no nav.
  if (me.status !== 'approved') {
    return <StatusGate me={me} />;
  }

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside className="hidden w-60 shrink-0 border-r md:flex md:flex-col">
        <div className="px-5 py-4">
          <Link href="/company" className="font-semibold text-lg">
            <span className="text-primary">Skill</span>Verify
            <span className="ml-1 rounded bg-secondary px-1.5 py-0.5 text-[10px] align-middle text-muted-foreground">
              for companies
            </span>
          </Link>
          <div className="mt-1 truncate text-xs text-muted-foreground">{me.employer.name}</div>
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
          <div className="flex min-w-0 items-center gap-2">
            <PortalMobileNav nav={NAV} brand="for companies" />
            <div className="truncate text-sm text-muted-foreground">
              {me.fullName ?? 'Recruiter'}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="rounded-full bg-emerald-500/15 px-2.5 py-1 text-xs text-emerald-700">
              Verified company
            </div>
            <NotificationBell />
          </div>
        </header>
        <main className="flex-1 px-4 py-6 md:px-6 md:py-8">{children}</main>
      </div>
    </div>
  );
}

function StatusGate({ me }: { me: RecruiterMe }) {
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
          {rejected ? 'Account not approved' : 'Verification in progress'}
        </h1>
        <p className="mt-3 text-sm text-muted-foreground">
          {rejected ? (
            <>
              We weren&apos;t able to verify <strong>{me.employer.name}</strong>.
              {me.rejectionReason ? ` ${me.rejectionReason}` : ''} If you think this was a mistake,
              reply to our email with your company details.
            </>
          ) : (
            <>
              Thanks for signing up <strong>{me.employer.name}</strong>. We verify every company
              before granting access to verified students, usually within a business day. We&apos;ll
              email you the moment you&apos;re approved.
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
