'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut, useSession } from 'next-auth/react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Award, Inbox, ClipboardList, LogOut, Loader2, XCircle } from 'lucide-react';

type Me = { fullName: string | null; active: boolean };

const NAV = [
  { href: '/interviewer', label: 'Open pool', icon: Inbox, exact: true },
  { href: '/interviewer/mine', label: 'My interviews', icon: ClipboardList },
];

export function InterviewerShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { data: session } = useSession();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const token = (session as any)?.accessToken as string | undefined;

  const { data: me, isLoading } = useQuery({
    enabled: !!token,
    queryKey: ['interviewer.me'],
    queryFn: () => api<Me>('/interviewer/me', { token }),
  });

  if (isLoading || !me) {
    return (
      <div className="grid min-h-screen place-items-center text-muted-foreground">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  if (!me.active) {
    return (
      <div className="grid min-h-screen place-items-center px-6">
        <div className="max-w-md text-center">
          <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-rose-500/15 text-rose-600">
            <XCircle className="h-7 w-7" />
          </div>
          <h1 className="mt-5 text-2xl font-semibold">Account inactive</h1>
          <p className="mt-3 text-sm text-muted-foreground">
            Your interviewer account has been deactivated. Contact the SkillVerify team if you think
            this is a mistake.
          </p>
          <div className="mt-6">
            <Button variant="ghost" onClick={() => signOut({ callbackUrl: '/' })}>
              Sign out
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen">
      <aside className="hidden w-60 shrink-0 border-r md:flex md:flex-col">
        <div className="px-5 py-4">
          <Link href="/interviewer" className="font-semibold text-lg">
            <span className="text-primary">Skill</span>Verify
            <span className="ml-1 rounded bg-secondary px-1.5 py-0.5 text-[10px] align-middle text-muted-foreground">
              interviewer
            </span>
          </Link>
          <div className="mt-1 flex items-center gap-1 text-xs text-amber-600">
            <Award className="h-3 w-3" /> L4 expert panel
          </div>
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
          <div className="text-sm text-muted-foreground">{me.fullName ?? 'Interviewer'}</div>
          <div className="rounded-full bg-amber-500/15 px-2.5 py-1 text-xs text-amber-700">
            Expert interviewer
          </div>
        </header>
        <main className="flex-1 px-4 py-6 md:px-6 md:py-8">{children}</main>
      </div>
    </div>
  );
}
