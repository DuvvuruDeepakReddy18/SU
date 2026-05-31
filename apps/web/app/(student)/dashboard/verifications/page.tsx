'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { Upload, ShieldCheck, FileText, CheckCircle2, XCircle, Clock } from 'lucide-react';

type Profile = {
  collegeIdUrl: string | null;
  collegeIdStatus: string | null;
  collegeIdRejectionReason: string | null;
  collegeIdUploadedAt: string | null;
  collegeIdVerifiedAt: string | null;
  cgpa: number | null;
  cgpaVerifiedAt: string | null;
  courseProgram: string | null;
};

type AcademicRecord = {
  id: string;
  semester: number;
  cgpa: number;
  sgpa: number | null;
  docUrl: string | null;
  verificationStatus: string;
  rejectionReason: string | null;
  extractedName: string | null;
  extractedInstitution: string | null;
  verifiedAt: string | null;
};

type Summary = {
  skills: { id: string; highestVerificationLayer: string; skill: { name: string } }[];
  certs: {
    id: string;
    issuer: string;
    courseName: string;
    tier: string;
    verificationStatus: string;
  }[];
  academic: { id: string; semester: number; cgpa: number; verifiedAt: string | null }[];
  projects: { id: string; title: string; linkedSkills: string[]; repoUrl: string | null }[];
};

const SEMESTERS_BY_COURSE: Record<string, number> = {
  'B.Tech': 8,
  'B.E.': 8,
  'B.Arch': 10,
  LLB: 10,
  MBBS: 10,
  BDS: 10,
  'M.Tech': 4,
  'M.E.': 4,
  MBA: 4,
  MCA: 4,
  'M.Sc': 4,
  'M.A.': 4,
  'M.Com': 4,
  'M.Arch': 4,
  'M.Pharma': 4,
  LLM: 4,
  'B.Sc': 6,
  'B.A.': 6,
  'B.Com': 6,
  BBA: 6,
  BCA: 6,
  'B.Pharma': 8,
  MD: 6,
  PhD: 6,
  Other: 8,
};

