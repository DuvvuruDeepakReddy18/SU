'use client';

import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { signOut, useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { api } from '@/lib/api';
import { toast } from 'sonner';

export default function SettingsPage() {
  const { data } = useSession();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const token = (data as any)?.accessToken as string | undefined;
  const [confirm, setConfirm] = useState('');

  const deleteAccount = useMutation({
    mutationFn: () => api('/auth/me', { method: 'DELETE', token }),
    onSuccess: () => {
      toast.success('Account deleted. Signing you out…');
      signOut({ callbackUrl: '/' });
    },
    onError: (e) => toast.error((e as Error).message),
  });

  return (
    <div className="space-y-4 max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle>Account</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div>
            <span className="text-muted-foreground">Email:</span> {data?.user?.email}
          </div>
          <Button variant="destructive" onClick={() => signOut({ callbackUrl: '/' })}>
            Sign out
          </Button>
        </CardContent>
      </Card>

      <Card className="border-destructive/40">
        <CardHeader>
          <CardTitle className="text-destructive">Delete account</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <p className="text-muted-foreground">
            Your portfolio is removed and your name is scrubbed from public pages. Content you
            posted in community threads stays attributed to "Deleted account" so other students'
            replies don't break.
          </p>
          <p className="text-muted-foreground">
            Type <span className="font-mono font-semibold">DELETE</span> to confirm.
          </p>
          <Input
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            placeholder="DELETE"
            className="max-w-xs"
          />
          <Button
            variant="destructive"
            disabled={confirm !== 'DELETE' || deleteAccount.isPending}
            onClick={() => deleteAccount.mutate()}
          >
            {deleteAccount.isPending ? 'Deleting…' : 'Delete my account'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
