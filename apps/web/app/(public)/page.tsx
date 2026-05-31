import Link from 'next/link';
import dynamic from 'next/dynamic';
import { Button } from '@/components/ui/button';
import {
  ShieldCheck,
  Sparkles,
  GraduationCap,
  Github,
  Code2,
  Trophy,
  Award,
  Briefcase,
  Search,
  Users,
  ArrowRight,
  Building2,
  BookOpen,
  Brain,
  FileCheck,
  Zap,
} from 'lucide-react';

// The 3D scene is dynamically imported with SSR off because Three.js touches
// window/document on first paint. The Suspense boundary inside also makes
// sure the marketing copy isn't blocked on shader compilation.
const LandingHero3D = dynamic(
  () => import('@/components/landing-hero-3d').then((m) => m.LandingHero3D),
  { ssr: false },
);

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-background overflow-x-hidden">
      {/* ============ NAV ============ */}
      <header className="sticky top-0 z-30 border-b bg-background/80 backdrop-blur">
        <div className="container flex h-14 items-center justify-between">
          <Link href="/" className="inline-flex items-center gap-2 font-semibold text-lg">
            <div className="grid place-items-center h-7 w-7 rounded-md bg-primary text-primary-foreground">
              <Zap className="h-4 w-4" />
            </div>
            SkillVerify
          </Link>
          <nav className="flex items-center gap-2">
            <Link href="/login">
              <Button variant="ghost" size="sm">
                Sign in
              </Button>
            </Link>
            <Link href="/signup">
              <Button size="sm">Get started</Button>
            </Link>
          </nav>
        </div>
      </header>

      {/* ============ HERO (3D) ============ */}
      <section className="relative min-h-[88vh] flex items-center overflow-hidden">
        {/* Gradient background washes */}
        <div className="absolute inset-0 -z-20 bg-gradient-to-br from-emerald-50 via-background to-primary/5 dark:from-emerald-950/20 dark:via-background dark:to-primary/10" />
        <div className="absolute -top-40 -right-32 -z-10 h-[500px] w-[500px] rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute -bottom-40 -left-32 -z-10 h-[500px] w-[500px] rounded-full bg-emerald-200/40 blur-3xl dark:bg-emerald-900/20" />

        <LandingHero3D />

        <div className="container relative grid lg:grid-cols-2 gap-12 items-center py-20 md:py-28">
          <div>
            <p className="mb-4 inline-flex items-center gap-2 rounded-full border bg-background/70 px-3 py-1 text-xs backdrop-blur">
              <Sparkles className="h-3.5 w-3.5 text-primary" />
              Verified Skill Portfolio
            </p>
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight leading-[1.05]">
              Upskill. <span className="text-emerald-600 dark:text-emerald-400">Get Verified.</span>{' '}
              Get Deployed.
            </h1>
            <p className="mt-6 text-lg text-muted-foreground max-w-xl">
              Build an institutionally-verified digital portfolio. Practice, compete, and connect
              with companies for hiring and freelance.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/signup">
                <Button size="lg" className="gap-2">
                  Build Your Vault <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <a href="#how">
                <Button size="lg" variant="outline">
                  How It Works
                </Button>
              </a>
            </div>
          </div>
          {/* Right column intentionally empty — 3D scene fills it */}
          <div className="hidden lg:block" />
        </div>
      </section>

      {/* ============ STATS STRIP ============ */}
      <section className="border-y bg-secondary/30">
        <div className="container grid grid-cols-2 md:grid-cols-4 gap-6 py-8 text-center">
          <Stat number="1700+" label="Practice Problems" />
          <Stat number="17" label="Domains" />
          <Stat number="500+" label="Colleges" />
          <Stat number="4-Layer" label="Verification" />
        </div>
      </section>

      {/* ============ 4-LAYER VERIFICATION ============ */}
      <section id="how" className="container py-20">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <h2 className="text-3xl md:text-4xl font-bold">4-Layer Verification</h2>
          <p className="mt-3 text-muted-foreground">
            From academic baseline to market-ready expertise. Each skill goes through progressive
            verification.
          </p>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <LayerCard
            level="L1"
            color="text-blue-600 dark:text-blue-400"
            border="border-t-blue-500"
            icon={GraduationCap}
            title="Academic"
            body="Verified via institutional records, SGPA / CGPA thresholds, core course completion."
          />
          <LayerCard
            level="L2"
            color="text-amber-600 dark:text-amber-400"
            border="border-t-amber-500"
            icon={Award}
            title="Certified"
            body="API / Serial verification from tiered providers. Google, AWS (Tier 1) to Coursera (Tier 2)."
          />
          <LayerCard
            level="L3"
            color="text-emerald-600 dark:text-emerald-400"
            border="border-t-emerald-500"
            icon={Github}
            title="Proof-of-Work"
            body="GitHub repos, hackathon results, live URLs, freelance earnings as tangible proof."
          />
          <LayerCard
            level="L4"
            color="text-violet-600 dark:text-violet-400"
            border="border-t-violet-500"
            icon={Users}
            title="Expert Screen"
            body="Panel interview by domain experts. Validates depth, communication, problem-solving."
          />
        </div>
      </section>

      {/* ============ EVERYTHING YOU NEED ============ */}
      <section className="container py-20">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <h2 className="text-3xl md:text-4xl font-bold">Everything you need</h2>
          <p className="mt-3 text-muted-foreground">
            One platform for skills, verification, and deployment.
          </p>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Feature
            icon={ShieldCheck}
            iconClass="bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300"
            title="4-Layer Verification"
            body="Progressive verification from academic baseline to expert screening."
          />
          <Feature
            icon={Code2}
            iconClass="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300"
            title="Practice Arena"
            body="1700+ problems across 17 domains with Monaco code editor."
          />
          <Feature
            icon={Trophy}
            iconClass="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300"
            title="Competitions"
            body="Case studies, hackathons, video editing, marketing challenges."
          />
          <Feature
            icon={Users}
            iconClass="bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300"
            title="Community"
            body="Inter-institute networking, discussions, portfolio sharing."
          />
          <Feature
            icon={Brain}
            iconClass="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300"
            title="AI Analysis"
            body="AI-powered skill extraction, career recommendations, code review."
          />
          <Feature
            icon={Briefcase}
            iconClass="bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300"
            title="Freelance & Jobs"
            body="Verified talent marketplace with L3 / L4 recruiter matching."
          />
        </div>
      </section>

      {/* ============ INTEGRATION ECOSYSTEM ============ */}
      <section className="container py-20 border-t">
        <div className="flex flex-wrap items-end justify-between gap-4 mb-10">
          <div>
            <h2 className="text-3xl md:text-4xl font-bold">Integration Ecosystem</h2>
            <p className="mt-2 text-muted-foreground">
              Unified data ingestion from trusted sources.
            </p>
          </div>
          <div className="flex flex-wrap gap-3 text-xs">
            <LegendDot color="bg-blue-500" label="OAuth" />
            <LegendDot color="bg-emerald-500" label="Public API" />
            <LegendDot color="bg-orange-500" label="Scraping" />
            <LegendDot color="bg-violet-500" label="Upload" />
          </div>
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <IntegrationColumn
            title="Coding & Tech"
            accent="border-t-orange-500"
            items={[
              {
                name: 'GitHub',
                desc: 'Repos, commits, stars, contributions',
                tag: 'API',
                tagColor: 'bg-emerald-100 text-emerald-700',
              },
              {
                name: 'LeetCode',
                desc: 'Problems solved, contest rating, badges',
                tag: 'SCRAPE',
                tagColor: 'bg-orange-100 text-orange-700',
              },
              {
                name: 'HackerRank',
                desc: 'Skill tests, contest ranks, tracks',
                tag: 'API',
                tagColor: 'bg-emerald-100 text-emerald-700',
              },
            ]}
          />
          <IntegrationColumn
            title="Professional"
            accent="border-t-blue-500"
            items={[
              {
                name: 'LinkedIn',
                desc: 'Work history, endorsements, skills',
                tag: 'OAUTH',
                tagColor: 'bg-blue-100 text-blue-700',
              },
              {
                name: 'Resume',
                desc: 'PDF parsing for baseline skills',
                tag: 'UPLOAD',
                tagColor: 'bg-violet-100 text-violet-700',
              },
              {
                name: 'Unstop',
                desc: 'Hackathon wins, case competition ranks',
                tag: 'API',
                tagColor: 'bg-emerald-100 text-emerald-700',
              },
            ]}
          />
          <IntegrationColumn
            title="Certifications"
            accent="border-t-violet-500"
            items={[
              {
                name: 'Coursera / edX',
                desc: 'Course completion, grades',
                tag: 'API',
                tagColor: 'bg-emerald-100 text-emerald-700',
              },
              {
                name: 'AWS / Google',
                desc: 'Cloud certs, badge validity',
                tag: 'API',
                tagColor: 'bg-emerald-100 text-emerald-700',
              },
              {
                name: 'NPTEL',
                desc: 'Exam scores, elite tags, credits',
                tag: 'SCRAPE',
                tagColor: 'bg-orange-100 text-orange-700',
              },
            ]}
          />
          <IntegrationColumn
            title="Institutional"
            accent="border-t-emerald-500"
            items={[
              {
                name: 'DigiLocker / NAD',
                desc: 'Academic records, degree verification',
                tag: 'API',
                tagColor: 'bg-emerald-100 text-emerald-700',
              },
              {
                name: 'LMS (Moodle)',
                desc: 'Assessments, attendance, feedback',
                tag: 'API',
                tagColor: 'bg-emerald-100 text-emerald-700',
              },
              {
                name: 'College ID',
                desc: 'Image / PDF upload with AI screen',
                tag: 'UPLOAD',
                tagColor: 'bg-violet-100 text-violet-700',
              },
            ]}
          />
        </div>
        <div className="mt-10 flex justify-center">
          <div className="inline-flex items-center gap-2 rounded-full bg-foreground px-5 py-2 text-sm font-semibold text-background">
            <FileCheck className="h-4 w-4" />
            SCCTS Central Verification Engine
          </div>
        </div>
      </section>

      {/* ============ BUILT FOR EVERYONE ============ */}
      <section className="container py-20 border-t">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <h2 className="text-3xl md:text-4xl font-bold">Built for everyone</h2>
          <p className="mt-3 text-muted-foreground">
            Serving the complete education-to-employment ecosystem.
          </p>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <AudienceCard
            border="border-l-violet-500"
            icon={GraduationCap}
            title="Students"
            body="Build one verified portfolio that replaces scattered profiles across platforms."
          />
          <AudienceCard
            border="border-l-blue-500"
            icon={Building2}
            title="Institutions"
            body="Track student competencies, boost placement stats, earn NAAC accreditation."
          />
          <AudienceCard
            border="border-l-emerald-500"
            icon={Search}
            title="Recruiters"
            body="Search by verified skill levels. Skip 80% of initial screening."
          />
          <AudienceCard
            border="border-l-amber-500"
            icon={BookOpen}
            title="Faculty"
            body="Recognize projects, map proof-of-work to credits, reduce manual checks."
          />
        </div>
      </section>

      {/* ============ FOR RECRUITERS ============ */}
      <section className="bg-secondary/40 border-y">
        <div className="container py-20">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-3xl md:text-4xl font-bold">For Recruiters</h2>
            <p className="mt-3 text-muted-foreground">
              Pre-screened talent with verified skills. Hire faster, hire better.
            </p>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            <RecruiterCard
              border="border-t-emerald-500"
              icon={Search}
              title="Search by Verified Level"
              body="Filter candidates by L3 (Intern-Ready) or L4 (Market-Ready). Every skill backed by proof."
            />
            <RecruiterCard
              border="border-t-violet-500"
              icon={Briefcase}
              title="Direct Hiring Pipeline"
              body="Post openings directly. Our verification replaces 80% of initial screening."
            />
            <RecruiterCard
              border="border-t-amber-500"
              icon={Award}
              title="Freelance Matching"
              body="Match with verified freelancers by skill, domain, and proof-of-work."
            />
          </div>
        </div>
      </section>

      {/* ============ FINAL CTA ============ */}
      <section className="container py-24 text-center">
        <h2 className="text-3xl md:text-5xl font-bold">Ready to vault your skills?</h2>
        <p className="mt-3 text-muted-foreground max-w-md mx-auto">
          Join students building verified digital portfolios.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link href="/signup">
            <Button size="lg" className="gap-2">
              Get Started Free <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
          <Link href="/login">
            <Button size="lg" variant="outline">
              For Institutions
            </Button>
          </Link>
        </div>
      </section>

      {/* ============ FOOTER ============ */}
      <footer className="border-t">
        <div className="container grid grid-cols-1 md:grid-cols-3 gap-4 py-6 text-xs text-muted-foreground items-center">
          <div className="flex items-center gap-2 font-semibold text-foreground">
            <div className="grid place-items-center h-6 w-6 rounded-md bg-primary text-primary-foreground">
              <Zap className="h-3.5 w-3.5" />
            </div>
            SkillVerify
          </div>
          <div className="text-center">© SkillVerify · early access</div>
          <div className="md:text-right">Skill Credit &amp; Competency Transcript System</div>
        </div>
      </footer>
    </main>
  );
}

