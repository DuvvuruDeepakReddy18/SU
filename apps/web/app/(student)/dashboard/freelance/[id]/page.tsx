'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import {
  ChevronLeft,
  Star,
  MapPin,
  Github,
  Linkedin,
  Globe,
  GraduationCap,
  MessageCircle,
} from 'lucide-react';

type ServiceDetail = {
  id: string;
  title: string;
  category: string;
  description: string;
  priceFrom: number | null;
  priceUnit: string | null;
  skills: string[];
  location: string | null;
  isRemote: boolean;
  createdAt: string;
  provider: {
    studentProfile: {
      fullName: string;
      avatarUrl: string | null;
      sharableSlug: string;
      headline: string | null;
      bio: string | null;
      location: string | null;
      githubUrl: string | null;
      linkedinUrl: string | null;
      portfolioUrl: string | null;
    } | null;
    institution: { name: string } | null;
    userSkills: {
      id: string;
      highestVerificationLayer: string;
      skill: { name: string };
    }[];
  };
};

function stubRating(id: string): { score: number; count: number } {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) | 0;
  const score = 3.8 + (Math.abs(h) % 13) / 10;
  const count = 3 + (Math.abs(h >> 4) % 27);
  return { score: Math.min(5, Math.round(score * 10) / 10), count };
}

