'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { api } from '@/lib/api';
import { CheckCircle2, XCircle, FileImage, ExternalLink } from 'lucide-react';

type Pending = {
  userId: string;
  fullName: string;
  governmentName: string | null;
  collegeIdUrl: string | null;
  collegeIdUploadedAt: string | null;
  collegeIdOcrExtracted: Record<string, unknown> | null;
  instituteEmail: string | null;
  user: { email: string; institution: { name: string } | null };
};

export default function VerificationsQueuePage() {
  const { data: session } = useSession();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const token = (session as any)?.accessToken as string | undefined;
  const queryClient = useQueryClient();

  const { data: items, isLoading } = useQuery({
    enabled: !!token,
    queryKey: ['admin.verifications.collegeIds'],
    queryFn: () => api<Pending[]>('/admin/verifications/college-ids', { token }),
  });

  async function approve(userId: string) {
    await api(`/admin/verifications/college-ids/${userId}/approve`, {
      method: 'POST',
      token,
    });
    queryClient.invalidateQueries({ queryKey: ['admin.verifications.collegeIds'] });
  }

  async function reject(userId: string) {
    const reason = window.prompt('Reason for rejection (visible to student):');
    if (!reason) return;
    await api(`/admin/verifications/college-ids/${userId}/reject`, {
      method: 'POST',
      token,
      body: JSON.stringify({ reason }),
    });
    queryClient.invalidateQueries({ queryKey: ['admin.verifications.collegeIds'] });
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold">College-ID verification queue</h1>
        <p className="text-sm text-muted-foreground">
          {items?.length ?? 0} uploads awaiting review.
        </p>
      </div>

      {isLoading && <div className="text-sm text-muted-foreground">Loading…</div>}
      {!isLoading && (items?.length ?? 0) === 0 && (
        <Card>
          <CardContent className="p-6 text-center text-sm text-muted-foreground">
            Nothing in the queue. Nice work.
          </CardContent>
        </Card>
      )}

      {items?.map((p) => (
        <QueueRow key={p.userId} item={p} onApprove={approve} onReject={reject} />
      ))}
    </div>
  );
}

function QueueRow({
  item,
  onApprove,
  onReject,
}: {
  item: Pending;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
}) {
  const [busy, setBusy] = useState(false);
  const extracted = item.collegeIdOcrExtracted ?? {};
  const isPdf = item.collegeIdUrl?.toLowerCase().endsWith('.pdf');

  return (
    <Card>
      <CardContent className="grid gap-4 p-4 md:grid-cols-[280px_1fr_auto]">
        <div>
          {item.collegeIdUrl ? (
            isPdf ? (
              <a
                href={item.collegeIdUrl}
                target="_blank"
                rel="noreferrer"
                className="flex flex-col items-center justify-center gap-2 h-48 rounded-md border bg-secondary/30 hover:bg-secondary/50"
              >
                <FileImage className="h-8 w-8 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">Open PDF →</span>
              </a>
            ) : (
              <img
                src={item.collegeIdUrl}
                alt="College ID"
                className="h-48 w-full rounded-md border object-cover"
              />
            )
          ) : (
            <div className="h-48 grid place-items-center rounded-md border text-xs text-muted-foreground">
              No image
            </div>
          )}
          {item.collegeIdUrl && (
            <a
              href={item.collegeIdUrl}
              target="_blank"
              rel="noreferrer"
              className="mt-1 inline-flex items-center gap-1 text-xs text-primary hover:underline"
            >
              <ExternalLink className="h-3 w-3" /> Full size
            </a>
          )}
        </div>

        <div className="space-y-2 text-sm">
          <div className="font-semibold">
            {item.governmentName ?? item.fullName}{' '}
            <span className="text-xs text-muted-foreground">({item.user.email})</span>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">Claimed institution</div>
            <div>{item.user.institution?.name ?? '—'}</div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">Institute email</div>
            <div>{item.instituteEmail ?? '—'}</div>
          </div>
          <div className="rounded-md border bg-secondary/30 p-2 text-xs">
            <div className="font-medium mb-1">AI extraction</div>
            <Row k="Extracted name" v={String(extracted.extractedName ?? '—')} />
            <Row k="Extracted institution" v={String(extracted.extractedInstitution ?? '—')} />
            <Row k="Confidence" v={`${Math.round((Number(extracted.confidence) || 0) * 100)}%`} />
            <Row k="Looks edited?" v={extracted.isLikelyEdited === true ? 'YES' : 'no'} />
            <Row k="Has stamp?" v={extracted.hasOfficialStamp === true ? 'yes' : 'no'} />
            <div className="mt-1 flex gap-2">
              {extracted.nameMatch === true ? (
                <Badge variant="success">name match</Badge>
              ) : (
                <Badge variant="warning">name mismatch</Badge>
              )}
              {extracted.instMatch === true ? (
                <Badge variant="success">inst match</Badge>
              ) : (
                <Badge variant="warning">inst mismatch</Badge>
              )}
            </div>
          </div>
        </div>

        <div className="flex md:flex-col gap-2">
          <Button
            size="sm"
            disabled={busy}
            onClick={async () => {
              setBusy(true);
              try {
                await onApprove(item.userId);
              } finally {
                setBusy(false);
              }
            }}
          >
            <CheckCircle2 className="h-4 w-4 mr-1" /> Approve
          </Button>
          <Button
            size="sm"
            variant="outline"
            disabled={busy}
            onClick={async () => {
              setBusy(true);
              try {
                await onReject(item.userId);
              } finally {
                setBusy(false);
              }
            }}
          >
            <XCircle className="h-4 w-4 mr-1" /> Reject
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex justify-between gap-2">
      <span className="text-muted-foreground">{k}</span>
      <span className="truncate">{v}</span>
    </div>
  );
}