// ---------- presentational subcomponents ----------

function Stat({ number, label }: { number: string; label: string }) {
  return (
    <div>
      <div className="text-2xl md:text-3xl font-bold">{number}</div>
      <div className="text-xs text-muted-foreground uppercase tracking-wider">{label}</div>
    </div>
  );
}

function LayerCard({
  level,
  color,
  border,
  icon: Icon,
  title,
  body,
}: {
  level: string;
  color: string;
  border: string;
  icon: typeof Sparkles;
  title: string;
  body: string;
}) {
  return (
    <div
      className={`rounded-xl border ${border} border-t-4 bg-card p-6 hover:shadow-lg hover:-translate-y-0.5 transition`}
    >
      <div className={`text-4xl font-bold ${color}`}>{level}</div>
      <div className="mt-2 flex items-center gap-2">
        <Icon className="h-4 w-4 text-muted-foreground" />
        <h3 className="font-semibold">{title}</h3>
      </div>
      <p className="mt-3 text-sm text-muted-foreground">{body}</p>
    </div>
  );
}

function Feature({
  icon: Icon,
  iconClass,
  title,
  body,
}: {
  icon: typeof Sparkles;
  iconClass: string;
  title: string;
  body: string;
}) {
  return (
    <div className="rounded-xl border bg-card p-6 hover:border-primary/40 transition">
      <div className={`grid place-items-center h-10 w-10 rounded-lg ${iconClass}`}>
        <Icon className="h-5 w-5" />
      </div>
      <h3 className="mt-4 font-semibold">{title}</h3>
      <p className="mt-1 text-sm text-muted-foreground">{body}</p>
    </div>
  );
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-1.5 text-muted-foreground">
      <span className={`h-2 w-2 rounded-full ${color}`} />
      {label}
    </div>
  );
}

