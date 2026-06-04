'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { EVENTS, track } from '@/lib/analytics';
import { Building2, ShieldCheck } from 'lucide-react';

/**
 * Recruiter self-signup. Creates a pending RECRUITER account; an admin must
 * approve before candidate search unlocks. On success we sign the recruiter in
 * and drop them on the company portal (which shows the pending screen until
 * approved).
 */
export default function CompanySignupPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    companyName: '',
    website: '',
    fullName: '',
    title: '',
    email: '',
    password: '',
  });
  const [loading, setLoading] = useState(false);

  function set<K extends keyof typeof form>(k: K, v: string) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await api('/auth/company/signup', {
        method: 'POST',
        body: JSON.stringify({
          companyName: form.companyName,
          website: form.website.trim() || undefined,
          fullName: form.fullName,
          title: form.title.trim() || undefined,
          email: form.email,
          password: form.password,
        }),
      });
      const res = await signIn('credentials', {
        email: form.email,
        password: form.password,
        redirect: false,
      });
      if (res?.error) {
        toast.error('Account created, but sign-in failed. Try logging in.');
        router.push('/login');
        return;
      }
      track(EVENTS.RECRUITER_SIGNUP);
      toast.success('Account created — pending verification');
      router.push('/company');
    } catch (err) {
      const msg = (err as Error).message;
      if (/already registered/i.test(msg)) {
        toast.error('That email already has an account. Try signing in instead.');
      } else {
        toast.error(msg.slice(0, 160));
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="container flex min-h-screen items-center justify-center py-12">
      <Card className="w-full max-w-lg">
        <CardHeader>
          <div className="mb-2 inline-flex items-center gap-2 rounded-full border bg-secondary/40 px-3 py-1 text-xs text-muted-foreground w-fit">
            <Building2 className="h-3.5 w-3.5" /> For companies & recruiters
          </div>
          <CardTitle>Hire verified talent</CardTitle>
          <CardDescription>
            Create a recruiter account. We verify every company before you can search students —
            usually within a business day.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Field label="Company name" required>
                <Input
                  value={form.companyName}
                  onChange={(e) => set('companyName', e.target.value)}
                  placeholder="Acme Inc."
                  required
                  minLength={2}
                />
              </Field>
              <Field label="Company website">
                <Input
                  type="url"
                  value={form.website}
                  onChange={(e) => set('website', e.target.value)}
                  placeholder="https://acme.com"
                />
              </Field>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Field label="Your name" required>
                <Input
                  value={form.fullName}
                  onChange={(e) => set('fullName', e.target.value)}
                  placeholder="Jane Doe"
                  required
                  minLength={2}
                />
              </Field>
              <Field label="Your title">
                <Input
                  value={form.title}
                  onChange={(e) => set('title', e.target.value)}
                  placeholder="Talent Lead"
                />
              </Field>
            </div>
            <Field label="Work email" required>
              <Input
                type="email"
                value={form.email}
                onChange={(e) => set('email', e.target.value)}
                placeholder="jane@acme.com"
                required
              />
            </Field>
            <Field label="Password" required>
              <Input
                type="password"
                value={form.password}
                onChange={(e) => set('password', e.target.value)}
                placeholder="At least 8 characters"
                required
                minLength={8}
              />
            </Field>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Creating account…' : 'Create recruiter account'}
            </Button>
          </form>

          <div className="mt-4 flex items-start gap-2 rounded-md bg-secondary/40 px-3 py-2 text-xs text-muted-foreground">
            <ShieldCheck className="h-4 w-4 shrink-0 text-emerald-600" />A real work email speeds up
            verification. Free providers (Gmail, Outlook) are accepted but reviewed more carefully.
          </div>

          <p className="mt-4 text-center text-xs text-muted-foreground">
            Already have a recruiter account?{' '}
            <Link className="text-primary hover:underline" href="/login">
              Sign in
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="block space-y-1">
      <span className="text-xs font-medium text-muted-foreground">
        {label}
        {required && <span className="text-rose-500"> *</span>}
      </span>
      {children}
    </label>
  );
}
