'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import {
  Plus,
  Star,
  MapPin,
  Search,
  Map as MapIcon,
  Inbox,
  Filter,
  Crosshair,
  ShieldCheck,
  Sparkles,
  ArrowRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { OpportunitiesTabs } from '@/components/opportunities-tabs';

type Service = {
  id: string;
  title: string;
  category: string;
  description: string;
  priceFrom: number | null;
  priceUnit: string | null;
  skills: string[];
  location: string | null;
  isRemote: boolean;
  createdAt: string;
  providerId: string;
  provider: {
    studentProfile: { fullName: string; avatarUrl: string | null; sharableSlug: string } | null;
  };
};

// Category chips with their gradient palette for the service-card banner.
// Each gradient is unique so the grid feels alive even at a glance.
const CATS = [
  { value: '', label: 'All Categories', emoji: '✨', gradient: 'from-emerald-500 to-cyan-500' },
  {
    value: 'development',
    label: 'Development',
    emoji: '💻',
    gradient: 'from-violet-500 to-fuchsia-500',
  },
  { value: 'design', label: 'Design', emoji: '🎨', gradient: 'from-pink-500 to-orange-400' },
  { value: 'marketing', label: 'Marketing', emoji: '📣', gradient: 'from-rose-500 to-amber-400' },
  {
    value: 'data_science',
    label: 'Data Science',
    emoji: '📊',
    gradient: 'from-cyan-500 to-blue-500',
  },
  {
    value: 'video_editing',
    label: 'Video Editing',
    emoji: '🎬',
    gradient: 'from-indigo-500 to-purple-500',
  },
  { value: 'writing', label: 'Writing', emoji: '✍️', gradient: 'from-teal-500 to-emerald-500' },
] as const;

const SORTS = [
  { value: 'recent', label: 'Most recent' },
  { value: 'price_asc', label: 'Price: low to high' },
  { value: 'price_desc', label: 'Price: high to low' },
] as const;

type TopTab = 'hire' | 'find' | 'mine';

// Deterministic stub rating until real reviews land.
function stubRating(id: string): { score: number; count: number } {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) | 0;
  const score = 3.8 + (Math.abs(h) % 13) / 10;
  const count = 3 + (Math.abs(h >> 4) % 27);
  return { score: Math.min(5, Math.round(score * 10) / 10), count };
}

