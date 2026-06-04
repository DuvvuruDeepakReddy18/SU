'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { api } from '@/lib/api';
import { CheckCircle2, XCircle, Building2, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';

type PendingRecruiter = {
  userId: string;
  fullName: string | null;
  title: string | null;
  createdAt: string;
  user: { email: string };
  employer: {
    name: string;
    website: string | null;
    domain: string | null;
  };
};

export default function PendingRecruitersPage() {
  const { data: session } = useSession();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const token = (session as any)?.accessToken as string | undefined;
  const qc = useQueryClient();
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);

  const { data } = useQuery({
    enabled: !!token,
    queryKey: ['admin.recruiters.pending'],
    queryFn: () => api<PendingRecruiter[]>('/admin/recruiters', { token }),
  });

  async function approve(userId: string) {
    setBusy(true);
    try {
      await api(`/admin/recruiters/${userId}/approve`, { method: 'POST', token });
      toast.success('Recruiter approved');
      qc.invalidateQueries({ queryKey: ['admin.recruiters.pending'] });
    } catch (e) {
      toast.error((e as Error).message.slice(0, 140));
    } finally {
      setBusy(false);
    }
  }

  async function reject(userId: string) {
    setBusy(true);
    try {
      await api(`/admin/recruiters/${userId}/reject`, {
        method: 'POST',
        token,
        body: JSON.stringify({ reason: reason.trim() || undefined }),
      });
      toast.success('Recruiter rejected');
      setRejectingId(null);
      setReason('');
      qc.invalidateQueries({ queryKey: ['admin.recruiters.pending'] });
    } catch (e) {
      toast.error((e as Error).message.slice(0, 140));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold">Recruiter approvals</h1>
        <p className="text-sm text-muted-foreground">
          Verify the company is real before granting candidate-search access. A work-email domain
          (not Gmail/Outlook) is a good signal.
        </p>
      </div>

      {(data?.length ?? 0) === 0 && (
        <Card>
          <CardContent className="p-6 text-center text-sm text-muted-foreground">
            No recruiters waiting for approval.
          </CardContent>
        </Card>
      )}

      {data?.map((r) => (
        <Card key={r.userId}>
          <CardContent className="p-4 space-y-3">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <div className="flex items-center gap-2 font-medium">
                  <Building2 className="h-4 w-4 text-muted-foreground shrink-0" />
                  {r.employer.name}
                  {r.employer.domain && (
                    <span className="text-xs rounded bg-emerald-500/15 text-emerald-700 px-1.5 py-0.5">
                      @{r.employer.domain}
                    </span>
                  )}
                </div>
                <div className="mt-1 text-xs text-muted-foreground">
                  {[r.fullName, r.title, r.user.email].filter(Boolean).join(' · ')}
                </div>
                {r.employer.website && (
                  <a
                    href={r.employer.website}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-1 inline-flex items-center gap-1 text-xs text-primary hover:underline"
                  >
                    {r.employer.website} <ExternalLink className="h-3 w-3" />
                  </a>
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
                  placeholder="Reason (optional, emailed to the recruiter)"
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
