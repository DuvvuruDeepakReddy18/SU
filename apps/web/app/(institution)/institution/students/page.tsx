'use client';

import { useMemo, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useQuery } from '@tanstack/react-query';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { api } from '@/lib/api';
import { Search, Inbox, ExternalLink, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { LAYER_META, initials } from '@/components/company/candidate-card';

type RosterRow = {
  userId: string;
  fullName: string;
  headline: string | null;
  avatarUrl: string | null;
  sharableSlug: string;
  graduationYear: number | null;
  courseProgram: string | null;
  cgpa: number | null;
  cgpaVerified: boolean;
  collegeIdStatus: string | null;
  topLayer: string;
  skills: { name: string; layer: string }[];
};
type RosterResult = { items: RosterRow[]; total: number };

const LAYER_FILTERS = [
  { value: '', label: 'Any' },
  { value: 'L1_ACADEMIC', label: 'L1+' },
  { value: 'L2_CERTIFIED', label: 'L2+' },
  { value: 'L3_PROVEN', label: 'L3+' },
  { value: 'L4_EXPERT', label: 'L4' },
];
const ID_FILTERS = [
  { value: '', label: 'All IDs' },
  { value: 'verified', label: 'Verified' },
  { value: 'pending', label: 'Pending' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'none', label: 'Not uploaded' },
];

const ID_BADGE: Record<string, { label: string; cls: string }> = {
  verified: { label: 'ID verified', cls: 'bg-emerald-500/15 text-emerald-700' },
  pending_review: { label: 'ID pending', cls: 'bg-amber-500/15 text-amber-700' },
  rejected: { label: 'ID rejected', cls: 'bg-rose-500/15 text-rose-600' },
};

export default function StudentsPage() {
  const { data: session } = useSession();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const token = (session as any)?.accessToken as string | undefined;

  const [q, setQ] = useState('');
  const [minLayer, setMinLayer] = useState('');
  const [idStatus, setIdStatus] = useState('');
  const [appliedQ, setAppliedQ] = useState('');

  const queryString = useMemo(() => {
    const p = new URLSearchParams();
    if (appliedQ) p.set('q', appliedQ);
    if (minLayer) p.set('minLayer', minLayer);
    if (idStatus) p.set('idStatus', idStatus);
    p.set('pageSize', '40');
    return p.toString();
  }, [appliedQ, minLayer, idStatus]);

  const { data, isLoading } = useQuery({
    enabled: !!token,
    queryKey: ['institution-admin.roster', queryString],
    queryFn: () => api<RosterResult>(`/institution-admin/roster?${queryString}`, { token }),
  });

  return (
    <div className="space-y-5 max-w-5xl">
      <div>
        <h1 className="text-2xl font-semibold">Students</h1>
        <p className="text-sm text-muted-foreground">
          Your institution&apos;s students and their verification status (read-only).
        </p>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          setAppliedQ(q);
        }}
        className="rounded-xl border bg-card p-3 space-y-3"
      >
        <div className="flex gap-2">
          <Input placeholder="Search by name" value={q} onChange={(e) => setQ(e.target.value)} />
          <Button type="submit" className="gap-1">
            <Search className="h-4 w-4" /> Search
          </Button>
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-xs text-muted-foreground mr-1">Layer:</span>
          {LAYER_FILTERS.map((f) => (
            <Chip key={f.value} active={minLayer === f.value} onClick={() => setMinLayer(f.value)}>
              {f.label}
            </Chip>
          ))}
          <span className="text-xs text-muted-foreground ml-3 mr-1">College ID:</span>
          {ID_FILTERS.map((f) => (
            <Chip key={f.value} active={idStatus === f.value} onClick={() => setIdStatus(f.value)}>
              {f.label}
            </Chip>
          ))}
        </div>
      </form>

      {isLoading ? (
        <div className="text-sm text-muted-foreground">Loading…</div>
      ) : (data?.items.length ?? 0) === 0 ? (
        <div className="rounded-xl border border-dashed p-10 text-center text-sm text-muted-foreground">
          <Inbox className="mx-auto mb-2 h-6 w-6" />
          No students match these filters.
        </div>
      ) : (
        <>
          <div className="text-xs text-muted-foreground">{data?.total} students</div>
          <div className="space-y-2">
            {data?.items.map((s) => {
              const layer = LAYER_META[s.topLayer] ?? LAYER_META.L0_UNVERIFIED;
              const idBadge = s.collegeIdStatus ? ID_BADGE[s.collegeIdStatus] : null;
              return (
                <Card key={s.userId}>
                  <CardContent className="flex items-center gap-3 p-3">
                    {s.avatarUrl ? (
                      <img
                        src={s.avatarUrl}
                        alt=""
                        className="h-10 w-10 rounded-full object-cover"
                      />
                    ) : (
                      <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-primary/15 text-xs font-semibold text-primary">
                        {initials(s.fullName)}
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="truncate font-medium">{s.fullName}</span>
                        <span
                          className={cn('rounded px-1.5 py-0.5 text-[10px] font-bold', layer.cls)}
                        >
                          {layer.label}
                        </span>
                        {idBadge && (
                          <span className={cn('rounded px-1.5 py-0.5 text-[10px]', idBadge.cls)}>
                            {idBadge.label}
                          </span>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-x-3 text-[11px] text-muted-foreground">
                        {s.courseProgram && <span>{s.courseProgram}</span>}
                        {s.graduationYear && <span>Class of {s.graduationYear}</span>}
                        {s.cgpa != null && (
                          <span className="inline-flex items-center gap-0.5">
                            CGPA {s.cgpa}
                            {s.cgpaVerified && (
                              <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                            )}
                          </span>
                        )}
                        {s.skills.length > 0 && <span>{s.skills.length} verified skills</span>}
                      </div>
                    </div>
                    <a
                      href={`/u/${s.sharableSlug}`}
                      target="_blank"
                      rel="noreferrer"
                      className="shrink-0 rounded-md p-1.5 text-muted-foreground hover:bg-secondary"
                      aria-label="Open public profile"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'rounded-full border px-2.5 py-1 text-xs transition',
        active
          ? 'border-primary bg-primary/10 text-foreground'
          : 'text-muted-foreground hover:bg-secondary',
      )}
    >
      {children}
    </button>
  );
}
