'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { useConfig } from '@/lib/use-config';
import { Calendar, Video, ExternalLink } from 'lucide-react';

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
type SlotOption = { id: string; startsAt: string; panelSize: number; remaining: number };

// Human-readable booking statuses. The panel scores into "pending review"; an
// admin then releases as pass/fail (the ~48h audit window).
const STATUS_LABEL: Record<string, string> = {
  scheduled: 'Scheduled',
  booked: 'Booked',
  completed_pending_review: 'Pending review',
  released_pass: 'Passed',
  released_fail: 'Not passed',
  passed: 'Passed',
  failed: 'Not passed',
  cancelled: 'Cancelled',
  no_show: 'No-show',
};

export default function InterviewsPage() {
  const { data: session } = useSession();
  const token = session?.accessToken as string | undefined;
  const qc = useQueryClient();
  const config = useConfig();

  const [showPicker, setShowPicker] = useState(false);
  const [selectedSkillId, setSelectedSkillId] = useState('');
  const [selectedSlotId, setSelectedSlotId] = useState('');
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

  // Real daily slots for the chosen skill's domain (capacity-limited, panel
  // auto-paired on booking).
  const { data: slots } = useQuery({
    enabled: !!token && showPicker && !!selectedSkillId,
    queryKey: ['interviews.slots', selectedSkillId],
    queryFn: () => api<SlotOption[]>(`/interviews/slots?skillId=${selectedSkillId}`, { token }),
  });

  function resetPicker() {
    setShowPicker(false);
    setSelectedSkillId('');
    setSelectedSlotId('');
    setNotes('');
    qc.invalidateQueries({ queryKey: ['interviews.me'] });
  }

  const book = useMutation({
    mutationFn: () =>
      api('/interviews/slots/book', {
        method: 'POST',
        token,
        body: JSON.stringify({
          skillId: selectedSkillId,
          slotId: selectedSlotId,
          notes: notes.trim() || undefined,
        }),
      }),
    onSuccess: () => {
      toast.success('Interview booked. Meeting link inside.');
      resetPicker();
    },
    onError: (e) => toast.error((e as Error).message),
  });

  const upcoming =
    bookings?.filter((b) => ['scheduled', 'booked', 'completed_pending_review'].includes(b.status))
      .length ?? 0;
  const passed =
    bookings?.filter((b) => ['passed', 'released_pass'].includes(b.status)).length ?? 0;
  const total = bookings?.length ?? 0;

  // Group open slots by their local day for display.
  const slotsByDay = new Map<string, SlotOption[]>();
  for (const s of slots ?? []) {
    const day = new Date(s.startsAt).toLocaleDateString('en-IN', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
    });
    if (!slotsByDay.has(day)) slotsByDay.set(day, []);
    slotsByDay.get(day)!.push(s);
  }
  const selectedSlot = (slots ?? []).find((s) => s.id === selectedSlotId);

  return (
    <div className="space-y-4">
      <div className="space-y-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="flex items-center gap-2 text-2xl font-semibold">
              Verification Interviews
              {!config.razorpay && (
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">
                  Free during beta
                </span>
              )}
            </h1>
            <p className="text-sm text-muted-foreground">
              Book your L4 Expert Verification. Get certified Market Ready.
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
              <CardTitle className="text-base">Book a slot</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-xs text-muted-foreground">
                45–60 min · Video call (Jitsi, link auto-generated) · 2-expert panel (randomly
                paired) · Pass = L4 Verified
              </p>

              {/* Skill to verify */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Skill to verify</label>
                {eligibleSkills && eligibleSkills.length === 0 ? (
                  <p className="rounded border border-dashed p-3 text-xs text-muted-foreground">
                    No eligible skills yet. An expert interview verifies a skill from L3 (Proven) to
                    L4 (Expert). Prove a skill to L3 first (projects + verified certs), then come
                    back to book.
                  </p>
                ) : (
                  <>
                    <select
                      value={selectedSkillId}
                      onChange={(e) => {
                        setSelectedSkillId(e.target.value);
                        setSelectedSlotId('');
                      }}
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

              {/* Available slots */}
              {selectedSkillId && (
                <div className="space-y-2">
                  <label className="text-sm font-medium">Available slots</label>
                  {!slots ? (
                    <p className="text-xs text-muted-foreground">Loading slots…</p>
                  ) : slots.length === 0 ? (
                    <p className="rounded border border-dashed p-3 text-xs text-muted-foreground">
                      No open slots for this skill&apos;s domain right now. Check back soon.
                    </p>
                  ) : (
                    <div className="max-h-72 space-y-3 overflow-y-auto overscroll-contain pr-1">
                      {[...slotsByDay.entries()].map(([day, daySlots]) => (
                        <div key={day}>
                          <div className="mb-1 text-xs font-medium text-muted-foreground">
                            {day}
                          </div>
                          <div className="flex flex-wrap gap-1.5">
                            {daySlots.map((s) => (
                              <button
                                key={s.id}
                                onClick={() => setSelectedSlotId(s.id)}
                                className={`rounded-md border px-2.5 py-1.5 text-xs transition ${
                                  selectedSlotId === s.id
                                    ? 'border-primary bg-primary text-primary-foreground'
                                    : 'hover:bg-secondary'
                                }`}
                              >
                                {new Date(s.startsAt).toLocaleTimeString('en-IN', {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                                <span className="ml-1 opacity-60">· {s.remaining} left</span>
                              </button>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Confirm */}
              {selectedSlot && (
                <div className="space-y-3 rounded border bg-secondary/30 p-3">
                  <div className="text-sm">
                    <span className="text-muted-foreground">Selected:</span>{' '}
                    <span className="font-medium">
                      {new Date(selectedSlot.startsAt).toLocaleString('en-IN', {
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
                    placeholder="Focus areas (e.g. system design + Python), optional"
                  />
                  <Button onClick={() => book.mutate()} disabled={book.isPending}>
                    {book.isPending ? 'Booking…' : 'Confirm booking'}
                  </Button>
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
              <p className="px-6 py-8 text-center text-sm text-muted-foreground">
                No interviews booked. Pick a slot above to schedule your first L4 verification.
              </p>
            ) : (
              <ul className="divide-y">
                {bookings?.map((b) => (
                  <li key={b.id} className="space-y-2 px-6 py-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Video className="h-4 w-4 text-primary" />
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-sm font-medium">
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
                          ['passed', 'released_pass'].includes(b.status)
                            ? 'success'
                            : ['failed', 'released_fail'].includes(b.status)
                              ? 'warning'
                              : b.status === 'completed_pending_review'
                                ? 'secondary'
                                : 'default'
                        }
                      >
                        {STATUS_LABEL[b.status] ?? b.status}
                      </Badge>
                    </div>
                    {['scheduled', 'booked'].includes(b.status) && b.meetingUrl && (
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
        <div className="mt-1 text-xs uppercase tracking-wider text-muted-foreground">{label}</div>
      </CardContent>
    </Card>
  );
}
