'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { InstitutionPicker, type Institution } from '@/components/institution-picker';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { GraduationCap, ShieldCheck } from 'lucide-react';

/**
 * Institution / TPO request-access signup. Creates a pending INSTITUTION_ADMIN
 * account; a platform admin vets it before the student roster unlocks. On
 * success we sign them in and drop them on the institution portal (pending
 * screen until approved).
 */
export default function InstitutionSignupPage() {
  const router = useRouter();
  const [institution, setInstitution] = useState<Institution | null>(null);
  const [form, setForm] = useState({ fullName: '', title: '', email: '', password: '' });
  const [loading, setLoading] = useState(false);

  function set<K extends keyof typeof form>(k: K, v: string) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!institution) {
      toast.error('Please select your institution.');
      return;
    }
    setLoading(true);
    try {
      await api('/auth/institution/signup', {
        method: 'POST',
        body: JSON.stringify({
          fullName: form.fullName,
          title: form.title.trim() || undefined,
          institutionId: institution.id,
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
      toast.success('Request submitted, pending verification');
      router.push('/institution');
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
            <GraduationCap className="h-3.5 w-3.5" /> For colleges & placement cells
          </div>
          <CardTitle>Manage your institution</CardTitle>
          <CardDescription>
            Request a TPO account to oversee your students&apos; verified profiles, post campus
            drives, and see verified placement analytics. We verify each request.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">
                Institution <span className="text-rose-500">*</span>
              </label>
              <InstitutionPicker value={institution} onChange={setInstitution} required />
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Field label="Your name" required>
                <Input
                  value={form.fullName}
                  onChange={(e) => set('fullName', e.target.value)}
                  placeholder="Dr. A. Sharma"
                  required
                  minLength={2}
                />
              </Field>
              <Field label="Your title">
                <Input
                  value={form.title}
                  onChange={(e) => set('title', e.target.value)}
                  placeholder="Placement Officer"
                />
              </Field>
            </div>
            <Field label="Official email" required>
              <Input
                type="email"
                value={form.email}
                onChange={(e) => set('email', e.target.value)}
                placeholder="tpo@college.ac.in"
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
              {loading ? 'Submitting…' : 'Request access'}
            </Button>
          </form>

          <div className="mt-4 flex items-start gap-2 rounded-md bg-secondary/40 px-3 py-2 text-xs text-muted-foreground">
            <ShieldCheck className="h-4 w-4 shrink-0 text-emerald-600" />
            Using your official college email helps us verify you faster. Verification authority
            stays with SkillVerify — TPO accounts have read-only oversight of student verification.
          </div>

          <p className="mt-4 text-center text-xs text-muted-foreground">
            Already have an account?{' '}
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
