'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { REJECTION_REASONS, REJECTION_REASON_LABELS } from '@skillverify/shared';
import type { RejectionReason } from '@skillverify/shared';
import { XCircle } from 'lucide-react';

/**
 * Modal dialog that collects a structured rejection reason (REQUIRED enum)
 * plus an optional free-text note. Used by every admin "reject" action so
 * the audit log carries consistent codes.
 */
export function RejectDialog({
  open,
  onClose,
  onSubmit,
  title = 'Reject submission',
  busy = false,
}: {
  open: boolean;
  onClose: () => void;
  onSubmit: (payload: {
    reasonCode: RejectionReason;
    reasonNote: string | null;
  }) => Promise<void> | void;
  title?: string;
  busy?: boolean;
}) {
  const [reasonCode, setReasonCode] = useState<RejectionReason>('BLURRY_IMAGE');
  const [reasonNote, setReasonNote] = useState('');

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-black/60 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-xl border bg-background p-5 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-2 mb-3">
          <XCircle className="h-5 w-5 text-destructive" />
          <h2 className="font-semibold">{title}</h2>
        </div>
        <p className="text-xs text-muted-foreground mb-4">
          Pick the closest reason — it becomes part of the audit trail and the email the student
          receives.
        </p>

        <div className="space-y-3">
          <div>
            <label className="text-xs font-medium text-muted-foreground">Reason</label>
            <select
              value={reasonCode}
              onChange={(e) => setReasonCode(e.target.value as RejectionReason)}
              className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              {REJECTION_REASONS.map((r) => (
                <option key={r} value={r}>
                  {REJECTION_REASON_LABELS[r]}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground">
              Note <span className="opacity-60">(optional, shown to student)</span>
            </label>
            <textarea
              value={reasonNote}
              onChange={(e) => setReasonNote(e.target.value)}
              maxLength={500}
              rows={3}
              placeholder="e.g. The institution name reads 'NIT Trichy' but your profile says 'IIT Tirupati'."
              className="mt-1 w-full resize-none rounded-md border border-input bg-background px-3 py-2 text-sm"
            />
          </div>
        </div>

        <div className="mt-5 flex items-center justify-end gap-2">
          <Button variant="outline" onClick={onClose} disabled={busy}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={async () => {
              await onSubmit({ reasonCode, reasonNote: reasonNote.trim() || null });
            }}
            disabled={busy}
          >
            {busy ? 'Rejecting…' : 'Reject'}
          </Button>
        </div>
      </div>
    </div>
  );
}
