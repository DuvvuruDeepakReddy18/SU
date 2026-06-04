'use client';

import Link from 'next/link';
import { Bookmark, BookmarkCheck, GraduationCap, MapPin } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

export type CandidateCard = {
  userId: string;
  fullName: string;
  headline: string | null;
  bio: string | null;
  avatarUrl: string | null;
  sharableSlug: string;
  graduationYear: number | null;
  location: string | null;
  courseProgram: string | null;
  cgpa: number | null;
  cgpaVerified?: boolean;
  institution: string | null;
  topLayer: string;
  skills: { name: string; category: string; layer: string }[];
};

export const LAYER_META: Record<string, { label: string; cls: string }> = {
  L0_UNVERIFIED: { label: 'Unverified', cls: 'bg-secondary text-muted-foreground' },
  L1_ACADEMIC: { label: 'L1', cls: 'bg-cyan-500/15 text-cyan-700' },
  L2_CERTIFIED: { label: 'L2', cls: 'bg-emerald-500/15 text-emerald-700' },
  L3_PROVEN: { label: 'L3', cls: 'bg-violet-500/15 text-violet-700' },
  L4_EXPERT: { label: 'L4', cls: 'bg-amber-500/15 text-amber-700' },
};

export function initials(name: string): string {
  return name
    .split(' ')
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

export function CandidateCardView({
  c,
  saved,
  onToggleSave,
}: {
  c: CandidateCard;
  saved?: boolean;
  onToggleSave?: () => void;
}) {
  const layer = LAYER_META[c.topLayer] ?? LAYER_META.L0_UNVERIFIED;
  return (
    <Card className="transition hover:border-primary/40 hover:shadow-sm">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          {c.avatarUrl ? (
            <img src={c.avatarUrl} alt="" className="h-11 w-11 rounded-full object-cover" />
          ) : (
            <div className="grid h-11 w-11 place-items-center rounded-full bg-primary/15 text-sm font-semibold text-primary">
              {initials(c.fullName)}
            </div>
          )}
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <Link
                href={`/company/candidates/${c.userId}`}
                className="truncate font-semibold hover:underline"
              >
                {c.fullName}
              </Link>
              <span className={cn('rounded px-1.5 py-0.5 text-[10px] font-bold', layer.cls)}>
                {layer.label}
              </span>
            </div>
            {c.headline && (
              <div className="truncate text-xs text-muted-foreground">{c.headline}</div>
            )}
            <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[11px] text-muted-foreground">
              {c.institution && (
                <span className="inline-flex items-center gap-1">
                  <GraduationCap className="h-3 w-3" /> {c.institution}
                </span>
              )}
              {c.location && (
                <span className="inline-flex items-center gap-1">
                  <MapPin className="h-3 w-3" /> {c.location}
                </span>
              )}
              {c.graduationYear && <span>Class of {c.graduationYear}</span>}
            </div>
          </div>
          {onToggleSave && (
            <button
              onClick={onToggleSave}
              aria-label={saved ? 'Remove from shortlist' : 'Save to shortlist'}
              className={cn(
                'rounded-md p-1.5 transition',
                saved ? 'text-primary' : 'text-muted-foreground hover:bg-secondary',
              )}
            >
              {saved ? <BookmarkCheck className="h-4 w-4" /> : <Bookmark className="h-4 w-4" />}
            </button>
          )}
        </div>

        {c.skills.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {c.skills.slice(0, 6).map((s) => {
              const m = LAYER_META[s.layer] ?? LAYER_META.L0_UNVERIFIED;
              return (
                <span
                  key={s.name}
                  className="inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px]"
                >
                  {s.name}
                  <span className={cn('rounded px-1 text-[9px] font-bold', m.cls)}>{m.label}</span>
                </span>
              );
            })}
            {c.skills.length > 6 && (
              <span className="text-[11px] text-muted-foreground">+{c.skills.length - 6} more</span>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
