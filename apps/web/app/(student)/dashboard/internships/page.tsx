'use client';

import { useSession } from 'next-auth/react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { Backpack, MapPin, ShieldCheck } from 'lucide-react';
import { OpportunitiesTabs } from '@/components/opportunities-tabs';

type Drive = {
  id: string;
  company: string;
  role: string;
  description: string | null;
  packageLpa: number | null;
  minLevel: string;
  jobType: string;
  skills: string[];
  location: string | null;
  scope: string;
  _count: { applications: number };
};

export default function InternshipsPage() {
  const { data: session } = useSession();

  const token = session?.accessToken as string | undefined;

  const { data: drives, isLoading } = useQuery({
    enabled: !!token,
    queryKey: ['internships'],
    queryFn: () => api<Drive[]>('/placements?jobType=internship', { token }),
  });

  const apply = useMutation({
    mutationFn: (id: string) =>
      api(`/placements/${id}/apply`, { method: 'POST', token, idempotent: true }),
    onSuccess: () => toast.success('Application sent'),
    onError: (e) => toast.error((e as Error).message.slice(0, 160)),
  });

  return (
    <div className="space-y-4">
      <OpportunitiesTabs />
      <div className="space-y-5">
        <div>
          <h1 className="text-2xl font-semibold">Internships</h1>
          <p className="text-sm text-muted-foreground">
            Internships from verified companies and your campus. Stipend, duration, and skill
            requirements up front.
          </p>
        </div>

        <div className="flex items-start gap-2 rounded-lg border bg-secondary/30 px-3 py-2 text-xs text-muted-foreground">
          <ShieldCheck className="h-4 w-4 shrink-0 text-emerald-600" />
          Applying requires at least L3 (Proven). Earn it by shipping projects or solving practice
          problems, your verified layer is what makes recruiters take the application seriously.
        </div>

        {isLoading ? (
          <div className="text-sm text-muted-foreground">Loading…</div>
        ) : drives?.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center text-sm text-muted-foreground">
              <Backpack className="mx-auto mb-2 h-8 w-8 opacity-50" />
              No internships open right now. Check back soon.
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {drives?.map((d) => (
              <Card key={d.id}>
                <CardContent className="p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="text-lg font-semibold">
                        {d.role} <span className="text-muted-foreground">· {d.company}</span>
                      </div>
                      <div className="mt-0.5 flex flex-wrap items-center gap-x-3 text-xs text-muted-foreground">
                        <span className="inline-flex items-center gap-1">
                          <MapPin className="h-3 w-3" /> {d.location ?? 'Remote'}
                        </span>
                        {d.packageLpa != null && <span>{d.packageLpa} LPA equiv.</span>}
                        {d.scope === 'institute_only' && (
                          <Badge variant="secondary" className="text-[10px]">
                            Campus only
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2 shrink-0">
                      <Badge variant={d.minLevel === 'L0_UNVERIFIED' ? 'secondary' : 'default'}>
                        Min: {d.minLevel.replace('_', ' ')}
                      </Badge>
                      <Button
                        size="sm"
                        disabled={apply.isPending}
                        onClick={() => apply.mutate(d.id)}
                      >
                        Apply
                      </Button>
                    </div>
                  </div>
                  {d.description && (
                    <p className="mt-3 text-sm text-muted-foreground">{d.description}</p>
                  )}
                  {d.skills.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-1">
                      {d.skills.map((s) => (
                        <Badge key={s} variant="outline">
                          {s}
                        </Badge>
                      ))}
                    </div>
                  )}
                  <div className="mt-3 text-xs text-muted-foreground">
                    {d._count.applications} applicant{d._count.applications === 1 ? '' : 's'}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
