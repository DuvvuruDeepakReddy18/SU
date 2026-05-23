import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { api } from '@/lib/api';
import { GraduationCap, GitBranch, Award, ExternalLink } from 'lucide-react';

type Profile = {
  fullName: string;
  headline: string | null;
  bio: string | null;
  avatarUrl: string | null;
  cgpa: number | null;
  graduationYear: number | null;
  location: string | null;
  isPublic: boolean;
  user: {
    institution: { name: string } | null;
    userSkills: {
      id: string;
      selfRatedLevel: number;
      highestVerificationLayer: string;
      skill: { name: string; category: string };
    }[];
    projects: {
      id: string;
      title: string;
      description: string | null;
      repoUrl: string | null;
      liveUrl: string | null;
      techStack: string[];
      stars: number;
    }[];
    certifications: { id: string; issuer: string; courseName: string; tier: string }[];
  };
};

async function fetchProfile(slug: string): Promise<Profile | null> {
  try {
    return await api<Profile>(`/profile/public/${encodeURIComponent(slug)}`);
  } catch {
    return null;
  }
}

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const profile = await fetchProfile(params.slug);
  if (!profile) return { title: 'Profile not found' };
  return {
    title: `${profile.fullName} — Verified Skill Portfolio`,
    description: profile.headline ?? profile.bio ?? `${profile.fullName} on SkillVerify`,
    openGraph: {
      title: `${profile.fullName} — SkillVerify`,
      description: profile.headline ?? '',
      type: 'profile',
      images: profile.avatarUrl ? [{ url: profile.avatarUrl }] : [],
    },
    twitter: { card: 'summary', title: profile.fullName, description: profile.headline ?? '' },
  };
}

const LAYER_LABEL: Record<
  string,
  { label: string; variant: 'default' | 'success' | 'secondary' | 'warning' }
> = {
  L0_UNVERIFIED: { label: 'Unverified', variant: 'secondary' },
  L1_ACADEMIC: { label: 'L1 · Academic', variant: 'warning' },
  L2_CERTIFIED: { label: 'L2 · Certified', variant: 'default' },
  L3_PROVEN: { label: 'L3 · Proven', variant: 'success' },
  L4_EXPERT: { label: 'L4 · Expert', variant: 'success' },
};

export default async function PublicPortfolio({ params }: { params: { slug: string } }) {
  const profile = await fetchProfile(params.slug);
  if (!profile) notFound();

  const skillsByLayer = [...profile.user.userSkills].sort((a, b) =>
    a.highestVerificationLayer < b.highestVerificationLayer ? 1 : -1,
  );

  return (
    <main className="min-h-screen bg-background">
      <div className="container max-w-5xl py-12">
        <div className="flex items-start gap-6 border-b pb-8">
          <div className="h-24 w-24 shrink-0 rounded-full bg-secondary flex items-center justify-center text-2xl font-semibold">
            {profile.avatarUrl ? (
              <img
                src={profile.avatarUrl}
                alt={profile.fullName}
                className="h-24 w-24 rounded-full object-cover"
              />
            ) : (
              profile.fullName
                .split(' ')
                .map((n) => n[0])
                .slice(0, 2)
                .join('')
            )}
          </div>
          <div className="flex-1">
            <h1 className="text-3xl font-semibold">{profile.fullName}</h1>
            {profile.headline && (
              <p className="mt-1 text-lg text-muted-foreground">{profile.headline}</p>
            )}
            <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
              {profile.user.institution && (
                <span className="inline-flex items-center gap-1">
                  <GraduationCap className="h-4 w-4" /> {profile.user.institution.name}
                </span>
              )}
              {profile.cgpa != null && <span>CGPA · {profile.cgpa.toFixed(2)}</span>}
              {profile.graduationYear && <span>Class of {profile.graduationYear}</span>}
              {profile.location && <span>{profile.location}</span>}
            </div>
            {profile.bio && <p className="mt-4 text-sm leading-relaxed">{profile.bio}</p>}
          </div>
        </div>

        <section className="mt-10">
          <h2 className="text-xl font-semibold">Verified skills</h2>
          {skillsByLayer.length === 0 ? (
            <p className="mt-2 text-sm text-muted-foreground">No verified skills yet.</p>
          ) : (
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              {skillsByLayer.map((s) => {
                const meta = LAYER_LABEL[s.highestVerificationLayer] ?? LAYER_LABEL.L0_UNVERIFIED;
                return (
                  <div
                    key={s.id}
                    className="flex items-center justify-between rounded-lg border p-3"
                  >
                    <div>
                      <div className="font-medium">{s.skill.name}</div>
                      <div className="text-xs text-muted-foreground">{s.skill.category}</div>
                    </div>
                    <Badge variant={meta.variant}>{meta.label}</Badge>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        <section className="mt-10">
          <h2 className="text-xl font-semibold">Projects</h2>
          {profile.user.projects.length === 0 ? (
            <p className="mt-2 text-sm text-muted-foreground">No projects yet.</p>
          ) : (
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              {profile.user.projects.map((p) => (
                <Card key={p.id}>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                      <GitBranch className="h-4 w-4 text-primary" />
                      {p.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {p.description && (
                      <p className="text-sm text-muted-foreground">{p.description}</p>
                    )}
                    {p.techStack.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-1">
                        {p.techStack.slice(0, 6).map((t) => (
                          <Badge key={t} variant="outline">
                            {t}
                          </Badge>
                        ))}
                      </div>
                    )}
                    {(p.repoUrl || p.liveUrl) && (
                      <div className="mt-3 flex gap-3 text-sm">
                        {p.repoUrl && (
                          <a
                            className="inline-flex items-center gap-1 text-primary hover:underline"
                            href={p.repoUrl}
                            target="_blank"
                            rel="noreferrer"
                          >
                            Code <ExternalLink className="h-3 w-3" />
                          </a>
                        )}
                        {p.liveUrl && (
                          <a
                            className="inline-flex items-center gap-1 text-primary hover:underline"
                            href={p.liveUrl}
                            target="_blank"
                            rel="noreferrer"
                          >
                            Live <ExternalLink className="h-3 w-3" />
                          </a>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </section>

        <section className="mt-10">
          <h2 className="text-xl font-semibold">Certifications</h2>
          {profile.user.certifications.length === 0 ? (
            <p className="mt-2 text-sm text-muted-foreground">No verified certifications yet.</p>
          ) : (
            <ul className="mt-4 space-y-2">
              {profile.user.certifications.map((c) => (
                <li
                  key={c.id}
                  className="flex items-center justify-between rounded-lg border p-3 text-sm"
                >
                  <span className="inline-flex items-center gap-2">
                    <Award className="h-4 w-4 text-primary" />
                    <span className="font-medium">{c.courseName}</span>
                    <span className="text-muted-foreground">· {c.issuer}</span>
                  </span>
                  <Badge
                    variant={
                      c.tier === 'TIER_1'
                        ? 'success'
                        : c.tier === 'TIER_2'
                          ? 'default'
                          : 'secondary'
                    }
                  >
                    {c.tier.replace('_', ' ')}
                  </Badge>
                </li>
              ))}
            </ul>
          )}
        </section>

        <footer className="mt-16 border-t pt-6 text-center text-xs text-muted-foreground">
          <Link href="/" className="hover:underline">
            Verified on SkillVerify
          </Link>
        </footer>
      </div>
    </main>
  );
}
