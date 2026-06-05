'use client';

import { useEffect, useRef, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { ArrowLeft, Download, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';
import { ModernTemplate, ClassicTemplate, CompactTemplate } from './templates';

// ------------------------------------------------------------------
// Resume builder
// ------------------------------------------------------------------
// Architecture:
//  - All form state is held in component memory (no DB persistence) so the
//    builder doesn't fight with the auto-populated profile.
//  - Default values are seeded from /profile/me + /verifications/me/summary.
//  - 3 templates render the same data shape — switching is instant.
//  - "Download" triggers window.print() and a print-only stylesheet hides
//    everything but the .resume-preview node, producing a clean PDF without
//    needing react-pdf / pdfkit on the client.

type Profile = {
  fullName: string;
  governmentName: string | null;
  headline: string | null;
  bio: string | null;
  phoneNumber: string | null;
  instituteEmail: string | null;
  cgpa: number | null;
  graduationYear: number | null;
  linkedinUrl: string | null;
  githubUrl: string | null;
  portfolioUrl: string | null;
  location: string | null;
  user: { email: string; institution: { name: string } | null };
};

type Summary = {
  skills: { skill: { name: string }; highestVerificationLayer: string }[];
  certs: { issuer: string; courseName: string; tier: string }[];
  academic: { semester: number; cgpa: number; verifiedAt: string | null }[];
  projects: {
    id: string;
    title: string;
    description: string | null;
    repoUrl: string | null;
    techStack: string[];
  }[];
};

export type ResumeData = {
  name: string;
  headline: string;
  email: string;
  phone: string;
  location: string;
  links: { label: string; url: string }[];
  institution: string;
  cgpa: number | null;
  graduationYear: number | null;
  bio: string;
  skills: string[];
  certifications: { issuer: string; courseName: string }[];
  projects: { title: string; description: string; techStack: string[]; repoUrl: string | null }[];
};

type TemplateId = 'modern' | 'classic' | 'compact';

const TEMPLATES: { id: TemplateId; label: string; Component: React.FC<{ data: ResumeData }> }[] = [
  { id: 'modern', label: 'Modern', Component: ModernTemplate },
  { id: 'classic', label: 'Classic', Component: ClassicTemplate },
  { id: 'compact', label: 'Compact', Component: CompactTemplate },
];

export default function ResumeBuilderPage() {
  const { data: session } = useSession();

  const token = session?.accessToken as string | undefined;

  const { data: profile } = useQuery({
    enabled: !!token,
    queryKey: ['profile.me'],
    queryFn: () => api<Profile>('/profile/me', { token }),
  });
  const { data: summary } = useQuery({
    enabled: !!token,
    queryKey: ['verifications.summary'],
    queryFn: () => api<Summary>('/verifications/me/summary', { token }),
  });

  const [template, setTemplate] = useState<TemplateId>('modern');
  const [data, setData] = useState<ResumeData | null>(null);

  // Seed form state from profile + summary once both arrive.
  useEffect(() => {
    if (!profile || !summary) return;
    setData({
      name: profile.governmentName || profile.fullName,
      headline: profile.headline ?? '',
      email: profile.instituteEmail ?? profile.user.email,
      phone: profile.phoneNumber ?? '',
      location: profile.location ?? '',
      links: [
        profile.linkedinUrl && { label: 'LinkedIn', url: profile.linkedinUrl },
        profile.githubUrl && { label: 'GitHub', url: profile.githubUrl },
        profile.portfolioUrl && { label: 'Portfolio', url: profile.portfolioUrl },
      ].filter(Boolean) as { label: string; url: string }[],
      institution: profile.user.institution?.name ?? '',
      cgpa: profile.cgpa,
      graduationYear: profile.graduationYear,
      bio: profile.bio ?? '',
      skills: summary.skills.map((s) => s.skill.name),
      certifications: summary.certs.map((c) => ({ issuer: c.issuer, courseName: c.courseName })),
      projects: summary.projects.map((p) => ({
        title: p.title,
        description: p.description ?? '',
        techStack: p.techStack,
        repoUrl: p.repoUrl,
      })),
    });
  }, [profile, summary]);

  const printRef = useRef<HTMLDivElement>(null);

  function handleDownload() {
    // The print-only CSS in globals.css will hide everything except
    // .resume-preview, so the user gets a single-page PDF when they pick
    // "Save as PDF" in the browser print dialog.
    window.print();
  }

  if (!data) {
    return <div className="animate-pulse h-96 rounded bg-secondary" />;
  }

  const Template = TEMPLATES.find((t) => t.id === template)?.Component ?? ModernTemplate;

  return (
    <div className="space-y-4 no-print-when-resume">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <Link
            href="/dashboard/profile"
            className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Back to profile
          </Link>
          <h1 className="text-2xl font-semibold flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" /> Resume builder
          </h1>
          <p className="text-sm text-muted-foreground">
            Pre-filled from your verified profile. Tweak any field, pick a template, save as PDF.
          </p>
        </div>
        <Button onClick={handleDownload}>
          <Download className="h-4 w-4" /> Download as PDF
        </Button>
      </div>

      {/* Template chips */}
      <div className="flex flex-wrap gap-2">
        {TEMPLATES.map((t) => (
          <button
            key={t.id}
            onClick={() => setTemplate(t.id)}
            className={cn(
              'rounded-md border px-3 py-1 text-sm transition',
              template === t.id
                ? 'border-primary bg-primary/10 text-foreground'
                : 'bg-background text-muted-foreground hover:bg-secondary',
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_1.2fr]">
        {/* ---------- Editor ---------- */}
        <Card>
          <CardContent className="p-4 space-y-4">
            <Section label="Header">
              <Field
                label="Name"
                value={data.name}
                onChange={(v) => setData({ ...data, name: v })}
              />
              <Field
                label="Headline"
                value={data.headline}
                onChange={(v) => setData({ ...data, headline: v })}
                placeholder="e.g. Full-stack engineer · IIM Sambalpur"
              />
              <div className="grid grid-cols-2 gap-2">
                <Field
                  label="Email"
                  value={data.email}
                  onChange={(v) => setData({ ...data, email: v })}
                />
                <Field
                  label="Phone"
                  value={data.phone}
                  onChange={(v) => setData({ ...data, phone: v })}
                />
              </div>
              <Field
                label="Location"
                value={data.location}
                onChange={(v) => setData({ ...data, location: v })}
              />
            </Section>

            <Section label="About">
              <Textarea
                value={data.bio}
                onChange={(v) => setData({ ...data, bio: v })}
                placeholder="Two-line summary the recruiter reads first."
                rows={4}
              />
            </Section>

            <Section label="Education">
              <div className="grid grid-cols-2 gap-2">
                <Field
                  label="Institution"
                  value={data.institution}
                  onChange={(v) => setData({ ...data, institution: v })}
                />
                <Field
                  label="Grad year"
                  value={data.graduationYear?.toString() ?? ''}
                  onChange={(v) => setData({ ...data, graduationYear: v ? parseInt(v, 10) : null })}
                />
              </div>
              <Field
                label="CGPA"
                value={data.cgpa?.toString() ?? ''}
                onChange={(v) => setData({ ...data, cgpa: v ? parseFloat(v) : null })}
              />
            </Section>

            <Section label="Skills (one per line)">
              <Textarea
                value={data.skills.join('\n')}
                onChange={(v) =>
                  setData({
                    ...data,
                    skills: v
                      .split(/\n+/)
                      .map((s) => s.trim())
                      .filter(Boolean),
                  })
                }
                rows={5}
              />
            </Section>

            {/* Projects + certs are read-only here — edit them on the profile page
                to keep the source of truth in one place. */}
            <Section label="Projects (managed in your profile)">
              <div className="text-xs text-muted-foreground">
                {data.projects.length} project{data.projects.length === 1 ? '' : 's'} pulled from
                your profile.{' '}
                <Link href="/dashboard/profile" className="text-primary hover:underline">
                  Edit on profile →
                </Link>
              </div>
            </Section>
            <Section label="Certifications (managed in your profile)">
              <div className="text-xs text-muted-foreground">
                {data.certifications.length} certification
                {data.certifications.length === 1 ? '' : 's'} pulled from your profile.
              </div>
            </Section>
          </CardContent>
        </Card>

        {/* ---------- Preview ---------- */}
        <div className="lg:sticky lg:top-4 self-start">
          <div className="rounded-md border bg-secondary/20 p-2 text-xs text-muted-foreground mb-2">
            Preview at A4 width. Use Ctrl+P / Cmd+P or the Download button to export as PDF.
          </div>
          <div
            ref={printRef}
            className="resume-preview rounded-md shadow-lg overflow-hidden bg-white text-zinc-900"
            style={{ width: '210mm', minHeight: '297mm', transformOrigin: 'top left' }}
          >
            <Template data={data} />
          </div>
        </div>
      </div>
    </div>
  );
}

// ---------- form primitives ----------

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
        {label}
      </div>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <div>
      <div className="text-[10px] text-muted-foreground mb-1">{label}</div>
      <Input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} />
    </div>
  );
}

function Textarea({
  value,
  onChange,
  rows = 3,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  rows?: number;
  placeholder?: string;
}) {
  return (
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      rows={rows}
      placeholder={placeholder}
      className="w-full resize-y rounded-md border border-input bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
    />
  );
}
