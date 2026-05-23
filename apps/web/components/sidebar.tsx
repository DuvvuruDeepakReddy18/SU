'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  User,
  ListChecks,
  ShieldCheck,
  Code2,
  Users,
  Trophy,
  Settings,
  Plug,
  Video,
  Briefcase,
  Building2,
  Award,
} from 'lucide-react';

const NAV = [
  { href: '/dashboard', label: 'Overview', icon: LayoutDashboard },
  { href: '/dashboard/profile', label: 'Profile', icon: User },
  { href: '/dashboard/skills', label: 'Skills', icon: ListChecks },
  { href: '/dashboard/verifications', label: 'Verifications', icon: ShieldCheck },
  { href: '/dashboard/integrations', label: 'Integrations', icon: Plug },
  { href: '/dashboard/practice', label: 'Practice', icon: Code2 },
  { href: '/dashboard/interviews', label: 'Interviews', icon: Video },
  { href: '/dashboard/freelance', label: 'Freelance', icon: Briefcase },
  { href: '/dashboard/placements', label: 'Placements', icon: Building2 },
  { href: '/dashboard/compete', label: 'Compete', icon: Award },
  { href: '/dashboard/community', label: 'Community', icon: Users },
  { href: '/dashboard/leaderboard', label: 'Leaderboard', icon: Trophy },
  { href: '/dashboard/settings', label: 'Settings', icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  return (
    <aside className="hidden w-60 shrink-0 border-r md:flex md:flex-col">
      <div className="px-5 py-4">
        <Link href="/dashboard" className="font-semibold text-lg">
          <span className="text-primary">Skill</span>Verify
        </Link>
      </div>
      <nav className="flex-1 space-y-1 px-2">
        {NAV.map((item) => {
          const active = pathname === item.href || pathname.startsWith(item.href + '/');
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
      <div className="px-5 pb-4 text-xs text-muted-foreground">Phase 1 · Student portal</div>
    </aside>
  );
}
