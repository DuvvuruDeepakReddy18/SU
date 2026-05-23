'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { api } from '@/lib/api';
import { ChevronLeft } from 'lucide-react';

type Problem = {
  id: string;
  title: string;
  slug: string;
  difficulty: 'easy' | 'medium' | 'hard';
  topics: string[];
  points: number;
};

export default function PracticeAllPage() {
  const [q, setQ] = useState('');
  const [difficulty, setDifficulty] = useState<'' | 'easy' | 'medium' | 'hard'>('');

  const { data } = useQuery({
    queryKey: ['problems', q, difficulty],
    queryFn: () =>
      api<{ items: Problem[]; total: number }>(
        `/practice/problems?pageSize=100&q=${encodeURIComponent(q)}${difficulty ? `&difficulty=${difficulty}` : ''}`,
      ),
  });

  return (
    <div className="space-y-4">
      <Link
        href="/dashboard/practice"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ChevronLeft className="h-4 w-4" /> Domains
      </Link>
      <div className="flex flex-wrap gap-2">
        <Input
          className="max-w-sm"
          placeholder="Search problems…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <div className="flex gap-1">
          {(['', 'easy', 'medium', 'hard'] as const).map((d) => (
            <button
              key={d || 'all'}
              onClick={() => setDifficulty(d)}
              className={`rounded-md px-3 py-1 text-xs border ${difficulty === d ? 'bg-primary text-primary-foreground' : 'bg-background'}`}
            >
              {d || 'All'}
            </button>
          ))}
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{data?.total ?? 0} problems</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <ul className="divide-y">
            {data?.items.map((p) => (
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
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
