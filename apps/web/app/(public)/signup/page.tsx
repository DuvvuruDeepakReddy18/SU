'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Upload, CheckCircle2, FileText, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { API_BASE } from '@/lib/api';
import { COURSE_PROGRAMS } from '@skillverify/shared';
import { InstitutionPicker, type Institution } from '@/components/institution-picker';

export default function SignupPage() {
  const router = useRouter();
  const [governmentName, setGovernmentName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('+91');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [instituteEmail, setInstituteEmail] = useState('');
  const [institution, setInstitution] = useState<Institution | null>(null);
  const [courseProgram, setCourseProgram] = useState<string>('B.Tech');
  const [collegeIdFile, setCollegeIdFile] = useState<File | null>(null);
  const [collegeIdKey, setCollegeIdKey] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  async function uploadCollegeId(file: File) {
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await fetch(`${API_BASE}/auth/upload-college-id`, {
        method: 'POST',
        body: fd,
      });
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

    // Frontend validation — backend re-validates everything.
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
      const res = await fetch(`${API_BASE}/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          governmentName,
          phoneNumber,
          email,
          password,
          instituteEmail,
          institutionId: institution.id,
          courseProgram,
          collegeIdFileKey: collegeIdKey,
        }),
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { message?: string };
        throw new Error(body.message ?? 'Sign-up failed');
      }
      const signin = await signIn('credentials', { email, password, redirect: false });
      if (signin?.error) throw new Error('Created, but sign-in failed');
      toast.success('Welcome to SkillVerify! Your ID is under review.');
      router.push('/dashboard');
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="container flex min-h-screen items-center justify-center py-12">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle>Create your verified profile</CardTitle>
          <CardDescription>
            All fields are mandatory. We use them to verify you actually study where you say you
            study.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Name + mobile */}
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

            {/* Institution picker */}
            <InstitutionPicker value={institution} onChange={setInstitution} required />

            {/* Course + institute email */}
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
                    Must end with @{institution.domain}
                  </p>
                )}
              </div>
            </div>

            {/* Login email + password */}
            <div className="grid sm:grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium">
                  Login email <span className="text-destructive">*</span>
                </label>
                <Input
                  type="email"
                  placeholder="Can be the same as institute email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-sm font-medium">
                  Password <span className="text-destructive">*</span>
                </label>
                <Input
                  type="password"
                  placeholder="Min 8 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={8}
                  className="mt-1"
                />
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
                &quot;Pending review&quot; and isn&apos;t recommended to recruiters. Problems?
                <Link href="/support" className="text-primary hover:underline ml-1">
                  Contact support
                </Link>
                .
              </div>
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={submitting || uploading || !collegeIdKey}
            >
              {submitting ? 'Creating account…' : 'Create account'}
            </Button>
          </form>

          <p className="mt-4 text-center text-xs text-muted-foreground">
            Already on SkillVerify?{' '}
            <Link href="/login" className="text-primary hover:underline">
              Sign in
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
