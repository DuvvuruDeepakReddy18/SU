'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { api } from '@/lib/api';
import { CheckCircle2, XCircle, GraduationCap } from 'lucide-react';
import { toast } from 'sonner';

type PendingAdmin = {
  userId: string;
  fullName: string | null;
  title: string | null;
  createdAt: string;
  user: { email: string };
  institution: { name: string; domain: string | null; city: string | null; state: string | null };
};

export default function PendingInstitutionAdminsPage() {
  const { data: session } = useSession();

  const token = session?.accessToken as string | undefined;
  const qc = useQueryClient();
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);

  const { data } = useQuery({
    enabled: !!token,
    queryKey: ['admin.institution-admins.pending'],
    queryFn: () => api<PendingAdmin[]>('/admin/institution-admins', { token }),
  });

  async function approve(userId: string) {
    setBusy(true);
    try {
      await api(`/admin/institution-admins/${userId}/approve`, { method: 'POST', token });
      toast.success('Institution admin approved');
      qc.invalidateQueries({ queryKey: ['admin.institution-admins.pending'] });
    } catch (e) {
      toast.error((e as Error).message.slice(0, 140));
    } finally {
      setBusy(false);
    }
  }

  async function reject(userId: string) {
    setBusy(true);
    try {
      await api(`/admin/institution-admins/${userId}/reject`, {
        method: 'POST',
        token,
        body: JSON.stringify({ reason: reason.trim() || undefined }),
      });
      toast.success('Request rejected');
      setRejectingId(null);
      setReason('');
      qc.invalidateQueries({ queryKey: ['admin.institution-admins.pending'] });
    } catch (e) {
      toast.error((e as Error).message.slice(0, 140));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold">Institution admin approvals</h1>
        <p className="text-sm text-muted-foreground">
          Verify this is a genuine placement officer for the institution before granting roster
          access. An official college-domain email is a good signal.
        </p>
      </div>

      {(data?.length ?? 0) === 0 && (
        <Card>
          <CardContent className="p-6 text-center text-sm text-muted-foreground">
            No institution admins waiting for approval.
          </CardContent>
        </Card>
      )}

      {data?.map((r) => (
        <Card key={r.userId}>
          <CardContent className="p-4 space-y-3">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <div className="flex items-center gap-2 font-medium">
                  <GraduationCap className="h-4 w-4 text-muted-foreground shrink-0" />
                  {r.institution.name}
                  {r.institution.domain && (
                    <span className="text-xs rounded bg-emerald-500/15 text-emerald-700 px-1.5 py-0.5">
                      @{r.institution.domain}
                    </span>
                  )}
                </div>
                <div className="mt-1 text-xs text-muted-foreground">
                  {[r.fullName, r.title, r.user.email].filter(Boolean).join(' · ')}
                </div>
                {(r.institution.city || r.institution.state) && (
                  <div className="text-xs text-muted-foreground">
                    {[r.institution.city, r.institution.state].filter(Boolean).join(', ')}
                  </div>
                )}
              </div>
              <div className="flex gap-2 shrink-0">
                <Button size="sm" disabled={busy} onClick={() => approve(r.userId)}>
                  <CheckCircle2 className="h-4 w-4 mr-1" /> Approve
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={busy}
                  onClick={() => {
                    setRejectingId(rejectingId === r.userId ? null : r.userId);
                    setReason('');
                  }}
                >
                  <XCircle className="h-4 w-4 mr-1" /> Reject
                </Button>
              </div>
            </div>

            {rejectingId === r.userId && (
              <div className="flex items-center gap-2 border-t pt-3">
                <Input
                  placeholder="Reason (optional, emailed to the requester)"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="flex-1"
                />
                <Button
                  size="sm"
                  variant="destructive"
                  disabled={busy}
                  onClick={() => reject(r.userId)}
                >
                  Confirm reject
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
