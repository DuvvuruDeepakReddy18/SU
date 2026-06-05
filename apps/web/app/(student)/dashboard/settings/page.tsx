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

  const token = data?.accessToken as string | undefined;
  const [confirm, setConfirm] = useState('');

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const changePassword = useMutation({
    mutationFn: () =>
      api('/auth/change-password', {
        method: 'POST',
        token,
        body: JSON.stringify({ currentPassword, newPassword }),
      }),
    onSuccess: () => {
      toast.success('Password updated.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    },
    onError: (e) => toast.error((e as Error).message),
  });

  function submitPasswordChange() {
    if (newPassword.length < 8) {
      toast.error('New password must be at least 8 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('New passwords do not match.');
      return;
    }
    changePassword.mutate();
  }

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

      <Card>
        <CardHeader>
          <CardTitle>Change password</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <p className="text-muted-foreground">
            If you signed in with Google or GitHub and never set a password, use{' '}
            <a className="text-primary hover:underline" href="/forgot-password">
              Forgot password
            </a>{' '}
            instead.
          </p>
          <Input
            type="password"
            placeholder="Current password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            className="max-w-xs"
          />
          <Input
            type="password"
            placeholder="New password (min 8 characters)"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className="max-w-xs"
          />
          <Input
            type="password"
            placeholder="Confirm new password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="max-w-xs"
          />
          <Button
            disabled={!currentPassword || !newPassword || changePassword.isPending}
            onClick={submitPasswordChange}
          >
            {changePassword.isPending ? 'Updating…' : 'Update password'}
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
