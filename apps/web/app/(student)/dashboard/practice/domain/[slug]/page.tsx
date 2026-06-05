'use client';

import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { api } from '@/lib/api';
import { ChevronLeft, CheckCircle2 } from 'lucide-react';

type DomainDetail = {
  slug: string;
  name: string;
  total: number;
  problems: {
    id: string;
    title: string;
    slug: string;
    difficulty: string;
    topics: string[];
    points: number;
  }[];
};

export default function DomainProblemsPage({ params }: { params: { slug: string } }) {
  const { data: session } = useSession();

  const token = session?.accessToken as string | undefined;

  const { data } = useQuery({
    queryKey: ['domain', params.slug],
    queryFn: () => api<DomainDetail>(`/practice/domains/${params.slug}?pageSize=200`),
  });

  const { data: solved } = useQuery({
    enabled: !!token,
    queryKey: ['practice.solved'],
    queryFn: () => api<string[]>('/practice/me/solved', { token }),
  });
  const solvedSet = new Set(solved ?? []);

  const solvedHere = data?.problems.filter((p) => solvedSet.has(p.slug)).length ?? 0;
  const totalHere = data?.problems.length ?? 0;
  const pct = totalHere > 0 ? Math.round((solvedHere / totalHere) * 100) : 0;

  // Group by section/topic — first topic doubles as section name in the curriculum.
  type Problem = DomainDetail['problems'][number];
  const sections = new Map<string, Problem[]>();
  for (const p of data?.problems ?? []) {
    const section = p.topics[0] ?? 'Other';
    if (!sections.has(section)) sections.set(section, []);
    sections.get(section)!.push(p);
  }

  return (
    <div className="space-y-4">
      <Link
        href="/dashboard/practice"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ChevronLeft className="h-4 w-4" /> All domains
      </Link>
      <div>
        <h1 className="text-2xl font-semibold">{data?.name ?? '…'}</h1>
        <p className="text-sm text-muted-foreground">
          {totalHere} problems
          {token && solved && (
            <>
              {' · '}
              <span className="text-foreground font-medium">{solvedHere} solved</span> ({pct}%)
            </>
          )}
        </p>
        {token && solved && totalHere > 0 && (
          <div className="mt-2 h-1.5 max-w-md rounded-full bg-secondary overflow-hidden">
            <div
              className={`h-full transition-all ${
                solvedHere === totalHere ? 'bg-emerald-500' : 'bg-primary'
              }`}
              style={{ width: `${pct}%` }}
            />
          </div>
        )}
      </div>

      {sections.size === 0 ? (
        <Card>
          <CardContent className="p-6 text-sm text-muted-foreground text-center">
            No problems in this domain yet.
          </CardContent>
        </Card>
      ) : (
        [...sections.entries()].map(([section, problems]) => {
          const solvedInSection = problems.filter((p) => solvedSet.has(p.slug)).length;
          return (
            <div key={section} className="space-y-2">
              <div className="flex items-center justify-between text-sm font-semibold mt-4">
                <span>{section}</span>
                {token && solved && (
                  <span className="text-xs font-normal text-muted-foreground">
                    {solvedInSection} / {problems.length}
                  </span>
                )}
              </div>
              <Card>
                <CardContent className="p-0">
                  <ul className="divide-y">
                    {problems.map((p) => {
                      const isSolved = solvedSet.has(p.slug);
                      return (
                        <li key={p.id}>
                          <Link
                            href={`/dashboard/practice/${p.slug}`}
                            className="flex items-center justify-between px-6 py-3 hover:bg-secondary/40"
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              {isSolved ? (
                                <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                              ) : (
                                <span className="h-4 w-4 rounded-full border border-muted-foreground/30 shrink-0" />
                              )}
                              <div className="min-w-0">
                                <div
                                  className={`font-medium truncate ${
                                    isSolved ? 'text-muted-foreground' : ''
                                  }`}
                                >
                                  {p.title}
                                </div>
                                <div className="text-xs text-muted-foreground truncate">
                                  {p.topics.slice(1).join(' · ')}
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 shrink-0 ml-3">
                              <Badge
                                variant={
                                  p.difficulty === 'easy'
                                    ? 'success'
                                    : p.difficulty === 'medium'
                                      ? 'default'
                                      : 'warning'
                                }
                              >
                                {p.difficulty}
                              </Badge>
                              <span className="text-xs text-muted-foreground tabular-nums">
                                {p.points} pts
                              </span>
                            </div>
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                </CardContent>
              </Card>
            </div>
          );
        })
      )}
    </div>
  );
}
