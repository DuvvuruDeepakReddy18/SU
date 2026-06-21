'use client';

import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { LayoutDashboard, Code2, Users, Video, Briefcase, Trophy, ArrowRight } from 'lucide-react';

// Role → portal home. Mirrors the post-login redirect in the login page.
function homeForRole(role?: string): string {
  switch (role) {
    case 'PLATFORM_ADMIN':
      return '/admin';
    case 'RECRUITER':
      return '/company';
    case 'INSTITUTION_ADMIN':
      return '/institution';
    case 'INTERVIEWER':
      return '/interviewer';
    default:
      return '/dashboard';
  }
}

/** Right-side landing nav actions — session-aware. */
export function LandingNavActions() {
  const { data: session, status } = useSession();
  const role = (session as { role?: string } | null)?.role;

  if (status === 'authenticated') {
    return (
      <Link href={homeForRole(role)}>
        <Button size="sm" className="gap-1.5">
          Open app <ArrowRight className="h-3.5 w-3.5" />
        </Button>
      </Link>
    );
  }
  return (
    <>
      <Link href="/login">
        <Button variant="ghost" size="sm">
          Sign in
        </Button>
      </Link>
      <Link href="/signup">
        <Button size="sm">Get started</Button>
      </Link>
    </>
  );
}

// Function-domains a logged-in student can jump straight into (shared session,
// routes under one app — the report's Phase-1 recommendation).
const STUDENT_DOMAINS = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/dashboard/practice', label: 'Practice', icon: Code2 },
  { href: '/dashboard/community', label: 'Community', icon: Users },
  { href: '/dashboard/interviews', label: 'Interviews', icon: Video },
  { href: '/dashboard/freelance', label: 'Freelance', icon: Briefcase },
  { href: '/dashboard/leaderboard', label: 'Leaderboard', icon: Trophy },
];

/**
 * "Jump back in" domain selector shown at the top of the landing page to a
 * logged-in user, so they can enter any domain directly instead of routing
 * through the dashboard. Renders nothing for signed-out visitors; non-student
 * roles get a single "Open portal" entry.
 */
export function LandingDomainSelector() {
  const { data: session, status } = useSession();
  if (status !== 'authenticated') return null;

  const role = (session as { role?: string } | null)?.role;
  const firstName = session?.user?.name?.split(' ')[0];

  const items =
    role && role !== 'STUDENT'
      ? [{ href: homeForRole(role), label: 'Open your portal', icon: LayoutDashboard }]
      : STUDENT_DOMAINS;

  return (
    <section className="border-b border-border/40 bg-white/45 backdrop-blur">
      <div className="container py-4">
        <div className="mb-2 text-xs uppercase tracking-wider text-stone-500">
          {firstName ? `Welcome back, ${firstName} · ` : ''}Jump back in
        </div>
        <div className="flex flex-wrap gap-2">
          {items.map((d) => {
            const Icon = d.icon;
            return (
              <Link
                key={d.href}
                href={d.href}
                className="inline-flex items-center gap-2 rounded-full border border-stone-300 bg-white/60 px-3.5 py-1.5 text-sm text-stone-700 shadow-sm transition hover:bg-white hover:shadow"
              >
                <Icon className="h-4 w-4 text-emerald-600" />
                {d.label}
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
