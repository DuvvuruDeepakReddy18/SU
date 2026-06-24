'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useQuery } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import { api } from '@/lib/api';
import {
  LayoutDashboard,
  User,
  Code2,
  Users,
  Trophy,
  Settings,
  Briefcase,
  MessageCircle,
  Video,
  Bot,
} from 'lucide-react';

// Top-level sections only. Profile groups skills/verifications/integrations,
// Opportunities groups freelance/placements/compete/interviews — both via
// horizontal SectionTabs at the top of each page. Settings stays under the
// avatar menu, not the sidebar.
export type NavItem = {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  matchPrefixes?: string[];
  badgeKey?: 'messages';
};

export const NAV: NavItem[] = [
  { href: '/dashboard', label: 'Home', icon: LayoutDashboard },
  {
    href: '/dashboard/profile',
    label: 'Profile',
    icon: User,
    matchPrefixes: [
      '/dashboard/profile',
      '/dashboard/skills',
      '/dashboard/verifications',
      '/dashboard/integrations',
    ],
  },
  { href: '/dashboard/practice', label: 'Practice', icon: Code2 },
  { href: '/dashboard/interview-prep', label: 'Mock Interview', icon: Bot },
  { href: '/dashboard/interviews', label: 'Interviews', icon: Video },
  {
    href: '/dashboard/freelance',
    label: 'Opportunities',
    icon: Briefcase,
    matchPrefixes: [
      '/dashboard/freelance',
      '/dashboard/internships',
      '/dashboard/placements',
      '/dashboard/compete',
      '/dashboard/opportunities',
    ],
  },
  { href: '/dashboard/community', label: 'Community', icon: Users },
  {
    href: '/dashboard/messages',
    label: 'Messages',
    icon: MessageCircle,
    badgeKey: 'messages' as const,
  },
  { href: '/dashboard/leaderboard', label: 'Leaderboard', icon: Trophy },
];

export function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();

  const token = session?.accessToken as string | undefined;

  // Poll unread-DM count every 60s so the badge stays roughly fresh without
  // hammering the backend. Cheap query.
  const { data: unread } = useQuery({
    enabled: !!token,
    queryKey: ['messages.unread'],
    queryFn: () => api<{ count: number }>('/messages/unread-count', { token }),
    refetchInterval: 60_000,
  });

  return (
    <aside className="hidden w-60 shrink-0 border-r md:flex md:flex-col">
      <div className="px-5 py-4">
        <Link href="/dashboard" className="font-semibold text-lg">
          <span className="text-primary">Skill</span>Verify
        </Link>
      </div>
      <nav className="flex-1 space-y-1 px-2">
        {NAV.map((item) => {
          const prefixes = item.matchPrefixes ?? [item.href];
          const active = prefixes.some((p) => pathname === p || pathname.startsWith(p + '/'));
          const Icon = item.icon;
          const badge = item.badgeKey === 'messages' ? (unread?.count ?? 0) : 0;
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
              <span className="flex-1">{item.label}</span>
              {badge > 0 && (
                <span className="inline-flex min-w-[18px] h-[18px] items-center justify-center rounded-full bg-primary text-primary-foreground text-[10px] font-semibold px-1">
                  {badge > 99 ? '99+' : badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>
      <Link
        href="/dashboard/settings"
        className={cn(
          'mx-2 mb-2 flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors',
          pathname.startsWith('/dashboard/settings')
            ? 'bg-secondary text-foreground'
            : 'text-muted-foreground hover:bg-secondary/60',
        )}
      >
        <Settings className="h-4 w-4" />
        <span>Settings</span>
      </Link>
    </aside>
  );
}
