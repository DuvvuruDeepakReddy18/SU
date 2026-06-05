'use client';

import { useState } from 'react';
import { signIn, getSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Github, Mail } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const res = await signIn('credentials', { email, password, redirect: false });
    setLoading(false);
    if (res?.error) {
      toast.error('Invalid email or password');
      return;
    }
    // Route by role — recruiters → company portal, institution admins →
    // institution portal, everyone else → student dashboard.
    const session = await getSession();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const role = (session as any)?.role as string | undefined;
    router.push(
      role === 'RECRUITER'
        ? '/company'
        : role === 'INSTITUTION_ADMIN'
          ? '/institution'
          : role === 'INTERVIEWER'
            ? '/interviewer'
            : '/dashboard',
    );
  }

  return (
    <div className="container flex min-h-screen items-center justify-center py-12">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Sign in to SkillVerify</CardTitle>
          <CardDescription>Use your institute email or a connected provider.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Button
              variant="outline"
              className="w-full"
              onClick={() => signIn('google', { callbackUrl: '/dashboard' })}
            >
              <Mail className="h-4 w-4" /> Continue with Google
            </Button>
            <Button
              variant="outline"
              className="w-full"
              onClick={() => signIn('github', { callbackUrl: '/dashboard' })}
            >
              <Github className="h-4 w-4" /> Continue with GitHub
            </Button>
          </div>
          <div className="my-4 flex items-center gap-3 text-xs uppercase tracking-wider text-muted-foreground">
            <div className="h-px flex-1 bg-border" /> or <div className="h-px flex-1 bg-border" />
          </div>
          <form onSubmit={handleSubmit} className="space-y-3">
            <Input
              type="email"
              placeholder="you@institute.ac.in"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <Input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Signing in…' : 'Sign in'}
            </Button>
          </form>
          <p className="mt-3 text-center text-xs text-muted-foreground">
            <Link className="text-primary hover:underline" href="/forgot-password">
              Forgot password?
            </Link>
          </p>
          <p className="mt-4 text-center text-xs text-muted-foreground">
            New here?{' '}
            <Link className="text-primary hover:underline" href="/signup">
              Create an account
            </Link>
          </p>
          <p className="mt-1 text-center text-xs text-muted-foreground">
            Hiring?{' '}
            <Link className="text-primary hover:underline" href="/company/signup">
              Create a recruiter account
            </Link>
            {' · '}
            <Link className="text-primary hover:underline" href="/institution/signup">
              For colleges
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
