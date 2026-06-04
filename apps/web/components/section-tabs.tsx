'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import type { ComponentType } from 'react';

type Tab = { href: string; label: string; icon: ComponentType<{ className?: string }> };

/**
 * Horizontal tab bar mounted at the top of each page in a "section". The
 * sidebar collapses to one entry per section; this bar gives one-click
 * navigation within. Active tab is whichever pathname is currently mounted
 * (exact match or prefix).
 */
export function SectionTabs({ tabs }: { tabs: Tab[] }) {
  const pathname = usePathname();
  return (
    <div className="flex gap-1 border-b -mt-2 -mx-2 px-2 overflow-x-auto">
      {tabs.map((t) => {
        const Icon = t.icon;
        const active = pathname === t.href || pathname.startsWith(t.href + '/');
        return (
          <Link
            key={t.href}
            href={t.href}
            className={cn(
              'inline-flex items-center gap-1.5 px-3 py-2 text-sm whitespace-nowrap -mb-px border-b-2 transition',
              active
                ? 'border-primary text-foreground font-medium'
                : 'border-transparent text-muted-foreground hover:text-foreground',
            )}
          >
            <Icon className="h-3.5 w-3.5" /> {t.label}
          </Link>
        );
      })}
    </div>
  );
}
