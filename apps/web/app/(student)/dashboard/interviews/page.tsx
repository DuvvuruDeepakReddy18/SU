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
import { Calendar, Video } from 'lucide-react';

type Booking = {
  id: string;
  scheduledAt: string;
  status: string;
  notes: string | null;
  result: string | null;
};

export default function InterviewsPage() {
  const { data: session } = useSession();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const token = (session as any)?.accessToken as string | undefined;
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [scheduledAt, setScheduledAt] = useState('');
  const [notes, setNotes] = useState('');

  const { data: bookings } = useQuery({
    enabled: !!token,
    queryKey: ['interviews.me'],
    queryFn: () => api<Booking[]>('/interviews', { token }),
  });

  const book = useMutation({
    mutationFn: () =>
      api('/interviews', { method: 'POST', token, body: JSON.stringify({ scheduledAt, notes }) }),
    onSuccess: () => {
      toast.success('L4 interview booked');
      setOpen(false);
      setScheduledAt('');
      setNotes('');
      qc.invalidateQueries({ queryKey: ['interviews.me'] });
    },
    onError: (e) => toast.error((e as Error).message),
  });

  const upcoming = bookings?.filter((b) => b.status === 'scheduled').length ?? 0;
  const passed = bookings?.filter((b) => b.status === 'passed').length ?? 0;
  const total = bookings?.length ?? 0;

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Verification Interviews</h1>
          <p className="text-sm text-muted-foreground">
            Book your L4 Expert Verification. Get certified Market Ready.
          </p>
        </div>
        <Button onClick={() => setOpen(!open)}>
          <Calendar className="h-4 w-4" /> Book Interview
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Stat label="Upcoming" value={upcoming} />
        <Stat label="Passed" value={passed} />
        <Stat label="Total" value={total} />
      </div>

      {open && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Schedule L4 Expert Verification</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-xs text-muted-foreground">
              Duration: 45-60 min · Format: Video Call · Panel: 2 Experts · Result: Pass = L4
              Verified
            </p>
            <div className="grid gap-3 md:grid-cols-2">
              <div>
                <div className="mb-1 text-xs font-medium text-muted-foreground">
                  Date &amp; time
                </div>
                <Input
                  type="datetime-local"
                  value={scheduledAt}
                  onChange={(e) => setScheduledAt(e.target.value)}
                />
              </div>
              <div>
                <div className="mb-1 text-xs font-medium text-muted-foreground">
                  Focus areas / notes
                </div>
                <Input
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. system design + Python"
                />
              </div>
            </div>
            <Button onClick={() => book.mutate()} disabled={book.isPending || !scheduledAt}>
              Confirm Booking
            </Button>
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
              No interviews found. Book your first L4 verification.
            </p>
          ) : (
            <ul className="divide-y">
              {bookings?.map((b) => (
                <li key={b.id} className="flex items-center justify-between px-6 py-3">
                  <div>
                    <div className="font-medium flex items-center gap-2">
                      <Video className="h-4 w-4 text-primary" />
                      {new Date(b.scheduledAt).toLocaleString()}
                    </div>
                    {b.notes && <div className="text-xs text-muted-foreground">{b.notes}</div>}
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
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
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
