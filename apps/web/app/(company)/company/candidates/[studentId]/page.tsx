'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from 'sonner';
import {
  ArrowLeft,
  Bookmark,
  BookmarkCheck,
  Lock,
  Mail,
  Phone,
  GraduationCap,
  MapPin,
  ExternalLink,
  Send,
} from 'lucide-react';
import { LAYER_META, initials } from '@/components/company/candidate-card';
import { EVENTS, track } from '@/lib/analytics';
import { cn } from '@/lib/utils';

type Candidate = {
  userId: string;
  fullName: string;
  headline: string | null;
  bio: string | null;
  avatarUrl: string | null;
  sharableSlug: string;
  graduationYear: number | null;
  location: string | null;
  courseProgram: string | null;
  cgpa: number | null;
  cgpaVerified?: boolean;
  institution: string | null;
  topLayer: string;
  skills: { name: string; category: string; layer: string }[];
  projects: {
    id: string;
    title: string;
    description: string | null;
    techStack: string[];
    stars: number;
  }[];
  certifications: { id: string; issuer: string; courseName: string; tier: string }[];
  contactUnlocked: boolean;
  contact: { phoneNumber: string | null; instituteEmail: string | null; email: string } | null;
};

export default function CandidateDetailPage() {
  const params = useParams<{ studentId: string }>();
  const studentId = params.studentId;
  const { data: session } = useSession();

  const token = session?.accessToken as string | undefined;
  const qc = useQueryClient();
  const [message, setMessage] = useState('');
  const [showInquiry, setShowInquiry] = useState(false);

  const { data: c, isLoading } = useQuery({
    enabled: !!token,
    queryKey: ['recruiters.candidate', studentId],
    queryFn: () => api<Candidate>(`/recruiters/candidates/${studentId}`, { token }),
  });

  const { data: saved } = useQuery({
    enabled: !!token,
    queryKey: ['recruiters.saved'],
    queryFn: () => api<{ candidate: { userId: string } }[]>('/recruiters/saved', { token }),
  });
  const isSaved = !!saved?.some((s) => s.candidate.userId === studentId);

  const toggleSave = useMutation({
    mutationFn: () =>
      api(`/recruiters/saved/${studentId}`, {
        method: isSaved ? 'DELETE' : 'POST',
        token,
        body: isSaved ? undefined : JSON.stringify({}),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['recruiters.saved'] }),
  });

  const sendInquiry = useMutation({
    mutationFn: () =>
      api('/recruiters/inquiries', {
        method: 'POST',
        token,
        idempotent: true,
        body: JSON.stringify({ studentId, message }),
      }),
    onSuccess: () => {
      track(EVENTS.RECRUITER_INQUIRY_SENT);
      toast.success('Message sent. You’ll be notified if they accept.');
      setShowInquiry(false);
      setMessage('');
    },
    onError: (e) => toast.error((e as Error).message.slice(0, 160)),
  });

  const { data: jobs } = useQuery({
    enabled: !!token,
    queryKey: ['recruiters.jobs'],
    queryFn: () => api<{ id: string; role: string }[]>('/recruiters/jobs', { token }),
  });

  const source = useMutation({
    mutationFn: (jobId: string) =>
      api(`/recruiters/jobs/${jobId}/source/${studentId}`, { method: 'POST', token }),
    onSuccess: () => toast.success('Added to the job pipeline (shortlisted).'),
    onError: (e) => toast.error((e as Error).message.slice(0, 160)),
  });

  if (isLoading || !c) {
    return <div className="text-sm text-muted-foreground">Loading…</div>;
  }

  const layer = LAYER_META[c.topLayer] ?? LAYER_META.L0_UNVERIFIED;

  return (
    <div className="max-w-3xl space-y-5">
      <Link
        href="/company/candidates"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> Back to search
      </Link>

      {/* Header */}
      <Card>
        <CardContent className="p-5">
          <div className="flex items-start gap-4">
            {c.avatarUrl ? (
              <img src={c.avatarUrl} alt="" className="h-16 w-16 rounded-full object-cover" />
            ) : (
              <div className="grid h-16 w-16 place-items-center rounded-full bg-primary/15 text-lg font-semibold text-primary">
                {initials(c.fullName)}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-semibold">{c.fullName}</h1>
                <span className={cn('rounded px-1.5 py-0.5 text-[11px] font-bold', layer.cls)}>
                  {layer.label}
                </span>
              </div>
              {c.headline && <p className="text-sm text-muted-foreground">{c.headline}</p>}
              <div className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
                {c.institution && (
                  <span className="inline-flex items-center gap-1">
                    <GraduationCap className="h-3 w-3" /> {c.institution}
                  </span>
                )}
                {c.courseProgram && <span>{c.courseProgram}</span>}
                {/* CGPA + graduation year hidden until extraction is reliable. */}
                {c.location && (
                  <span className="inline-flex items-center gap-1">
                    <MapPin className="h-3 w-3" /> {c.location}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <Button onClick={() => setShowInquiry((s) => !s)} className="gap-1">
              <Send className="h-4 w-4" /> Request contact
            </Button>
            <Button variant="outline" onClick={() => toggleSave.mutate()} className="gap-1">
              {isSaved ? <BookmarkCheck className="h-4 w-4" /> : <Bookmark className="h-4 w-4" />}
              {isSaved ? 'Saved' : 'Shortlist'}
            </Button>
            <a href={`/u/${c.sharableSlug}`} target="_blank" rel="noreferrer">
              <Button variant="ghost" className="gap-1">
                Public profile <ExternalLink className="h-3.5 w-3.5" />
              </Button>
            </a>
            {(jobs?.length ?? 0) > 0 && (
              <select
                defaultValue=""
                onChange={(e) => {
                  if (e.target.value) source.mutate(e.target.value);
                  e.target.value = '';
                }}
                className="rounded-md border border-input bg-transparent px-2 py-2 text-sm text-muted-foreground"
                aria-label="Add to a job pipeline"
              >
                <option value="" disabled>
                  Add to job…
                </option>
                {jobs?.map((j) => (
                  <option key={j.id} value={j.id}>
                    {j.role}
                  </option>
                ))}
              </select>
            )}
          </div>

          {showInquiry && (
            <div className="mt-3 space-y-2 rounded-lg border bg-secondary/30 p-3">
              <div className="text-xs text-muted-foreground">
                Tell {c.fullName.split(' ')[0]} what you&apos;re hiring for. Their contact details
                unlock only if they accept.
              </div>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={3}
                placeholder="Hi! We're hiring a frontend engineer at…"
                className="w-full resize-none rounded-md border border-input bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
              />
              <div className="flex justify-end">
                <Button
                  size="sm"
                  disabled={message.trim().length < 10 || sendInquiry.isPending}
                  onClick={() => sendInquiry.mutate()}
                >
                  {sendInquiry.isPending ? 'Sending…' : 'Send message'}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Contact */}
      <Card>
        <CardContent className="p-5">
          <div className="mb-2 text-sm font-medium">Contact</div>
          {c.contactUnlocked && c.contact ? (
            <div className="space-y-1.5 text-sm">
              <div className="inline-flex items-center gap-2">
                <Mail className="h-4 w-4 text-muted-foreground" /> {c.contact.email}
              </div>
              {c.contact.instituteEmail && (
                <div className="inline-flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" /> {c.contact.instituteEmail}
                </div>
              )}
              {c.contact.phoneNumber && (
                <div className="inline-flex items-center gap-2">
                  <Phone className="h-4 w-4 text-muted-foreground" /> {c.contact.phoneNumber}
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Lock className="h-4 w-4" /> Contact unlocks once {c.fullName.split(' ')[0]} accepts
              your message.
            </div>
          )}
        </CardContent>
      </Card>

      {/* Skills */}
      {c.skills.length > 0 && (
        <Card>
          <CardContent className="p-5">
            <div className="mb-3 text-sm font-medium">Verified skills</div>
            <div className="flex flex-wrap gap-1.5">
              {c.skills.map((s) => {
                const m = LAYER_META[s.layer] ?? LAYER_META.L0_UNVERIFIED;
                return (
                  <span
                    key={s.name}
                    className="inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs"
                  >
                    {s.name}
                    <span className={cn('rounded px-1 text-[9px] font-bold', m.cls)}>
                      {m.label}
                    </span>
                  </span>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Projects */}
      {c.projects.length > 0 && (
        <Card>
          <CardContent className="p-5">
            <div className="mb-3 text-sm font-medium">Projects</div>
            <div className="space-y-3">
              {c.projects.map((p) => (
                <div key={p.id} className="rounded-md border p-3">
                  <div className="text-sm font-medium">{p.title}</div>
                  {p.description && (
                    <p className="mt-0.5 text-xs text-muted-foreground line-clamp-3">
                      {p.description}
                    </p>
                  )}
                  {p.techStack.length > 0 && (
                    <div className="mt-1.5 flex flex-wrap gap-1">
                      {p.techStack.map((t) => (
                        <span key={t} className="rounded bg-secondary px-1.5 py-0.5 text-[10px]">
                          {t}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Certifications */}
      {c.certifications.length > 0 && (
        <Card>
          <CardContent className="p-5">
            <div className="mb-3 text-sm font-medium">Certifications</div>
            <div className="space-y-2">
              {c.certifications.map((cert) => (
                <div key={cert.id} className="flex items-center justify-between text-sm">
                  <span>
                    {cert.courseName} <span className="text-muted-foreground">· {cert.issuer}</span>
                  </span>
                  <span className="rounded bg-secondary px-1.5 py-0.5 text-[10px]">
                    {cert.tier}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
