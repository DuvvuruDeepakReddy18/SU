'use client';

import { useSession } from 'next-auth/react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Bookmark } from 'lucide-react';
import { CandidateCardView, type CandidateCard } from '@/components/company/candidate-card';

type SavedRow = { note: string | null; savedAt: string; candidate: CandidateCard };

export default function SavedPage() {
  const { data: session } = useSession();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const token = (session as any)?.accessToken as string | undefined;
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    enabled: !!token,
    queryKey: ['recruiters.saved'],
    queryFn: () => api<SavedRow[]>('/recruiters/saved', { token }),
  });

  const unsave = useMutation({
    mutationFn: (id: string) => api(`/recruiters/saved/${id}`, { method: 'DELETE', token }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['recruiters.saved'] }),
  });

  return (
    <div className="space-y-5 max-w-5xl">
      <div>
        <h1 className="text-2xl font-semibold">Shortlist</h1>
        <p className="text-sm text-muted-foreground">Candidates you&apos;ve saved to revisit.</p>
      </div>

      {isLoading ? (
        <div className="text-sm text-muted-foreground">Loading…</div>
      ) : (data?.length ?? 0) === 0 ? (
        <div className="rounded-xl border border-dashed p-10 text-center text-sm text-muted-foreground">
          <Bookmark className="mx-auto mb-2 h-6 w-6" />
          No saved candidates yet. Save profiles from{' '}
          <a href="/company/candidates" className="text-primary hover:underline">
            Find candidates
          </a>
          .
        </div>
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {data?.map((row) => (
            <CandidateCardView
              key={row.candidate.userId}
              c={row.candidate}
              saved
              onToggleSave={() => unsave.mutate(row.candidate.userId)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