export default function FreelancePage() {
  const { data: session } = useSession();

  const token = session?.accessToken as string | undefined;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const myUserId = (session as any)?.user?.id as string | undefined;
  const qc = useQueryClient();

  const [topTab, setTopTab] = useState<TopTab>('hire');
  const [tab, setTab] = useState('');
  const [q, setQ] = useState('');
  const [sort, setSort] = useState<(typeof SORTS)[number]['value']>('recent');
  const [showFilters, setShowFilters] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    title: '',
    category: 'development',
    description: '',
    priceFrom: '',
    priceUnit: 'project',
    skills: '',
    location: '',
    isRemote: true,
  });

  const { data: allServices } = useQuery({
    queryKey: ['freelance', tab, q, sort],
    queryFn: () =>
      api<Service[]>(`/freelance/services?category=${tab}&q=${encodeURIComponent(q)}&sort=${sort}`),
  });

  // Split into "all listings" (Hire Talent) vs "my listings" (Mine).
  const myListings = useMemo(
    () => (myUserId ? (allServices ?? []).filter((s) => s.providerId === myUserId) : []),
    [allServices, myUserId],
  );
  const visible = topTab === 'mine' ? myListings : (allServices ?? []);

  const post = useMutation({
    mutationFn: () =>
      api('/freelance/services', {
        method: 'POST',
        token,
        body: JSON.stringify({
          ...form,
          priceFrom: form.priceFrom ? Number(form.priceFrom) : undefined,
          skills: form.skills
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean),
        }),
      }),
    onSuccess: () => {
      toast.success('Service listed');
      setShowForm(false);
      qc.invalidateQueries({ queryKey: ['freelance'] });
    },
    onError: (e) => toast.error((e as Error).message),
  });

  return (
    <div className="space-y-4">
      <OpportunitiesTabs />
      <div className="space-y-8">
        {/* ============ HERO ============ */}
        <section className="relative overflow-hidden rounded-2xl border bg-gradient-to-br from-emerald-50 via-background to-primary/5 dark:from-emerald-950/30 dark:to-primary/10 px-6 py-12 md:py-16">
          <div className="absolute -top-20 -right-20 h-64 w-64 rounded-full bg-primary/20 blur-3xl" />
          <div className="absolute -bottom-20 -left-20 h-64 w-64 rounded-full bg-emerald-300/30 blur-3xl dark:bg-emerald-900/30" />

          <div className="relative max-w-3xl mx-auto text-center">
            <h1 className="text-3xl md:text-5xl font-bold tracking-tight">
              Find the perfect{' '}
              <span className="bg-gradient-to-r from-emerald-500 to-cyan-500 bg-clip-text text-transparent">
                professional
              </span>
            </h1>
            <p className="mt-3 text-sm md:text-base text-muted-foreground">
              Browse verified student freelancers ready to bring your ideas to life.
            </p>

            <div className="mt-6 mx-auto max-w-2xl">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  className="pl-12 pr-32 h-14 text-base rounded-full border shadow-sm bg-background"
                  placeholder="What service are you looking for?"
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                />
                <Button className="absolute right-1.5 top-1.5 h-11 rounded-full px-5">
                  Search
                </Button>
              </div>
            </div>

            {/* Category chips */}
            <div className="mt-5 flex flex-wrap gap-2 justify-center">
              {CATS.map((c) => (
                <button
                  key={c.value || 'all'}
                  onClick={() => setTab(c.value)}
                  className={cn(
                    'rounded-full border px-3 py-1 text-xs transition',
                    tab === c.value
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'bg-background hover:bg-secondary',
                  )}
                >
                  {c.label}
                </button>
              ))}
            </div>

            {/* Map / Near Me / Filters */}
            <div className="mt-4 flex flex-wrap gap-2 justify-center text-xs">
              <Link href="/dashboard/freelance/map">
                <button className="inline-flex items-center gap-1.5 rounded-full border bg-background hover:bg-secondary px-3 py-1.5">
                  <MapIcon className="h-3.5 w-3.5" /> Map View
                </button>
              </Link>
              <button className="inline-flex items-center gap-1.5 rounded-full border bg-background hover:bg-secondary px-3 py-1.5">
                <Crosshair className="h-3.5 w-3.5" /> Near Me
              </button>
              <button
                onClick={() => setShowFilters((s) => !s)}
                className={cn(
                  'inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5',
                  showFilters
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'bg-background hover:bg-secondary',
                )}
              >
                <Filter className="h-3.5 w-3.5" /> Filters
              </button>
              <Link href="/dashboard/freelance/inquiries">
                <button className="inline-flex items-center gap-1.5 rounded-full border bg-background hover:bg-secondary px-3 py-1.5">
                  <Inbox className="h-3.5 w-3.5" /> Inquiries
                </button>
              </Link>
            </div>

            {showFilters && (
              <div className="mt-4 inline-flex items-center gap-3 rounded-xl border bg-background/80 backdrop-blur px-4 py-2">
                <span className="text-xs text-muted-foreground">Sort by</span>
                <select
                  className="rounded-md border bg-background px-2 py-1 text-xs"
                  value={sort}
                  onChange={(e) => setSort(e.target.value as typeof sort)}
                >
                  {SORTS.map((s) => (
                    <option key={s.value} value={s.value}>
                      {s.label}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </section>

        {/* ============ TOP TABS ============ */}
        <div className="grid grid-cols-3 rounded-xl border bg-secondary/20 p-1 text-sm font-medium">
          <TopTabBtn active={topTab === 'hire'} onClick={() => setTopTab('hire')}>
            Hire Talent
          </TopTabBtn>
          <TopTabBtn active={topTab === 'find'} onClick={() => setTopTab('find')}>
            Find Work
          </TopTabBtn>
          <TopTabBtn active={topTab === 'mine'} onClick={() => setTopTab('mine')}>
            My Listings{' '}
            {myListings.length > 0 && (
              <span className="text-muted-foreground ml-1">({myListings.length})</span>
            )}
          </TopTabBtn>
        </div>

        {/* ============ OFFER YOUR SKILLS STRIP ============ */}
        {topTab !== 'find' && (
          <Card className="border-none bg-gradient-to-r from-foreground to-foreground/90 text-background overflow-hidden">
            <CardContent className="flex flex-wrap items-center justify-between gap-4 p-6">
              <div>
                <div className="text-lg font-semibold flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-emerald-400" />
                  Want to offer your skills?
                </div>
                <div className="text-sm opacity-80 mt-0.5">
                  After signup, we personally help you get your first task.
                </div>
              </div>
              <Button
                onClick={() => setShowForm(!showForm)}
                className="bg-emerald-500 hover:bg-emerald-600 text-white rounded-full px-5"
              >
                <Plus className="h-4 w-4" /> List Your Service
              </Button>
            </CardContent>
          </Card>
        )}

        {/* ============ INLINE CREATE FORM ============ */}
        {showForm && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">List a service</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3 md:grid-cols-2">
              <Input
                placeholder="Service title (e.g. I will design your logo)"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
              />
              <select
                className="rounded-md border bg-background px-3 py-2 text-sm"
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
              >
                {CATS.filter((c) => c.value).map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.emoji} {c.label}
                  </option>
                ))}
              </select>
              <textarea
                className="md:col-span-2 flex min-h-[100px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm"
                placeholder="What will you deliver? Be specific — turnaround, revisions, deliverables…"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
              <Input
                placeholder="Starting price (₹)"
                type="number"
                value={form.priceFrom}
                onChange={(e) => setForm({ ...form, priceFrom: e.target.value })}
              />
              <select
                className="rounded-md border bg-background px-3 py-2 text-sm"
                value={form.priceUnit}
                onChange={(e) => setForm({ ...form, priceUnit: e.target.value })}
              >
                <option value="project">per project</option>
                <option value="hour">per hour</option>
                <option value="month">per month</option>
              </select>
              <Input
                placeholder="Skills (comma-separated)"
                value={form.skills}
                onChange={(e) => setForm({ ...form, skills: e.target.value })}
              />
              <Input
                placeholder="Location (e.g. Bangalore)"
                value={form.location}
                onChange={(e) => setForm({ ...form, location: e.target.value })}
              />
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={form.isRemote}
                  onChange={(e) => setForm({ ...form, isRemote: e.target.checked })}
                />
                Remote available
              </label>
              <div className="md:col-span-2 flex justify-end">
                <Button
                  onClick={() => post.mutate()}
                  disabled={post.isPending || !form.title || !form.description}
                >
                  Post listing
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* ============ MAIN PANE BY TAB ============ */}
        {topTab === 'find' ? (
          <FindWorkPane />
        ) : (
          <ServicesGrid services={visible} emptyOnMine={topTab === 'mine'} />
        )}
      </div>
    </div>
  );
}

// ---------- subcomponents ----------

function TopTabBtn({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'rounded-lg py-2.5 transition',
        active ? 'bg-background shadow-sm' : 'text-muted-foreground hover:text-foreground',
      )}
    >
      {children}
    </button>
  );
}

