'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useQuery } from '@tanstack/react-query';
import { Menu, X, Settings } from 'lucide-react';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';
import { NAV } from '@/components/sidebar';

/**
 * Burger-triggered drawer that mirrors the desktop sidebar on small screens.
 * The desktop <aside> is `hidden md:flex`, so without this students on phones
 * have no navigation at all once they're past the dashboard home. Renders
 * only at `< md` (md:hidden).
 */
export function MobileNav() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const { data: session } = useSession();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const token = (session as any)?.accessToken as string | undefined;

  const { data: unread } = useQuery({
    enabled: !!token,
    queryKey: ['messages.unread'],
    queryFn: () => api<{ count: number }>('/messages/unread-count', { token }),
    refetchInterval: 60_000,
  });

  // Close on route change.
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  // Lock body scroll while drawer is open.
  useEffect(() => {
    if (!open) return;
    const original = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = original;
    };
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Open navigation"
        className="md:hidden -ml-2 rounded-md p-2 text-muted-foreground hover:bg-secondary"
      >
        <Menu className="h-5 w-5" />
      </button>

      {open && (
        <div className="fixed inset-0 z-50 md:hidden" role="dialog" aria-modal="true">
          <button
            type="button"
            aria-label="Close navigation"
            onClick={() => setOpen(false)}
            className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-in fade-in"
          />
          <aside className="absolute inset-y-0 left-0 flex w-[80%] max-w-[280px] flex-col border-r bg-background shadow-xl animate-in slide-in-from-left">
            <div className="flex items-center justify-between px-5 py-4">
              <Link href="/dashboard" className="font-semibold text-lg">
                <span className="text-primary">Skill</span>Verify
              </Link>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close navigation"
                className="rounded-md p-1.5 text-muted-foreground hover:bg-secondary"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <nav className="flex-1 space-y-1 px-2 overflow-y-auto">
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
                      'flex items-center gap-3 rounded-md px-3 py-3 text-sm transition-colors',
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
                'mx-2 mb-4 flex items-center gap-3 rounded-md px-3 py-3 text-sm transition-colors',
                pathname.startsWith('/dashboard/settings')
                  ? 'bg-secondary text-foreground'
                  : 'text-muted-foreground hover:bg-secondary/60',
              )}
            >
              <Settings className="h-4 w-4" />
              <span>Settings</span>
            </Link>
          </aside>
        </div>
      )}
    </>
  );
}
