'use client';

import { useSession } from 'next-auth/react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Inbox, Calendar, User } from 'lucide-react';
import { toast } from 'sonner';

type Booking = {
  id: string;
  scheduledAt: string;
  skillName: string | null;
  studentName: string;
};

export default function PoolPage() {
  const { data: session } = useSession();

  const token = session?.accessToken as string | undefined;
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    enabled: !!token,
    queryKey: ['interviewer.pool'],
    queryFn: () => api<Booking[]>('/interviewer/pool', { token }),
  });

  const claim = useMutation({
    mutationFn: (id: string) => api(`/interviewer/pool/${id}/claim`, { method: 'POST', token }),
    onSuccess: () => {
      toast.success('Claimed. Find it under My interviews.');
      qc.invalidateQueries({ queryKey: ['interviewer.pool'] });
      qc.invalidateQueries({ queryKey: ['interviewer.mine'] });
    },
    onError: (e) => toast.error((e as Error).message.slice(0, 160)),
  });

  return (
    <div className="max-w-3xl space-y-5">
      <div>
        <h1 className="text-2xl font-semibold">Open interview pool</h1>
        <p className="text-sm text-muted-foreground">
          Claim an L4 expert interview to conduct it. Passing promotes the student&apos;s skill to
          L4, the top verification layer.
        </p>
      </div>

      {isLoading ? (
        <div className="text-sm text-muted-foreground">Loading…</div>
      ) : data?.length === 0 ? (
        <div className="rounded-xl border border-dashed p-10 text-center text-sm text-muted-foreground">
          <Inbox className="mx-auto mb-2 h-6 w-6" />
          No interviews waiting in the pool right now.
        </div>
      ) : (
        <div className="space-y-2">
          {data?.map((b) => (
            <Card key={b.id}>
              <CardContent className="flex items-center justify-between gap-4 p-4">
                <div className="min-w-0">
                  <div className="font-medium">{b.skillName ?? 'Skill interview'}</div>
                  <div className="mt-0.5 flex flex-wrap gap-x-3 text-xs text-muted-foreground">
                    <span className="inline-flex items-center gap-1">
                      <User className="h-3 w-3" /> {b.studentName}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Calendar className="h-3 w-3" /> {new Date(b.scheduledAt).toLocaleString()}
                    </span>
                  </div>
                </div>
                <Button size="sm" disabled={claim.isPending} onClick={() => claim.mutate(b.id)}>
                  Claim
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