function ServicesGrid({ services, emptyOnMine }: { services: Service[]; emptyOnMine: boolean }) {
  if (!services || services.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="p-12 text-center text-sm text-muted-foreground">
          {emptyOnMine ? (
            <>You haven&apos;t listed any services yet. Use the green button above to list one.</>
          ) : (
            <>No services match your filters. Try a different category.</>
          )}
        </CardContent>
      </Card>
    );
  }
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {services.map((s) => (
        <ServiceCard key={s.id} service={s} />
      ))}
    </div>
  );
}

function ServiceCard({ service }: { service: Service }) {
  const cat = CATS.find((c) => c.value === service.category) ?? CATS[0];
  const rating = stubRating(service.id);
  return (
    <Link href={`/dashboard/freelance/${service.id}`} className="block group">
      <Card className="h-full overflow-hidden transition group-hover:border-primary/40 group-hover:shadow-lg">
        {/* Colored gradient banner — picked per category */}
        <div
          className={cn(
            'h-28 relative bg-gradient-to-br flex items-end justify-between p-3',
            cat.gradient,
          )}
        >
          <Badge className="bg-white/95 text-foreground border-0 capitalize">
            {service.category.replace('_', ' ')}
          </Badge>
          {service.priceFrom != null && (
            <div className="text-right text-white/95">
              <div className="text-xs leading-none opacity-80">from</div>
              <div className="font-bold text-lg leading-tight">
                ₹{service.priceFrom.toLocaleString()}
              </div>
              <div className="text-[10px] opacity-80">/ {service.priceUnit ?? 'project'}</div>
            </div>
          )}
        </div>
        <CardContent className="p-4 space-y-3">
          <div className="font-semibold leading-snug line-clamp-2">{service.title}</div>
          <p className="text-xs text-muted-foreground line-clamp-2">{service.description}</p>

          {/* Skills */}
          {service.skills.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {service.skills.slice(0, 3).map((s) => (
                <Badge key={s} variant="outline" className="text-[10px] font-normal">
                  {s}
                </Badge>
              ))}
              {service.skills.length > 3 && (
                <span className="text-[10px] text-muted-foreground self-center">
                  +{service.skills.length - 3}
                </span>
              )}
            </div>
          )}

          {/* Provider + rating */}
          <div className="flex items-center justify-between pt-2 border-t">
            <div className="flex items-center gap-2 min-w-0">
              {service.provider.studentProfile?.avatarUrl ? (
                <img
                  src={service.provider.studentProfile.avatarUrl}
                  alt=""
                  className="h-7 w-7 rounded-full object-cover shrink-0"
                />
              ) : (
                <div className="h-7 w-7 rounded-full bg-primary/20 text-primary text-[10px] grid place-items-center font-semibold shrink-0">
                  {(service.provider.studentProfile?.fullName ?? '?').charAt(0)}
                </div>
              )}
              <div className="min-w-0">
                <div className="text-xs font-medium truncate">
                  {service.provider.studentProfile?.fullName ?? 'Anonymous'}
                </div>
                <div className="text-[10px] text-muted-foreground inline-flex items-center gap-1">
                  <ShieldCheck className="h-3 w-3 text-emerald-500" />
                  Verified
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1 text-xs shrink-0 ml-2">
              <Star className="h-3 w-3 text-amber-500 fill-amber-500" />
              <span className="font-semibold tabular-nums">{rating.score.toFixed(1)}</span>
              <span className="text-muted-foreground">({rating.count})</span>
            </div>
          </div>

          {/* Location / Remote */}
          {(service.location || service.isRemote) && (
            <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
              {service.location && (
                <span className="inline-flex items-center gap-1">
                  <MapPin className="h-3 w-3" /> {service.location}
                </span>
              )}
              {service.isRemote && <span>· Remote OK</span>}
            </div>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}

/**
 * The "Find Work" tab is the inverse of Hire Talent — instead of services
 * offered, it surfaces opportunities the user can apply to. Until we have a
 * dedicated client-posts-a-brief model, link to the placements + inquiries
 * pages which already cover this slice of the marketplace.
 */
function FindWorkPane() {
  return (
    <div className="space-y-4">
      <Card className="border-none bg-gradient-to-br from-blue-50 via-background to-violet-50 dark:from-blue-950/30 dark:to-violet-950/30">
        <CardContent className="p-8 text-center max-w-2xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-bold">
            Earn from{' '}
            <span className="text-blue-600 dark:text-blue-400">skills that don&apos;t belong</span>{' '}
            to freelancing sites
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Your unique talents deserve a better home. Apply to live briefs from clients across the
            country.
          </p>
        </CardContent>
      </Card>
      <div className="grid gap-3 md:grid-cols-2">
        <Link href="/dashboard/freelance/inquiries" className="block group">
          <Card className="h-full transition group-hover:border-primary/40 group-hover:shadow-md">
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-xs uppercase tracking-wider text-muted-foreground">
                    Inbound briefs
                  </div>
                  <div className="mt-1 font-semibold">Client inquiries on your services</div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Open requests waiting on your accept / decline.
                  </p>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition" />
              </div>
            </CardContent>
          </Card>
        </Link>
        <Link href="/dashboard/placements" className="block group">
          <Card className="h-full transition group-hover:border-primary/40 group-hover:shadow-md">
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-xs uppercase tracking-wider text-muted-foreground">
                    Open drives
                  </div>
                  <div className="mt-1 font-semibold">Internships &amp; placement openings</div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Full-time / internship / PPO listings gated by your verification level.
                  </p>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition" />
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  );
}
