'use client';

import { useMemo, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { useConfig } from '@/lib/use-config';
import {
  Calendar,
  Video,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  IndianRupee,
} from 'lucide-react';

type Booking = {
  id: string;
  scheduledAt: string;
  status: string;
  notes: string | null;
  result: string | null;
  meetingUrl: string | null;
  skillName: string | null;
};

type EligibleSkill = { skillId: string; name: string };

// Time slots offered each day (08:00–20:00 hourly).
const SLOTS = Array.from({ length: 13 }, (_, i) => i + 8); // 8..20

export default function InterviewsPage() {
  const { data: session } = useSession();

  const token = session?.accessToken as string | undefined;
  const qc = useQueryClient();
  const config = useConfig();
  const [showPicker, setShowPicker] = useState(false);
  const [weekStart, setWeekStart] = useState(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() - d.getDay() + 1); // Monday of this week
    return d;
  });
  const [selectedSlot, setSelectedSlot] = useState<Date | null>(null);
  const [selectedSkillId, setSelectedSkillId] = useState('');
  const [notes, setNotes] = useState('');

  const { data: bookings } = useQuery({
    enabled: !!token,
    queryKey: ['interviews.me'],
    queryFn: () => api<Booking[]>('/interviews', { token }),
  });

  const { data: eligibleSkills } = useQuery({
    enabled: !!token && showPicker,
    queryKey: ['interviews.eligible-skills'],
    queryFn: () => api<EligibleSkill[]>('/interviews/eligible-skills', { token }),
  });

  function resetPicker() {
    setShowPicker(false);
    setSelectedSlot(null);
    setSelectedSkillId('');
    setNotes('');
    qc.invalidateQueries({ queryKey: ['interviews.me'] });
  }

  const book = useMutation({
    mutationFn: () =>
      api<Booking>('/interviews', {
        method: 'POST',
        token,
        body: JSON.stringify({
          skillId: selectedSkillId,
          scheduledAt: selectedSlot!.toISOString(),
          notes,
        }),
      }),
    onSuccess: () => {
      toast.success('L4 interview booked — meeting link inside');
      resetPicker();
    },
    onError: (e) => toast.error((e as Error).message),
  });

  const upcoming = bookings?.filter((b) => b.status === 'scheduled').length ?? 0;
  const passed = bookings?.filter((b) => b.status === 'passed').length ?? 0;
  const total = bookings?.length ?? 0;

  // ---- Razorpay checkout flow ----
  // Loaded from the official CDN on first click. Avoids ballooning the
  // dashboard bundle when the user never opens this page.
  const [paying, setPaying] = useState(false);
  async function payAndBook() {
    if (!selectedSlot) return;
    setPaying(true);
    try {
      // Send slot info at order-creation so the webhook can finish booking
      // even if the browser crashes after Razorpay debits the card.
      const order = await api<{
        orderId: string;
        amount: number;
        currency: string;
        keyId: string;
      }>('/interviews/payments/order', {
        method: 'POST',
        token,
        body: JSON.stringify({
          scheduledAt: selectedSlot.toISOString(),
          notes,
          skillId: selectedSkillId,
        }),
      });

      await loadRazorpayScript();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const Razorpay = (window as any).Razorpay;
      if (!Razorpay) throw new Error('Razorpay SDK failed to load.');

      const rz = new Razorpay({
        key: order.keyId,
        amount: order.amount,
        currency: order.currency,
        name: 'SkillVerify',
        description: 'L4 Verification Interview',
        order_id: order.orderId,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        handler: async (response: any) => {
          try {
            await api('/interviews/payments/verify-and-book', {
              method: 'POST',
              token,
              body: JSON.stringify({
                orderId: response.razorpay_order_id,
                paymentId: response.razorpay_payment_id,
                signature: response.razorpay_signature,
                scheduledAt: selectedSlot.toISOString(),
                notes,
                skillId: selectedSkillId,
              }),
            });
            toast.success('Payment received — interview booked.');
            resetPicker();
          } catch (e) {
            toast.error(`Booking failed after payment: ${(e as Error).message}`);
          }
        },
        modal: {
          ondismiss: () => setPaying(false),
        },
        theme: { color: '#10b981' },
      });
      rz.open();
    } catch (e) {
      toast.error((e as Error).message);
      setPaying(false);
    }
  }

  const weekDays = useMemo(() => {
    const days: Date[] = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(weekStart);
      d.setDate(d.getDate() + i);
      days.push(d);
    }
    return days;
  }, [weekStart]);

  const bookedSet = useMemo(
    () => new Set(bookings?.map((b) => new Date(b.scheduledAt).toISOString()) ?? []),
    [bookings],
  );

  return (
    <div className="space-y-4">
      <div className="space-y-6">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div>
            <h1 className="text-2xl font-semibold flex items-center gap-2">
              Verification Interviews
              {!config.razorpay && (
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">
                  Free during beta
                </span>
              )}
            </h1>
            <p className="text-sm text-muted-foreground">
              Book your L4 Expert Verification. Get certified Market Ready.
              {config.razorpay && (
                <span className="ml-1 inline-flex items-center gap-0.5 text-foreground font-medium">
                  <IndianRupee className="h-3 w-3" />
                  499 per interview
                </span>
              )}
            </p>
          </div>
          <Button onClick={() => setShowPicker(!showPicker)}>
            <Calendar className="h-4 w-4" /> {showPicker ? 'Close' : 'Book Interview'}
          </Button>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <Stat label="Upcoming" value={upcoming} />
          <Stat label="Passed" value={passed} />
          <Stat label="Total" value={total} />
        </div>

        {showPicker && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Pick a time slot</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-xs text-muted-foreground">
                Duration: 45-60 min · Format: Video Call (Jitsi, link auto-generated) · Panel: 2
                Experts · Result: Pass = L4 Verified
              </p>

              {/* Skill to verify */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Skill to verify</label>
                {eligibleSkills && eligibleSkills.length === 0 ? (
                  <p className="rounded border border-dashed p-3 text-xs text-muted-foreground">
                    No eligible skills yet. An expert interview verifies a skill from L3 (Proven) to
                    L4 (Expert) — prove a skill to L3 first (projects + verified certs), then come
                    back to book.
                  </p>
                ) : (
                  <>
                    <select
                      value={selectedSkillId}
                      onChange={(e) => setSelectedSkillId(e.target.value)}
                      className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      <option value="">Select a skill…</option>
                      {eligibleSkills?.map((s) => (
                        <option key={s.skillId} value={s.skillId}>
                          {s.name}
                        </option>
                      ))}
                    </select>
                    <p className="text-[11px] text-muted-foreground">
                      Only your L3-proven skills can be taken to L4.
                    </p>
                  </>
                )}
              </div>

              {/* Week navigation */}
              <div className="flex items-center justify-between">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    const d = new Date(weekStart);
                    d.setDate(d.getDate() - 7);
                    setWeekStart(d);
                  }}
                >
                  <ChevronLeft className="h-3.5 w-3.5" /> Prev
                </Button>
                <div className="text-sm font-medium">
                  {weekStart.toLocaleDateString('en-IN', { month: 'long', day: 'numeric' })} –{' '}
                  {weekDays[6].toLocaleDateString('en-IN', {
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    const d = new Date(weekStart);
                    d.setDate(d.getDate() + 7);
                    setWeekStart(d);
                  }}
                >
                  Next <ChevronRight className="h-3.5 w-3.5" />
                </Button>
              </div>

              {/* Slot grid */}
              <div className="overflow-x-auto">
                <table className="min-w-full text-xs">
                  <thead>
                    <tr>
                      <th className="p-1 text-left text-muted-foreground font-normal">Time</th>
                      {weekDays.map((d) => (
                        <th key={d.toISOString()} className="p-1 text-center font-normal">
                          <div className="text-muted-foreground">
                            {d.toLocaleDateString('en-IN', { weekday: 'short' })}
                          </div>
                          <div className="text-foreground text-sm">{d.getDate()}</div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {SLOTS.map((h) => (
                      <tr key={h}>
                        <td className="py-1 pr-2 text-muted-foreground tabular-nums">
                          {h.toString().padStart(2, '0')}:00
                        </td>
                        {weekDays.map((d) => {
                          const slot = new Date(d);
                          slot.setHours(h, 0, 0, 0);
                          const isPast = slot.getTime() < Date.now();
                          const isBooked = bookedSet.has(slot.toISOString());
                          const isSelected = selectedSlot?.getTime() === slot.getTime();
                          const disabled = isPast || isBooked;
                          return (
                            <td key={slot.toISOString()} className="p-0.5">
                              <button
                                disabled={disabled}
                                onClick={() => setSelectedSlot(slot)}
                                className={`w-full rounded px-1 py-1 text-[10px] transition ${
                                  isSelected
                                    ? 'bg-primary text-primary-foreground'
                                    : disabled
                                      ? 'bg-secondary/40 text-muted-foreground/50 cursor-not-allowed'
                                      : 'bg-secondary hover:bg-primary/20'
                                }`}
                              >
                                {isBooked ? 'booked' : isPast ? '—' : 'free'}
                              </button>
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Selection summary + notes */}
              {selectedSlot && (
                <div className="rounded border p-3 space-y-3 bg-secondary/30">
                  <div className="text-sm">
                    <span className="text-muted-foreground">Selected:</span>{' '}
                    <span className="font-medium">
                      {selectedSlot.toLocaleString('en-IN', {
                        weekday: 'long',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                  <Input
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Focus areas (e.g. system design + Python) — optional"
                  />
                  {!selectedSkillId && (
                    <p className="text-[11px] text-amber-600">Pick a skill to verify above.</p>
                  )}
                  {config.razorpay ? (
                    <Button
                      onClick={() => payAndBook()}
                      disabled={paying || book.isPending || !selectedSkillId}
                    >
                      {paying ? 'Opening checkout…' : 'Pay & book'}
                    </Button>
                  ) : (
                    <Button
                      onClick={() => book.mutate()}
                      disabled={book.isPending || !selectedSkillId}
                    >
                      Confirm booking
                    </Button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Your bookings</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {bookings?.length === 0 ? (
              <p className="px-6 py-8 text-sm text-muted-foreground text-center">
                No interviews booked. Pick a time above to schedule your first L4 verification.
              </p>
            ) : (
              <ul className="divide-y">
                {bookings?.map((b) => (
                  <li key={b.id} className="px-6 py-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Video className="h-4 w-4 text-primary" />
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-medium text-sm">
                              {new Date(b.scheduledAt).toLocaleString('en-IN', {
                                weekday: 'short',
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                            {b.skillName && (
                              <Badge variant="secondary" className="text-[10px]">
                                {b.skillName}
                              </Badge>
                            )}
                          </div>
                          {b.notes && (
                            <div className="text-xs text-muted-foreground">{b.notes}</div>
                          )}
                        </div>
                      </div>
                      <Badge
                        variant={
                          b.status === 'passed'
                            ? 'success'
                            : b.status === 'scheduled'
                              ? 'default'
                              : 'secondary'
                        }
                      >
                        {b.status}
                      </Badge>
                    </div>
                    {b.status === 'scheduled' && b.meetingUrl && (
                      <Button asChild size="sm" variant="outline" className="h-8">
                        <a href={b.meetingUrl} target="_blank" rel="noreferrer">
                          <Video className="h-3.5 w-3.5" /> Join meeting{' '}
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      </Button>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <Card>
      <CardContent className="p-5 text-center">
        <div className="text-3xl font-semibold">{value}</div>
        <div className="mt-1 text-xs text-muted-foreground uppercase tracking-wider">{label}</div>
      </CardContent>
    </Card>
  );
}

// Idempotent loader for the Razorpay checkout script. Skips re-injection
// after the first call by checking window.Razorpay.
function loadRazorpayScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if ((window as any).Razorpay) return resolve();
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Failed to load Razorpay checkout script'));
    document.body.appendChild(script);
  });
}
