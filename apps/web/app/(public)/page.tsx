import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { CheckCircle2, ShieldCheck, Sparkles, GraduationCap } from 'lucide-react';

export default function LandingPage() {
  return (
    <main className="min-h-screen">
      <header className="border-b">
        <div className="container flex h-14 items-center justify-between">
          <Link href="/" className="font-semibold text-lg">
            <span className="text-primary">Skill</span>Verify
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

      <section className="container py-20 md:py-28">
        <div className="max-w-3xl">
          <p className="mb-3 inline-flex items-center gap-2 rounded-full border bg-secondary px-3 py-1 text-xs">
            <Sparkles className="h-3.5 w-3.5 text-primary" />
            Built for India&apos;s top engineering &amp; business schools
          </p>
          <h1 className="text-4xl md:text-6xl font-semibold tracking-tight">
            The verified skill portfolio recruiters can actually trust.
          </h1>
          <p className="mt-5 text-lg text-muted-foreground">
            SkillVerify aggregates your academics, certifications, projects, and live expert
            screenings into a single four-layer-verified profile — auto-built from your resume.
          </p>
          <div className="mt-8 flex gap-3">
            <Link href="/signup">
              <Button size="lg">Create your profile</Button>
            </Link>
            <Link href="/u/arjun-mehta">
              <Button size="lg" variant="outline">
                See a sample portfolio
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <section className="container grid gap-6 pb-24 md:grid-cols-4">
        {[
          {
            icon: GraduationCap,
            title: 'L1 · Academic',
            body: 'CGPA and semester records sourced from your institution.',
          },
          {
            icon: ShieldCheck,
            title: 'L2 · Certified',
            body: 'Course completions matched to a curated tier system.',
          },
          {
            icon: CheckCircle2,
            title: 'L3 · Proven',
            body: 'Public GitHub projects linked to the skill you claim.',
          },
          {
            icon: Sparkles,
            title: 'L4 · Expert',
            body: 'Optional paid live screenings with domain experts.',
          },
        ].map(({ icon: Icon, title, body }) => (
          <div key={title} className="rounded-xl border p-5">
            <Icon className="h-6 w-6 text-primary" />
            <h3 className="mt-3 font-semibold">{title}</h3>
            <p className="mt-1 text-sm text-muted-foreground">{body}</p>
          </div>
        ))}
      </section>

      <footer className="border-t py-6">
        <div className="container text-xs text-muted-foreground">© SkillVerify · early access</div>
      </footer>
    </main>
  );
}
