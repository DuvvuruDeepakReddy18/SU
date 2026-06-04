'use client';

import { User, ListChecks, ShieldCheck, Plug } from 'lucide-react';
import { SectionTabs } from '@/components/section-tabs';

/**
 * Sub-nav for the "Profile" section. Mounted at the top of every page in
 * that section so users move between Profile / Skills / Verifications /
 * Integrations in one click — even though they're sibling routes under
 * /dashboard, not nested.
 */
export function ProfileTabs() {
  return (
    <SectionTabs
      tabs={[
        { href: '/dashboard/profile', label: 'Profile', icon: User },
        { href: '/dashboard/skills', label: 'Skills', icon: ListChecks },
        { href: '/dashboard/verifications', label: 'Verifications', icon: ShieldCheck },
        { href: '/dashboard/integrations', label: 'Integrations', icon: Plug },
      ]}
    />
  );
}
