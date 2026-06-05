'use client';

import { useState } from 'react';
import Link from 'next/link';
import { MailCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { api } from '@/lib/api';
import { toast } from 'sonner';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await api('/auth/forgot-password', {
        method: 'POST',
        body: JSON.stringify({ email }),
      });
      setSent(true);
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="container flex min-h-screen items-center justify-center py-12">
      <Card className="w-full max-w-md">
        {sent ? (
          <>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MailCheck className="h-5 w-5 text-emerald-500" /> Check your inbox
              </CardTitle>
              <CardDescription>
                If an account exists for <span className="font-medium">{email}</span>, we've sent a
                password reset link. It expires in 1 hour.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild variant="outline" className="w-full">
                <Link href="/login">Back to sign in</Link>
              </Button>
            </CardContent>
          </>
        ) : (
          <>
            <CardHeader>
              <CardTitle>Forgot your password?</CardTitle>
              <CardDescription>
                Enter your email and we'll send you a link to reset it.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-3">
                <Input
                  type="email"
                  placeholder="you@institute.ac.in"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? 'Sending…' : 'Send reset link'}
                </Button>
              </form>
              <p className="mt-4 text-center text-xs text-muted-foreground">
                Remembered it?{' '}
                <Link className="text-primary hover:underline" href="/login">
                  Sign in
                </Link>
              </p>
            </CardContent>
          </>
        )}
      </Card>
    </div>
  );
}
