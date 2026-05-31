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
  shareTheme: string;
  shareSectionsOrder: string[];
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

// Theme tokens applied to the page root + header. Background, text, and
// accents change; layout / cards stay identical.
const THEMES: Record<
  string,
  { bg: string; text: string; muted: string; cardBg: string; accent: string }
> = {
  default: {
    bg: 'bg-background',
    text: 'text-foreground',
    muted: 'text-muted-foreground',
    cardBg: '',
    accent: 'text-primary',
  },
  midnight: {
    bg: 'bg-slate-950 text-slate-100',
    text: 'text-slate-100',
    muted: 'text-slate-400',
    cardBg: 'bg-slate-900/60 border-slate-800',
    accent: 'text-emerald-400',
  },
  minimal: {
    bg: 'bg-white text-zinc-900',
    text: 'text-zinc-900',
    muted: 'text-zinc-500',
    cardBg: 'bg-white border-zinc-200',
    accent: 'text-zinc-900',
  },
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

  const theme = THEMES[profile.shareTheme] ?? THEMES.default;
  const sectionOrder = profile.shareSectionsOrder?.length
    ? profile.shareSectionsOrder
    : ['about', 'skills', 'projects', 'certifications'];

  // Render each section into a map so we can output them in any order.
  const sections: Record<string, React.ReactNode> = {
    about: profile.bio ? (
      <section key="about" className="mt-10">
        <h2 className="text-xl font-semibold">About</h2>
        <p className={`mt-2 text-sm leading-relaxed ${theme.muted}`}>{profile.bio}</p>
      </section>
    ) : null,
    skills: (
      <section key="skills" className="mt-10">
        <h2 className="text-xl font-semibold">Verified skills</h2>
        {skillsByLayer.length === 0 ? (
          <p className={`mt-2 text-sm ${theme.muted}`}>No verified skills yet.</p>
        ) : (
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {skillsByLayer.map((s) => {
              const meta = LAYER_LABEL[s.highestVerificationLayer] ?? LAYER_LABEL.L0_UNVERIFIED;
              return (
                <div
                  key={s.id}
                  className={`flex items-center justify-between rounded-lg border p-3 ${theme.cardBg}`}
                >
                  <div>
                    <div className="font-medium">{s.skill.name}</div>
                    <div className={`text-xs ${theme.muted}`}>{s.skill.category}</div>
                  </div>
                  <Badge variant={meta.variant}>{meta.label}</Badge>
                </div>
              );
            })}
          </div>
        )}
      </section>
    ),
    projects: (
      <section key="projects" className="mt-10">
        <h2 className="text-xl font-semibold">Projects</h2>
        {profile.user.projects.length === 0 ? (
          <p className={`mt-2 text-sm ${theme.muted}`}>No projects yet.</p>
        ) : (
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            {profile.user.projects.map((p) => (
              <Card key={p.id} className={theme.cardBg}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <GitBranch className={`h-4 w-4 ${theme.accent}`} />
                    {p.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {p.description && <p className={`text-sm ${theme.muted}`}>{p.description}</p>}
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
                          className={`inline-flex items-center gap-1 ${theme.accent} hover:underline`}
                          href={p.repoUrl}
                          target="_blank"
                          rel="noreferrer"
                        >
                          Code <ExternalLink className="h-3 w-3" />
                        </a>
                      )}
                      {p.liveUrl && (
                        <a
                          className={`inline-flex items-center gap-1 ${theme.accent} hover:underline`}
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
    ),
    certifications: (
      <section key="certifications" className="mt-10">
        <h2 className="text-xl font-semibold">Certifications</h2>
        {profile.user.certifications.length === 0 ? (
          <p className={`mt-2 text-sm ${theme.muted}`}>No verified certifications yet.</p>
        ) : (
          <ul className="mt-4 space-y-2">
            {profile.user.certifications.map((c) => (
              <li
                key={c.id}
                className={`flex items-center justify-between rounded-lg border p-3 text-sm ${theme.cardBg}`}
              >
                <span className="inline-flex items-center gap-2">
                  <Award className={`h-4 w-4 ${theme.accent}`} />
                  <span className="font-medium">{c.courseName}</span>
                  <span className={theme.muted}>· {c.issuer}</span>
                </span>
                <Badge
                  variant={
                    c.tier === 'TIER_1' ? 'success' : c.tier === 'TIER_2' ? 'default' : 'secondary'
                  }
                >
                  {c.tier.replace('_', ' ')}
                </Badge>
              </li>
            ))}
          </ul>
        )}
      </section>
    ),
  };

  return (
    <main className={`min-h-screen ${theme.bg}`}>
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
              <p className={`mt-1 text-lg ${theme.muted}`}>{profile.headline}</p>
            )}
            <div className={`mt-3 flex flex-wrap items-center gap-3 text-sm ${theme.muted}`}>
              {profile.user.institution && (
                <span className="inline-flex items-center gap-1">
                  <GraduationCap className="h-4 w-4" /> {profile.user.institution.name}
                </span>
              )}
              {profile.cgpa != null && <span>CGPA · {profile.cgpa.toFixed(2)}</span>}
              {profile.graduationYear && <span>Class of {profile.graduationYear}</span>}
              {profile.location && <span>{profile.location}</span>}
            </div>
          </div>
        </div>

        {/* Sections rendered in the user-configured order */}
        {sectionOrder.map((key) => sections[key])}

        <footer className={`mt-16 border-t pt-6 text-center text-xs ${theme.muted}`}>
          <Link href="/" className="hover:underline">
            Verified on SkillVerify
          </Link>
        </footer>
      </div>
    </main>
  );
}