export default function VerificationsPage() {
  const { data: session } = useSession();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const token = (session as any)?.accessToken as string | undefined;
  const qc = useQueryClient();

  const { data: profile } = useQuery({
    enabled: !!token,
    queryKey: ['profile.me'],
    queryFn: () => api<Profile>('/profile/me', { token }),
  });

  const { data: records } = useQuery({
    enabled: !!token,
    queryKey: ['verifications.academic-records'],
    queryFn: () => api<AcademicRecord[]>('/verifications/academic-records', { token }),
  });

  const { data: summary } = useQuery({
    enabled: !!token,
    queryKey: ['verifications.summary'],
    queryFn: () => api<Summary>('/verifications/me/summary', { token }),
  });

  const totalSemesters = SEMESTERS_BY_COURSE[profile?.courseProgram ?? 'B.Tech'] ?? 8;
  const bySemester = new Map((records ?? []).map((r) => [r.semester, r]));

  const collegeIdState = (() => {
    if (profile?.collegeIdStatus === 'verified' || profile?.collegeIdVerifiedAt) {
      return { label: 'Verified', variant: 'success' as const };
    }
    if (profile?.collegeIdStatus === 'rejected') {
      return { label: 'Rejected — re-upload', variant: 'warning' as const };
    }
    if (profile?.collegeIdUrl) {
      return { label: 'Pending review', variant: 'warning' as const };
    }
    return { label: 'Not uploaded', variant: 'secondary' as const };
  })();

  async function uploadCollegeId(file: File) {
    const fd = new FormData();
    fd.append('file', file);
    const tid = toast.loading('Uploading College ID…');
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/profile/college-id`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: fd,
      });
      if (!res.ok) throw new Error((await res.text()).slice(0, 200));
      toast.success('College ID uploaded — pending review', { id: tid });
      qc.invalidateQueries({ queryKey: ['profile.me'] });
    } catch (e) {
      toast.error((e as Error).message, { id: tid });
    }
  }

  async function uploadSemester(semester: number, file: File) {
    const fd = new FormData();
    fd.append('file', file);
    const tid = toast.loading(`Uploading semester ${semester} marksheet…`);
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/verifications/academic-records/upload?semester=${semester}`,
        {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
          body: fd,
        },
      );
      if (!res.ok) {
        const t = await res.text();
        throw new Error(t.slice(0, 200));
      }
      toast.success('Marksheet uploaded — analysing…', { id: tid });
      qc.invalidateQueries({ queryKey: ['verifications.academic-records'] });
      qc.invalidateQueries({ queryKey: ['profile.me'] });
      qc.invalidateQueries({ queryKey: ['verifications.summary'] });
    } catch (e) {
      toast.error((e as Error).message, { id: tid });
    }
  }

  const [cert, setCert] = useState({ issuer: '', courseName: '' });
  const addCert = useMutation({
    mutationFn: () =>
      api('/verifications/certifications', { method: 'POST', token, body: JSON.stringify(cert) }),
    onSuccess: () => {
      toast.success('Certification submitted');
      setCert({ issuer: '', courseName: '' });
      qc.invalidateQueries({ queryKey: ['verifications.summary'] });
    },
    onError: (e) => toast.error((e as Error).message),
  });

  const verifiedSems = (records ?? []).filter((r) => r.verificationStatus === 'verified').length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Verification Center</h1>
        <p className="text-sm text-muted-foreground">
          Unverified profiles are not recommended to recruiters or freelance clients. Verify each
          piece of data to unlock the green badge on your portfolio.
        </p>
      </div>

      {/* Status strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatusTile
          label="College ID"
          state={collegeIdState.label === 'Verified' ? 'verified' : 'unverified'}
          detail={collegeIdState.label}
        />
        <StatusTile
          label="CGPA"
          state={profile?.cgpaVerifiedAt ? 'verified' : 'unverified'}
          detail={
            profile?.cgpaVerifiedAt
              ? `${profile.cgpa?.toFixed(2) ?? '—'} (verified)`
              : 'No verified records yet'
          }
        />
        <StatusTile
          label="Semester results"
          state={verifiedSems > 0 ? 'verified' : 'unverified'}
          detail={`${verifiedSems} / ${totalSemesters} verified`}
        />
        <StatusTile
          label="Skills verified"
          state={
            (summary?.skills.filter((s) => s.highestVerificationLayer !== 'L0_UNVERIFIED').length ??
              0) > 0
              ? 'verified'
              : 'unverified'
          }
          detail={`${summary?.skills.filter((s) => s.highestVerificationLayer !== 'L0_UNVERIFIED').length ?? 0} / ${summary?.skills.length ?? 0}`}
        />
      </div>

      {/* College ID */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <ShieldCheck className="h-4 w-4 text-primary" /> College ID
            <Badge variant={collegeIdState.variant} className="ml-2">
              {collegeIdState.label}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Already uploaded at signup. You can replace it here if it was rejected.
          </p>
          {profile?.collegeIdRejectionReason && (
            <div className="rounded border border-destructive/40 bg-destructive/5 p-3 text-xs">
              <strong>Rejected:</strong> {profile.collegeIdRejectionReason}
            </div>
          )}
          <div className="flex items-center gap-3">
            <label className="cursor-pointer">
              <input
                type="file"
                accept="image/*,application/pdf"
                className="hidden"
                onChange={(e) => e.target.files?.[0] && uploadCollegeId(e.target.files[0])}
              />
              <span className="inline-flex items-center gap-2 rounded-md border bg-background px-3 py-1.5 text-sm hover:bg-secondary">
                <Upload className="h-4 w-4" />
                {profile?.collegeIdUrl ? 'Replace file' : 'Upload College ID'}
              </span>
            </label>
            {profile?.collegeIdUrl && (
              <a
                href={profile.collegeIdUrl}
                target="_blank"
                rel="noreferrer"
                className="text-sm text-primary hover:underline"
              >
                View current →
              </a>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Semester-wise CGPA verification */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <FileText className="h-4 w-4 text-primary" /> Semester-wise CGPA verification
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-md border border-amber-300/40 bg-amber-50/40 p-3 text-xs dark:bg-amber-900/10">
            <strong>Required in each document:</strong>
            <ol className="mt-1 list-decimal pl-4 space-y-0.5">
              <li>Student name (must match your profile name)</li>
              <li>Institute / university name (must match your registered institution)</li>
              <li>Date / year of examination (mandatory)</li>
              <li>SGPA / CGPA clearly visible</li>
              <li>Official stamp or digital watermark (preferred)</li>
            </ol>
            <div className="mt-1">
              Uploads that fail any of these or look digitally edited are flagged for manual review.
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {Array.from({ length: totalSemesters }, (_, i) => i + 1).map((sem) => {
              const rec = bySemester.get(sem);
              return (
                <SemesterTile
                  key={sem}
                  semester={sem}
                  record={rec}
                  onUpload={(f) => uploadSemester(sem, f)}
                />
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Certifications (L2) */}
      <Card>
        <CardHeader>
          <CardTitle>L2 · Add certification</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-3">
          <Input
            value={cert.issuer}
            onChange={(e) => setCert({ ...cert, issuer: e.target.value })}
            placeholder="Issuer (e.g. AWS, Coursera)"
          />
          <Input
            value={cert.courseName}
            onChange={(e) => setCert({ ...cert, courseName: e.target.value })}
            placeholder="Course name"
          />
          <Button
            onClick={() => addCert.mutate()}
            disabled={addCert.isPending || !cert.issuer || !cert.courseName}
          >
            Submit
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Skill verification status</CardTitle>
        </CardHeader>
        <CardContent>
          {(summary?.skills.length ?? 0) === 0 ? (
            <p className="text-sm text-muted-foreground">No skills added yet.</p>
          ) : (
            <div className="grid gap-2 md:grid-cols-2">
              {summary?.skills.map((s) => (
                <div
                  key={s.id}
                  className="flex items-center justify-between rounded-md border p-3 text-sm"
                >
                  <span className="font-medium">{s.skill.name}</span>
                  <Badge
                    variant={
                      s.highestVerificationLayer === 'L0_UNVERIFIED' ? 'secondary' : 'default'
                    }
                  >
                    {s.highestVerificationLayer.replace('_', ' ')}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function StatusTile({
  label,
  state,
  detail,
}: {
  label: string;
  state: 'verified' | 'unverified';
  detail: string;
}) {
  return (
    <div className="rounded-md border p-3">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div
        className={`mt-0.5 text-sm font-semibold ${state === 'verified' ? 'text-emerald-600' : 'text-rose-600'}`}
      >
        {state === 'verified' ? 'VERIFIED' : 'UNVERIFIED'}
      </div>
      <div className="text-xs text-muted-foreground mt-0.5">{detail}</div>
    </div>
  );
}

function SemesterTile({
  semester,
  record,
  onUpload,
}: {
  semester: number;
  record: AcademicRecord | undefined;
  onUpload: (file: File) => void;
}) {
  const id = `sem-${semester}-file`;
  const status = record?.verificationStatus;
  const accent =
    status === 'verified'
      ? 'border-emerald-500/50 bg-emerald-50/30 dark:bg-emerald-900/10'
      : status === 'rejected'
        ? 'border-destructive/50 bg-destructive/5'
        : status === 'pending'
          ? 'border-amber-400/50 bg-amber-50/30 dark:bg-amber-900/10'
          : 'border-dashed';

  return (
    <label
      htmlFor={id}
      className={`flex flex-col items-center justify-center gap-1 rounded-md border p-3 text-center text-xs cursor-pointer hover:bg-secondary/30 ${accent}`}
    >
      <div className="font-medium">Semester {semester}</div>
      {status === 'verified' && (
        <>
          <CheckCircle2 className="h-5 w-5 text-emerald-500" />
          <div>
            CGPA <span className="font-semibold">{record?.cgpa.toFixed(2)}</span>
          </div>
          <div className="text-[10px] text-muted-foreground">Click to re-upload</div>
        </>
      )}
      {status === 'pending' && (
        <>
          <Clock className="h-5 w-5 text-amber-500" />
          <div>Pending review</div>
          <div className="text-[10px] text-muted-foreground">Click to re-upload</div>
        </>
      )}
      {status === 'rejected' && (
        <>
          <XCircle className="h-5 w-5 text-destructive" />
          <div className="line-clamp-2">{record?.rejectionReason ?? 'Rejected'}</div>
          <div className="text-[10px] text-primary">Click to re-upload</div>
        </>
      )}
      {!status && (
        <>
          <Upload className="h-5 w-5 text-muted-foreground" />
          <div>Upload marksheet</div>
        </>
      )}
      <input
        id={id}
        type="file"
        accept="image/*,application/pdf"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) onUpload(f);
        }}
      />
    </label>
  );
}
