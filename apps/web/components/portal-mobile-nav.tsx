'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut } from 'next-auth/react';
import { Menu, X, LogOut, type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

export type PortalNavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  exact?: boolean;
};

/**
 * Burger-triggered drawer for the recruiter / institution / interviewer portals.
 * Their desktop <aside> is `hidden md:flex`, so without this there's no
 * navigation at all on phones. Renders only at `< md` (md:hidden) and mirrors
 * the same nav array + active-matching the sidebar uses.
 */
export function PortalMobileNav({ nav, brand }: { nav: PortalNavItem[]; brand: string }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const home = nav[0]?.href ?? '/';

  // Close on navigation.
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  // Lock body scroll while the drawer is open.
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
              <Link href={home} className="font-semibold text-lg">
                <span className="text-primary">Skill</span>Verify
                <span className="ml-1 rounded bg-secondary px-1.5 py-0.5 text-[10px] align-middle text-muted-foreground">
                  {brand}
                </span>
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
            <nav className="flex-1 space-y-1 overflow-y-auto px-2">
              {nav.map((item) => {
                const active = item.exact
                  ? pathname === item.href
                  : pathname === item.href || pathname.startsWith(item.href + '/');
                const Icon = item.icon;
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
                    {item.label}
                  </Link>
                );
              })}
            </nav>
            <button
              type="button"
              onClick={() => signOut({ callbackUrl: '/' })}
              className="mx-2 mb-4 flex items-center gap-3 rounded-md px-3 py-3 text-sm text-muted-foreground hover:bg-secondary/60"
            >
              <LogOut className="h-4 w-4" /> Sign out
            </button>
          </aside>
        </div>
      )}
    </>
  );
}
