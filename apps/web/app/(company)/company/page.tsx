'use client';

import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Card, CardContent } from '@/components/ui/card';
import { Search, Bookmark, Briefcase, ArrowRight } from 'lucide-react';

type Saved = { savedAt: string }[];

export default function CompanyHomePage() {
  const { data: session } = useSession();

  const token = session?.accessToken as string | undefined;

  const { data: saved } = useQuery({
    enabled: !!token,
    queryKey: ['recruiters.saved'],
    queryFn: () => api<Saved>('/recruiters/saved', { token }),
  });

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-semibold">Welcome back</h1>
        <p className="text-sm text-muted-foreground">
          Search verified students, build a shortlist, and post jobs. Contact details unlock once a
          candidate accepts your message.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <QuickCard
          href="/company/candidates"
          icon={Search}
          title="Find candidates"
          body="Filter by skill, verification layer, and college."
        />
        <QuickCard
          href="/company/saved"
          icon={Bookmark}
          title="Shortlist"
          body={`${saved?.length ?? 0} saved candidate${(saved?.length ?? 0) === 1 ? '' : 's'}`}
        />
        <QuickCard
          href="/company/jobs"
          icon={Briefcase}
          title="Post a job"
          body="Receive applications from verified students."
        />
      </div>

      <Card>
        <CardContent className="p-5 text-sm text-muted-foreground">
          <div className="font-medium text-foreground mb-1">How hiring works here</div>
          Every candidate you see is a real, public student profile. Skills carry a verification
          layer (L1–L4) backed by evidence. You can shortlist freely; to reach out, send a message —
          the student&apos;s contact details stay private until they accept.
        </CardContent>
      </Card>
    </div>
  );
}

function QuickCard({
  href,
  icon: Icon,
  title,
  body,
}: {
  href: string;
  icon: typeof Search;
  title: string;
  body: string;
}) {
  return (
    <Link href={href}>
      <Card className="h-full transition hover:border-primary/40 hover:shadow-sm">
        <CardContent className="p-5">
          <div className="grid h-9 w-9 place-items-center rounded-lg bg-primary/10 text-primary">
            <Icon className="h-4 w-4" />
          </div>
          <div className="mt-3 flex items-center gap-1 font-medium">
            {title} <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
          </div>
          <p className="mt-1 text-xs text-muted-foreground">{body}</p>
        </CardContent>
      </Card>
    </Link>
  );
}
