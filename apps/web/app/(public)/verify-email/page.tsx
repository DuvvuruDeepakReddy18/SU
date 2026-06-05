'use client';

import { Suspense, useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { CheckCircle2, Loader2, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { api } from '@/lib/api';

function VerifyEmailInner() {
  const params = useSearchParams();
  const token = params.get('token');
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return; // guard React strict-mode double-invoke (token is single-use)
    ran.current = true;
    if (!token) {
      setStatus('error');
      setMessage('This link is missing its verification token.');
      return;
    }
    api('/auth/verify-email', { method: 'POST', body: JSON.stringify({ token }) })
      .then(() => setStatus('success'))
      .catch((e) => {
        setStatus('error');
        setMessage((e as Error).message);
      });
  }, [token]);

  return (
    <div className="container flex min-h-screen items-center justify-center py-12">
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <CardTitle className="flex items-center justify-center gap-2">
            {status === 'loading' && <Loader2 className="h-5 w-5 animate-spin" />}
            {status === 'success' && <CheckCircle2 className="h-5 w-5 text-emerald-500" />}
            {status === 'error' && <XCircle className="h-5 w-5 text-destructive" />}
            {status === 'loading'
              ? 'Verifying your email…'
              : status === 'success'
                ? 'Email verified'
                : 'Verification failed'}
          </CardTitle>
          <CardDescription>
            {status === 'success'
              ? 'Your email address is confirmed. Your account is now secured.'
              : status === 'error'
                ? message
                : 'Hang tight while we confirm your link.'}
          </CardDescription>
        </CardHeader>
        {status !== 'loading' && (
          <CardContent>
            <Button asChild className="w-full">
              <Link href={status === 'success' ? '/dashboard' : '/login'}>
                {status === 'success' ? 'Go to dashboard' : 'Back to sign in'}
              </Link>
            </Button>
          </CardContent>
        )}
      </Card>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={null}>
      <VerifyEmailInner />
    </Suspense>
  );
}
