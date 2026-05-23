'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { api } from '@/lib/api';
import { ChevronLeft } from 'lucide-react';

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
  const { data } = useQuery({
    queryKey: ['domain', params.slug],
    queryFn: () => api<DomainDetail>(`/practice/domains/${params.slug}?pageSize=100`),
  });

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
        <p className="text-sm text-muted-foreground">{data?.total ?? 0} problems</p>
      </div>

      <Card>
        <CardContent className="p-0">
          <ul className="divide-y">
            {data?.problems.map((p) => (
              <li key={p.id}>
                <Link
                  href={`/dashboard/practice/${p.slug}`}
                  className="flex items-center justify-between px-6 py-3 hover:bg-secondary/40"
                >
                  <div>
                    <div className="font-medium">{p.title}</div>
                    <div className="text-xs text-muted-foreground">{p.topics.join(' · ')}</div>
                  </div>
                  <div className="flex items-center gap-2">
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
                    <span className="text-xs text-muted-foreground">{p.points} pts</span>
                  </div>
                </Link>
              </li>
            ))}
            {data?.problems.length === 0 && (
              <li className="p-6 text-sm text-muted-foreground">No problems in this domain yet.</li>
            )}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