export default function ServiceDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { data: session } = useSession();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const token = (session as any)?.accessToken as string | undefined;

  const [showInquiry, setShowInquiry] = useState(false);
  const [brief, setBrief] = useState('');
  const [budget, setBudget] = useState('');
  const [deadline, setDeadline] = useState('');

  const { data: service } = useQuery({
    queryKey: ['service', params.id],
    queryFn: () => api<ServiceDetail | null>(`/freelance/services/${params.id}`),
  });

  const inquire = useMutation({
    mutationFn: () =>
      api<{ id: string }>(`/freelance/services/${params.id}/inquire`, {
        method: 'POST',
        token,
        body: JSON.stringify({
          brief,
          budgetInr: budget ? Number(budget) : undefined,
          deadlineAt: deadline || undefined,
        }),
      }),
    onSuccess: (data) => {
      toast.success('Inquiry sent');
      router.push(`/dashboard/freelance/inquiries/${data.id}`);
    },
    onError: (e) => toast.error((e as Error).message),
  });

  if (!service) {
    return <div className="animate-pulse h-96 rounded bg-secondary" />;
  }

  const p = service.provider.studentProfile;
  const rating = stubRating(service.id);

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <Link
        href="/dashboard/freelance"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ChevronLeft className="h-4 w-4" /> All services
      </Link>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        {/* Main column */}
        <div className="space-y-6">
          <div>
            <Badge variant="outline" className="capitalize">
              {service.category.replace('_', ' ')}
            </Badge>
            <h1 className="mt-2 text-3xl font-semibold">{service.title}</h1>
            <div className="mt-2 flex items-center gap-3 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                <span className="text-foreground font-medium">{rating.score.toFixed(1)}</span>
                <span>({rating.count} reviews)</span>
              </span>
              <span>·</span>
              <span className="flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5" />
                {service.isRemote ? 'Remote' : (service.location ?? '—')}
              </span>
            </div>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">About this service</CardTitle>
            </CardHeader>
            <CardContent className="text-sm leading-relaxed whitespace-pre-wrap">
              {service.description}
            </CardContent>
          </Card>

          {service.skills.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Skills used</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {service.skills.map((s) => (
                    <Badge key={s} variant="secondary">
                      {s}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Side column — provider card + booking */}
        <div className="space-y-4">
          {/* Price + contact */}
          <Card>
            <CardContent className="p-5 space-y-3">
              {service.priceFrom != null && (
                <div>
                  <div className="text-xs uppercase tracking-wider text-muted-foreground">From</div>
                  <div className="mt-1 text-3xl font-semibold">₹{service.priceFrom}</div>
                  <div className="text-xs text-muted-foreground">
                    per {service.priceUnit ?? 'project'}
                  </div>
                </div>
              )}
              <Button className="w-full" onClick={() => setShowInquiry(true)} disabled={!token}>
                <MessageCircle className="h-4 w-4" /> Send inquiry
              </Button>
              {!token && (
                <p className="text-[10px] text-muted-foreground text-center">Sign in to inquire.</p>
              )}
            </CardContent>
          </Card>

          {/* Provider card */}
          {p && (
            <Card>
              <CardContent className="p-5 space-y-3 text-center">
                {p.avatarUrl ? (
                  <img
                    src={p.avatarUrl}
                    alt=""
                    className="h-20 w-20 rounded-full object-cover mx-auto"
                  />
                ) : (
                  <div className="h-20 w-20 rounded-full bg-secondary mx-auto flex items-center justify-center text-xl font-semibold">
                    {p.fullName
                      .split(' ')
                      .map((s) => s[0])
                      .slice(0, 2)
                      .join('')
                      .toUpperCase()}
                  </div>
                )}
                <div>
                  <div className="font-semibold">{p.fullName}</div>
                  {p.headline && <div className="text-xs text-muted-foreground">{p.headline}</div>}
                </div>
                {service.provider.institution && (
                  <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground">
                    <GraduationCap className="h-3.5 w-3.5" />
                    {service.provider.institution.name}
                  </div>
                )}
                <div className="flex justify-center gap-2 pt-2">
                  {p.githubUrl && (
                    <a
                      href={p.githubUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-muted-foreground hover:text-foreground"
                    >
                      <Github className="h-4 w-4" />
                    </a>
                  )}
                  {p.linkedinUrl && (
                    <a
                      href={p.linkedinUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-muted-foreground hover:text-foreground"
                    >
                      <Linkedin className="h-4 w-4" />
                    </a>
                  )}
                  {p.portfolioUrl && (
                    <a
                      href={p.portfolioUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-muted-foreground hover:text-foreground"
                    >
                      <Globe className="h-4 w-4" />
                    </a>
                  )}
                </div>
                <Link
                  href={`/u/${p.sharableSlug}`}
                  className="block text-xs text-primary hover:underline pt-2 border-t"
                >
                  View full portfolio →
                </Link>
              </CardContent>
            </Card>
          )}

          {/* Verified skills */}
          {service.provider.userSkills.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Verified skills</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {service.provider.userSkills.map((s) => (
                  <div key={s.id} className="flex items-center justify-between text-xs">
                    <span>{s.skill.name}</span>
                    <Badge variant="success">{s.highestVerificationLayer.replace('_', ' ')}</Badge>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Inquiry modal */}
      {showInquiry && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <Card className="w-full max-w-lg">
            <CardHeader>
              <CardTitle className="text-base">Send inquiry — {service.title}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <div className="mb-1 text-xs font-medium text-muted-foreground">
                  Project brief <span className="text-destructive">*</span>
                </div>
                <textarea
                  className="flex min-h-[120px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm"
                  placeholder="What you need, deliverables, references, any specifics…"
                  value={brief}
                  onChange={(e) => setBrief(e.target.value)}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <div className="mb-1 text-xs font-medium text-muted-foreground">Budget (₹)</div>
                  <Input
                    type="number"
                    placeholder="Optional"
                    value={budget}
                    onChange={(e) => setBudget(e.target.value)}
                  />
                </div>
                <div>
                  <div className="mb-1 text-xs font-medium text-muted-foreground">Needed by</div>
                  <Input
                    type="date"
                    value={deadline}
                    onChange={(e) => setDeadline(e.target.value)}
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" onClick={() => setShowInquiry(false)}>
                  Cancel
                </Button>
                <Button
                  onClick={() => inquire.mutate()}
                  disabled={inquire.isPending || brief.trim().length < 10}
                >
                  Send inquiry
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
