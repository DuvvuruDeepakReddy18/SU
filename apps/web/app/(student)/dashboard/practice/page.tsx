'use client';

import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { api } from '@/lib/api';
import * as Icons from 'lucide-react';
import { CheckCircle2 } from 'lucide-react';

type Domain = {
  id: string;
  slug: string;
  name: string;
  icon: string | null;
  problemCount: number;
};

type DomainProgress = {
  slug: string;
  name: string;
  icon: string | null;
  total: number;
  solved: number;
  nextUnsolved: string[];
};

export default function PracticeDomainsPage() {
  const { data: session } = useSession();

  const token = session?.accessToken as string | undefined;

  const { data: domains } = useQuery({
    queryKey: ['domains'],
    queryFn: () => api<Domain[]>('/practice/domains'),
  });

  // Per-user progress — only fetched when signed in.
  const { data: progress } = useQuery({
    enabled: !!token,
    queryKey: ['practice.progress'],
    queryFn: () => api<DomainProgress[]>('/practice/me/progress', { token }),
  });
  const bySlug = new Map((progress ?? []).map((p) => [p.slug, p]));

  const totalProblems = domains?.reduce((a, d) => a + d.problemCount, 0) ?? 0;
  const totalSolved = progress?.reduce((a, d) => a + d.solved, 0) ?? 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Practice</h1>
        <p className="text-sm text-muted-foreground">
          {totalProblems} curated problems across {domains?.length ?? 0} domains.
          {token && progress && (
            <>
              {' '}
              <span className="text-foreground font-medium">{totalSolved} solved</span> total.
            </>
          )}
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {domains?.map((d) => {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const Icon = ((Icons as any)[d.icon ?? 'Code'] ?? Icons.Code) as React.ComponentType<{
            className?: string;
          }>;
          const p = bySlug.get(d.slug);
          const solved = p?.solved ?? 0;
          const total = d.problemCount;
          const pct = total > 0 ? Math.round((solved / total) * 100) : 0;
          const complete = solved > 0 && solved === total;

          return (
            <Link key={d.id} href={`/dashboard/practice/domain/${d.slug}`} className="block">
              <Card className="hover:border-primary/40 hover:bg-secondary/30 transition relative">
                {complete && (
                  <CheckCircle2 className="absolute top-3 right-3 h-4 w-4 text-emerald-500" />
                )}
                <CardContent className="p-5 space-y-3">
                  <Icon className="h-6 w-6 text-primary" />
                  <div>
                    <div className="font-semibold">{d.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {token && progress ? `${solved} / ${total} solved` : `${total} problems`}
                    </div>
                  </div>
                  {token && progress && total > 0 && (
                    <div className="h-1 rounded-full bg-secondary overflow-hidden">
                      <div
                        className={`h-full transition-all ${
                          complete ? 'bg-emerald-500' : 'bg-primary'
                        }`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  )}
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>

      <Link href="/dashboard/practice/all" className="text-sm text-primary hover:underline">
        Or browse all problems →
      </Link>
    </div>
  );
}