function IntegrationColumn({
  title,
  accent,
  items,
}: {
  title: string;
  accent: string;
  items: { name: string; desc: string; tag: string; tagColor: string }[];
}) {
  return (
    <div className="space-y-3">
      <div className={`pb-2 border-b-2 ${accent} font-semibold`}>{title}</div>
      {items.map((it) => (
        <div
          key={it.name}
          className="rounded-lg border bg-card p-4 hover:border-primary/40 transition"
        >
          <div className="flex items-center justify-between">
            <div className="font-semibold text-sm">{it.name}</div>
            <span className={`rounded px-1.5 py-0.5 text-[10px] font-semibold ${it.tagColor}`}>
              {it.tag}
            </span>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">{it.desc}</p>
        </div>
      ))}
    </div>
  );
}

function AudienceCard({
  border,
  icon: Icon,
  title,
  body,
}: {
  border: string;
  icon: typeof Sparkles;
  title: string;
  body: string;
}) {
  return (
    <div className={`rounded-xl border border-l-4 ${border} bg-card p-6`}>
      <div className="flex items-center gap-2">
        <Icon className="h-4 w-4 text-muted-foreground" />
        <h3 className="font-semibold">{title}</h3>
      </div>
      <p className="mt-2 text-sm text-muted-foreground">{body}</p>
    </div>
  );
}

function RecruiterCard({
  border,
  icon: Icon,
  title,
  body,
}: {
  border: string;
  icon: typeof Sparkles;
  title: string;
  body: string;
}) {
  return (
    <div className={`rounded-xl border border-t-4 ${border} bg-background p-6`}>
      <Icon className="h-5 w-5 text-muted-foreground" />
      <h3 className="mt-3 font-semibold">{title}</h3>
      <p className="mt-2 text-sm text-muted-foreground">{body}</p>
    </div>
  );
}
