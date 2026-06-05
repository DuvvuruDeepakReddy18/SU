'use client';

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { api } from '@/lib/api';
import { toast } from 'sonner';

function ResetPasswordInner() {
  const router = useRouter();
  const params = useSearchParams();
  const token = params.get('token') ?? '';
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password.length < 8) {
      toast.error('Password must be at least 8 characters.');
      return;
    }
    if (password !== confirm) {
      toast.error('Passwords do not match.');
      return;
    }
    setLoading(true);
    try {
      await api('/auth/reset-password', {
        method: 'POST',
        body: JSON.stringify({ token, password }),
      });
      setDone(true);
      setTimeout(() => router.push('/login'), 1800);
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  if (!token) {
    return (
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <CardTitle>Invalid reset link</CardTitle>
          <CardDescription>This link is missing its reset token.</CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild className="w-full">
            <Link href="/forgot-password">Request a new link</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (done) {
    return (
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <CardTitle className="flex items-center justify-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-emerald-500" /> Password updated
          </CardTitle>
          <CardDescription>Redirecting you to sign in…</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Set a new password</CardTitle>
        <CardDescription>Choose a strong password you don't use elsewhere.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-3">
          <Input
            type="password"
            placeholder="New password (min 8 characters)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <Input
            type="password"
            placeholder="Confirm new password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            required
          />
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Updating…' : 'Update password'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="container flex min-h-screen items-center justify-center py-12">
      <Suspense fallback={null}>
        <ResetPasswordInner />
      </Suspense>
    </div>
  );
}
