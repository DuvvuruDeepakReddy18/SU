'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Download } from 'lucide-react';
import { LAYER_META } from '@/components/company/candidate-card';
import { toast } from 'sonner';

type Analytics = {
  totalStudents: number;
  idVerified: number;
  cgpaVerified: number;
  placed: number;
  idVerifiedPct: number;
  cgpaVerifiedPct: number;
  skillLayerDistribution: Record<string, number>;
};

type RosterRow = {
  fullName: string;
  courseProgram: string | null;
  graduationYear: number | null;
  cgpa: number | null;
  cgpaVerified: boolean;
  collegeIdStatus: string | null;
  topLayer: string;
  skills: { name: string }[];
};

const LAYERS = ['L1_ACADEMIC', 'L2_CERTIFIED', 'L3_PROVEN', 'L4_EXPERT'];

export default function AnalyticsPage() {
  const { data: session } = useSession();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const token = (session as any)?.accessToken as string | undefined;
  const [exporting, setExporting] = useState(false);

  const { data: a } = useQuery({
    enabled: !!token,
    queryKey: ['institution-admin.analytics'],
    queryFn: () => api<Analytics>('/institution-admin/analytics', { token }),
  });

  async function exportCsv() {
    setExporting(true);
    try {
      // Page through the roster (endpoint caps pageSize at 50). Bounded at
      // 200 pages (10k students) as a safety stop.
      const rows: RosterRow[] = [];
      for (let page = 1; page <= 200; page++) {
        const res = await api<{ items: RosterRow[]; total: number }>(
          `/institution-admin/roster?page=${page}&pageSize=50`,
          { token },
        );
        rows.push(...res.items);
        if (rows.length >= res.total || res.items.length === 0) break;
      }
      const header = [
        'Name',
        'Course',
        'Grad year',
        'CGPA',
        'CGPA verified',
        'College ID',
        'Top layer',
        'Verified skills',
      ];
      const csv = [
        header.join(','),
        ...rows.map((r) =>
          [
            csvCell(r.fullName),
            csvCell(r.courseProgram ?? ''),
            r.graduationYear ?? '',
            r.cgpa ?? '',
            r.cgpaVerified ? 'yes' : 'no',
            r.collegeIdStatus ?? 'none',
            r.topLayer,
            csvCell(r.skills.map((s) => s.name).join('; ')),
          ].join(','),
        ),
      ].join('\n');
      downloadCsv(csv, 'skillverify-roster.csv');
      toast.success(`Exported ${rows.length} students`);
    } catch (e) {
      toast.error((e as Error).message.slice(0, 140));
    } finally {
      setExporting(false);
    }
  }

  const maxLayerCount = a ? Math.max(1, ...Object.values(a.skillLayerDistribution)) : 1;

  return (
    <div className="max-w-3xl space-y-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Analytics</h1>
          <p className="text-sm text-muted-foreground">
            Verified competency and placement metrics for your institution.
          </p>
        </div>
        <Button variant="outline" onClick={exportCsv} disabled={exporting} className="gap-1">
          <Download className="h-4 w-4" /> {exporting ? 'Exporting…' : 'Export CSV'}
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Students" value={a?.totalStudents ?? '—'} />
        <Stat label="ID verified" value={a ? `${a.idVerified} (${a.idVerifiedPct}%)` : '—'} />
        <Stat label="CGPA verified" value={a ? `${a.cgpaVerified} (${a.cgpaVerifiedPct}%)` : '—'} />
        <Stat label="Placed" value={a?.placed ?? '—'} />
      </div>

      <Card>
        <CardContent className="p-5">
          <div className="mb-3 text-sm font-medium">Verified skills by layer</div>
          <div className="space-y-2">
            {LAYERS.map((l) => {
              const meta = LAYER_META[l];
              const count = a?.skillLayerDistribution[l] ?? 0;
              const pct = Math.round((count / maxLayerCount) * 100);
              return (
                <div key={l} className="flex items-center gap-3">
                  <span className="w-8 text-xs font-bold" style={{ color: 'inherit' }}>
                    {meta.label}
                  </span>
                  <div className="h-3 flex-1 overflow-hidden rounded-full bg-secondary">
                    <div
                      className={meta.cls.split(' ')[0]}
                      style={{ width: `${pct}%`, height: '100%' }}
                    />
                  </div>
                  <span className="w-8 text-right text-xs text-muted-foreground">{count}</span>
                </div>
              );
            })}
          </div>
          <p className="mt-3 text-[11px] text-muted-foreground">
            Counts are verified skill claims across all students (a student can hold several).
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number | string }) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="text-xl font-semibold">{value}</div>
        <div className="text-xs text-muted-foreground">{label}</div>
      </CardContent>
    </Card>
  );
}

function csvCell(v: string): string {
  if (/[",\n]/.test(v)) return `"${v.replace(/"/g, '""')}"`;
  return v;
}

function downloadCsv(content: string, filename: string) {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}
