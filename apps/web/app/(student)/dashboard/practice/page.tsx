'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { api } from '@/lib/api';
import * as Icons from 'lucide-react';

type Domain = { id: string; slug: string; name: string; icon: string | null; problemCount: number };

export default function PracticeDomainsPage() {
  const { data } = useQuery({
    queryKey: ['domains'],
    queryFn: () => api<Domain[]>('/practice/domains'),
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Practice</h1>
        <p className="text-sm text-muted-foreground">
          Choose a domain to start practicing. {data?.reduce((a, d) => a + d.problemCount, 0) ?? 0}{' '}
          curated problems across {data?.length ?? 0} domains.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {data?.map((d) => {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const Icon = ((Icons as any)[d.icon ?? 'Code'] ?? Icons.Code) as React.ComponentType<{
            className?: string;
          }>;
          return (
            <Link key={d.id} href={`/dashboard/practice/domain/${d.slug}`} className="block">
              <Card className="hover:border-primary/40 hover:bg-secondary/30 transition">
                <CardContent className="p-5 space-y-2">
                  <Icon className="h-6 w-6 text-primary" />
                  <div className="font-semibold">{d.name}</div>
                  <div className="text-xs text-muted-foreground">{d.problemCount} problems</div>
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
