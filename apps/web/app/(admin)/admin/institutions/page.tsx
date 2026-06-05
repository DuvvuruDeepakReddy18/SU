'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { api } from '@/lib/api';
import { CheckCircle2, XCircle } from 'lucide-react';
import { RejectDialog } from '@/components/reject-dialog';
import type { RejectionReason } from '@skillverify/shared';

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

  const token = session?.accessToken as string | undefined;
  const qc = useQueryClient();
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const { data } = useQuery({
    enabled: !!token,
    queryKey: ['admin.institutions.pending'],
    queryFn: () => api<Inst[]>('/admin/institutions/pending', { token }),
  });

  async function approve(id: string) {
    await api(`/admin/institutions/${id}/approve`, { method: 'POST', token });
    qc.invalidateQueries({ queryKey: ['admin.institutions.pending'] });
  }

  async function submitReject(payload: { reasonCode: RejectionReason; reasonNote: string | null }) {
    if (!rejectingId) return;
    setBusy(true);
    try {
      await api(`/admin/institutions/${rejectingId}/reject`, {
        method: 'POST',
        token,
        body: JSON.stringify(payload),
      });
      setRejectingId(null);
      qc.invalidateQueries({ queryKey: ['admin.institutions.pending'] });
    } finally {
      setBusy(false);
    }
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
              <Button size="sm" variant="outline" onClick={() => setRejectingId(inst.id)}>
                <XCircle className="h-4 w-4 mr-1" /> Reject
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}

      <RejectDialog
        open={!!rejectingId}
        onClose={() => setRejectingId(null)}
        onSubmit={submitReject}
        busy={busy}
        title="Reject institution suggestion"
      />
    </div>
  );
}
