'use client';

import { Briefcase, Building2, Award, Backpack } from 'lucide-react';
import { SectionTabs } from '@/components/section-tabs';

/**
 * Sub-nav for the "Opportunities" section: every channel where a student
 * gets work / contests. Single sidebar entry; this bar gives one-click between
 * Freelance / Internships / Placements / Compete. (Interviews is its own
 * top-level section now, between Practice and Opportunities.)
 */
export function OpportunitiesTabs() {
  return (
    <SectionTabs
      tabs={[
        { href: '/dashboard/freelance', label: 'Freelance', icon: Briefcase },
        { href: '/dashboard/internships', label: 'Internships', icon: Backpack },
        { href: '/dashboard/placements', label: 'Placements', icon: Building2 },
        { href: '/dashboard/compete', label: 'Compete', icon: Award },
      ]}
    />
  );
}
