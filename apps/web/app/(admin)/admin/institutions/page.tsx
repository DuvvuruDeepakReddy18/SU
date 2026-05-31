'use client';

import { useSession } from 'next-auth/react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { api } from '@/lib/api';
import { CheckCircle2, XCircle } from 'lucide-react';

type Inst = {
  id: string;
  name: string;
  shortName: string | null;
  category: string | null;
  state: string | null;
  city: string | null;
  domain: string | null;
  addedByUserId: string | null;
  createdAt: string;
};

export default function PendingInstitutionsPage() {
  const { data: session } = useSession();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const token = (session as any)?.accessToken as string | undefined;
  const qc = useQueryClient();

  const { data } = useQuery({
    enabled: !!token,
    queryKey: ['admin.institutions.pending'],
    queryFn: () => api<Inst[]>('/admin/institutions/pending', { token }),
  });

  async function approve(id: string) {
    await api(`/admin/institutions/${id}/approve`, { method: 'POST', token });
    qc.invalidateQueries({ queryKey: ['admin.institutions.pending'] });
  }
  async function reject(id: string) {
    if (!confirm('Delete this institution suggestion?')) return;
    await api(`/admin/institutions/${id}/reject`, { method: 'POST', token });
    qc.invalidateQueries({ queryKey: ['admin.institutions.pending'] });
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">User-suggested institutions</h1>
      {(data?.length ?? 0) === 0 && (
        <Card>
          <CardContent className="p-6 text-center text-sm text-muted-foreground">
            No pending suggestions.
          </CardContent>
        </Card>
      )}
      {data?.map((inst) => (
        <Card key={inst.id}>
          <CardContent className="flex items-center justify-between p-4">
            <div>
              <div className="font-medium">
                {inst.name}{' '}
                {inst.shortName && (
                  <span className="text-xs text-muted-foreground">({inst.shortName})</span>
                )}
              </div>
              <div className="text-xs text-muted-foreground">
                {[inst.category, inst.city, inst.state, inst.domain].filter(Boolean).join(' · ')}
              </div>
            </div>
            <div className="flex gap-2">
              <Button size="sm" onClick={() => approve(inst.id)}>
                <CheckCircle2 className="h-4 w-4 mr-1" /> Approve
              </Button>
              <Button size="sm" variant="outline" onClick={() => reject(inst.id)}>
                <XCircle className="h-4 w-4 mr-1" /> Delete
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
