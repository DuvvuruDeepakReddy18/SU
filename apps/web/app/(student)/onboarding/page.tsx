'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Upload, CheckCircle2, FileText, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { API_BASE, api } from '@/lib/api';
import { COURSE_PROGRAMS } from '@skillverify/shared';
import { InstitutionPicker, type Institution } from '@/components/institution-picker';

type Me = {
  role: string;
  institutionId: string | null;
  institution: Institution | null;
  studentProfile: {
    fullName: string | null;
    governmentName: string | null;
    collegeIdUrl: string | null;
  } | null;
};

/**
 * Onboarding gate for OAuth-created students. They arrive here with an account
 * but no institution / college-ID, and finish the same trust inputs an
 * email/password signup collects. The dashboard layout redirects here until
 * this is complete.
 */
export default function OnboardingPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const token = session?.accessToken as string | undefined;

  const [governmentName, setGovernmentName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('+91');
  const [instituteEmail, setInstituteEmail] = useState('');
  const [institution, setInstitution] = useState<Institution | null>(null);
  const [courseProgram, setCourseProgram] = useState<string>('B.Tech');
  const [collegeIdFile, setCollegeIdFile] = useState<File | null>(null);
  const [collegeIdKey, setCollegeIdKey] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [loaded, setLoaded] = useState(false);

  // Load the current profile: prefill the name + a pre-resolved institution,
  // and bounce to the dashboard if onboarding is somehow already done.
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.replace('/login');
      return;
    }
    if (status !== 'authenticated' || !token) return;
    let active = true;
    (async () => {
      try {
        const me = await api<Me>('/auth/me', { token });
        if (!active) return;
        if (me.role !== 'STUDENT' || (me.institutionId && me.studentProfile?.collegeIdUrl)) {
          router.replace('/dashboard');
          return;
        }
        setGovernmentName(me.studentProfile?.governmentName || me.studentProfile?.fullName || '');
        if (me.institution) setInstitution(me.institution);
      } catch {
        /* fall through to the form */
      } finally {
        if (active) setLoaded(true);
      }
    })();
    return () => {
      active = false;
    };
  }, [status, token, router]);

  async function uploadCollegeId(file: File) {
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await fetch(`${API_BASE}/auth/upload-college-id`, { method: 'POST', body: fd });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { message?: string };
        throw new Error(body.message ?? 'Upload failed');
      }
      const out = (await res.json()) as { key: string; url: string };
      setCollegeIdKey(out.key);
      setCollegeIdFile(file);
      toast.success('College ID uploaded.');
    } catch (err) {
      toast.error((err as Error).message);
      setCollegeIdKey(null);
      setCollegeIdFile(null);
    } finally {
      setUploading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!institution) {
      toast.error('Please pick your institution.');
      return;
    }
    if (!collegeIdKey) {
      toast.error('Please upload your college ID.');
      return;
    }
    if (!/^\+91\d{10}$/.test(phoneNumber)) {
      toast.error('Mobile must be +91 followed by 10 digits.');
      return;
    }
    setSubmitting(true);
    try {
      await api('/auth/complete-onboarding', {
        method: 'POST',
        token,
        body: JSON.stringify({
          governmentName,
          phoneNumber,
          instituteEmail,
          institutionId: institution.id,
          courseProgram,
          collegeIdFileKey: collegeIdKey,
        }),
      });
      toast.success('You’re all set! Your ID is under review.');
      router.replace('/dashboard');
      router.refresh();
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  }

  if (status === 'loading' || !loaded) {
    return (
      <div className="container flex min-h-screen items-center justify-center">
        <p className="text-sm text-muted-foreground">Loading…</p>
      </div>
    );
  }

  return (
    <div className="container flex min-h-screen items-center justify-center py-12">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle>Finish setting up your profile</CardTitle>
          <CardDescription>
            You signed in with {session?.user?.email}. A few verification details and you’re in —
            this is what keeps SkillVerify profiles trustworthy.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium">
                  Government name <span className="text-destructive">*</span>
                </label>
                <Input
                  placeholder="As shown on your college ID"
                  value={governmentName}
                  onChange={(e) => setGovernmentName(e.target.value)}
                  required
                  minLength={2}
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-sm font-medium">
                  Mobile <span className="text-destructive">*</span>
                </label>
                <Input
                  placeholder="+91XXXXXXXXXX"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  required
                  className="mt-1"
                />
              </div>
            </div>

            <InstitutionPicker value={institution} onChange={setInstitution} required />

            <div className="grid sm:grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium">
                  Course <span className="text-destructive">*</span>
                </label>
                <select
                  value={courseProgram}
                  onChange={(e) => setCourseProgram(e.target.value)}
                  className="mt-1 flex h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm"
                  required
                >
                  {COURSE_PROGRAMS.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium">
                  Institute email <span className="text-destructive">*</span>
                </label>
                <Input
                  type="email"
                  placeholder={
                    institution?.domain ? `you@${institution.domain}` : 'you@institute.ac.in'
                  }
                  value={instituteEmail}
                  onChange={(e) => setInstituteEmail(e.target.value)}
                  required
                  className="mt-1"
                />
                {institution?.domain && (
                  <p className="text-[10px] text-muted-foreground mt-1">
                    Must be an @{institution.domain} address (a campus subdomain like @students.
                    {institution.domain} is fine)
                  </p>
                )}
              </div>
            </div>

            {/* College ID upload */}
            <div>
              <label className="text-sm font-medium">
                College ID card <span className="text-destructive">*</span>
              </label>
              <p className="text-xs text-muted-foreground mt-0.5">
                JPG / PNG / PDF, max 10MB. We use this to verify you really attend{' '}
                {institution?.name || 'your institution'}.
              </p>
              <label
                htmlFor="college-id-file"
                className="mt-2 flex flex-col items-center justify-center gap-2 rounded-md border-2 border-dashed border-input p-6 text-sm cursor-pointer hover:bg-secondary/30"
              >
                {collegeIdKey ? (
                  <>
                    <CheckCircle2 className="h-6 w-6 text-emerald-500" />
                    <div className="font-medium">{collegeIdFile?.name ?? 'ID uploaded'}</div>
                    <div className="text-xs text-muted-foreground">Click to replace</div>
                  </>
                ) : uploading ? (
                  <>
                    <Upload className="h-6 w-6 text-muted-foreground animate-pulse" />
                    <div>Uploading…</div>
                  </>
                ) : (
                  <>
                    <FileText className="h-6 w-6 text-muted-foreground" />
                    <div className="font-medium">Click to choose your ID file</div>
                    <div className="text-xs text-muted-foreground">JPG, PNG, WebP, or PDF</div>
                  </>
                )}
                <input
                  id="college-id-file"
                  type="file"
                  accept="image/jpeg,image/png,image/webp,application/pdf"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) void uploadCollegeId(f);
                  }}
                />
              </label>
            </div>

            <div className="rounded-md border border-primary/30 bg-primary/5 p-3 text-xs text-muted-foreground flex gap-2">
              <ShieldCheck className="h-4 w-4 text-primary shrink-0 mt-0.5" />
              <div>
                Your ID is verified by our team (AI-assisted). Until then your profile shows
                &quot;Pending review&quot; and isn&apos;t recommended to recruiters.
              </div>
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={submitting || uploading || !collegeIdKey}
            >
              {submitting ? 'Saving…' : 'Finish & enter dashboard'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
