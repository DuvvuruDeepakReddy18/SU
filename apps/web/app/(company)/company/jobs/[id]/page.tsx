'use client';

import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { ArrowLeft, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { LAYER_META, initials, type CandidateCard } from '@/components/company/candidate-card';

type Application = {
  applicationId: string;
  stage: string;
  sourcedBy: string;
  createdAt: string;
  candidate: CandidateCard;
};

type Pipeline = {
  job: { id: string; role: string; company: string; location: string | null; minLevel: string };
  applications: Application[];
};

const STAGES: { key: string; label: string }[] = [
  { key: 'applied', label: 'Applied' },
  { key: 'shortlisted', label: 'Shortlisted' },
  { key: 'interviewing', label: 'Interviewing' },
  { key: 'offered', label: 'Offered' },
  { key: 'hired', label: 'Hired' },
  { key: 'rejected', label: 'Rejected' },
];

export default function JobPipelinePage() {
  const params = useParams<{ id: string }>();
  const jobId = params.id;
  const { data: session } = useSession();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const token = (session as any)?.accessToken as string | undefined;
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    enabled: !!token,
    queryKey: ['recruiters.pipeline', jobId],
    queryFn: () => api<Pipeline>(`/recruiters/jobs/${jobId}/pipeline`, { token }),
  });

  const move = useMutation({
    mutationFn: ({ applicationId, stage }: { applicationId: string; stage: string }) =>
      api(`/recruiters/jobs/${jobId}/applications/${applicationId}`, {
        method: 'PATCH',
        token,
        body: JSON.stringify({ stage }),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['recruiters.pipeline', jobId] }),
  });

  if (isLoading || !data) {
    return <div className="text-sm text-muted-foreground">Loading pipeline…</div>;
  }

  const byStage = (stage: string) => data.applications.filter((a) => a.stage === stage);

  return (
    <div className="space-y-5">
      <div>
        <Link
          href="/company/jobs"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" /> Back to jobs
        </Link>
        <h1 className="mt-2 text-2xl font-semibold">{data.job.role}</h1>
        <p className="text-sm text-muted-foreground">
          {data.applications.length} candidate{data.applications.length === 1 ? '' : 's'} in
          pipeline
        </p>
      </div>

      <div className="flex gap-3 overflow-x-auto pb-4">
        {STAGES.map((stage) => {
          const items = byStage(stage.key);
          return (
            <div key={stage.key} className="w-64 shrink-0">
              <div className="mb-2 flex items-center justify-between px-1">
                <span className="text-sm font-medium">{stage.label}</span>
                <span className="text-xs text-muted-foreground">{items.length}</span>
              </div>
              <div className="space-y-2 rounded-lg bg-secondary/40 p-2 min-h-[120px]">
                {items.map((a) => {
                  const layer = LAYER_META[a.candidate.topLayer] ?? LAYER_META.L0_UNVERIFIED;
                  return (
                    <div key={a.applicationId} className="rounded-md border bg-card p-2.5">
                      <div className="flex items-start gap-2">
                        <div className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-primary/15 text-[11px] font-semibold text-primary">
                          {initials(a.candidate.fullName)}
                        </div>
                        <div className="min-w-0 flex-1">
                          <Link
                            href={`/company/candidates/${a.candidate.userId}`}
                            className="block truncate text-sm font-medium hover:underline"
                          >
                            {a.candidate.fullName}
                          </Link>
                          <div className="flex items-center gap-1.5">
                            <span className={cn('rounded px-1 text-[9px] font-bold', layer.cls)}>
                              {layer.label}
                            </span>
                            {a.sourcedBy === 'sourced' && (
                              <span className="inline-flex items-center gap-0.5 text-[9px] text-muted-foreground">
                                <Sparkles className="h-2.5 w-2.5" /> sourced
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <select
                        value={a.stage}
                        onChange={(e) =>
                          move.mutate({ applicationId: a.applicationId, stage: e.target.value })
                        }
                        className="mt-2 w-full rounded border border-input bg-transparent px-1.5 py-1 text-[11px]"
                      >
                        {STAGES.map((s) => (
                          <option key={s.key} value={s.key}>
                            {s.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  );
                })}
                {items.length === 0 && (
                  <div className="py-6 text-center text-[11px] text-muted-foreground">—</div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
