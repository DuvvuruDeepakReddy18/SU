'use client';

import { motion } from 'framer-motion';
import { ArrowBigUp, MessageSquare, ShieldCheck } from 'lucide-react';

// Tribeme-style live community feed — scrolling post cards that make the
// platform feel alive. Illustrative content (not real users).
type Post = {
  name: string;
  inst: string;
  tag: string;
  body: string;
  up: number;
  comments: number;
};

const POSTS: Post[] = [
  {
    name: 'Aarav S.',
    inst: 'IIT Madras',
    tag: 'showcase',
    body: 'Just hit L4 on React after the expert panel 🎉',
    up: 142,
    comments: 18,
  },
  {
    name: 'Priya K.',
    inst: 'BITS Pilani',
    tag: 'placements',
    body: 'A recruiter reached out through my verified profile. Interview next week!',
    up: 98,
    comments: 24,
  },
  {
    name: 'Rohan M.',
    inst: 'VIT',
    tag: 'help',
    body: 'Anyone up for a hackathon team? Need a verified backend dev.',
    up: 56,
    comments: 31,
  },
  {
    name: 'Sneha R.',
    inst: 'NLU Delhi',
    tag: 'academic',
    body: 'Marksheet auto-verified in 6 hours. CGPA now shows the green badge.',
    up: 77,
    comments: 9,
  },
  {
    name: 'Karan T.',
    inst: 'IIM Udaipur',
    tag: 'freelance',
    body: 'Delivered my first freelance gig and added it as L3 proof of work.',
    up: 120,
    comments: 14,
  },
  {
    name: 'Ananya P.',
    inst: 'SRCC',
    tag: 'general',
    body: 'Solved 50 practice problems this week. Leaderboard #3 in my college 🔥',
    up: 88,
    comments: 12,
  },
];

function PostCard({ p }: { p: Post }) {
  return (
    <div className="w-[300px] shrink-0 rounded-2xl border border-white/70 bg-white/80 p-4 shadow-sm backdrop-blur">
      <div className="flex items-center gap-2.5">
        <div className="grid h-9 w-9 place-items-center rounded-full bg-gradient-to-br from-stone-700 to-stone-900 text-xs font-semibold text-stone-50">
          {p.name
            .split(' ')
            .map((w) => w[0])
            .join('')}
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-1 text-sm font-semibold text-stone-800">
            {p.name} <ShieldCheck className="h-3 w-3 text-emerald-600" />
          </div>
          <div className="text-[10px] text-stone-500">
            {p.inst} · r/{p.tag}
          </div>
        </div>
      </div>
      <p className="mt-2.5 text-sm leading-relaxed text-stone-700">{p.body}</p>
      <div className="mt-3 flex items-center gap-4 text-[11px] text-stone-500">
        <span className="inline-flex items-center gap-1">
          <ArrowBigUp className="h-3.5 w-3.5" /> {p.up}
        </span>
        <span className="inline-flex items-center gap-1">
          <MessageSquare className="h-3.5 w-3.5" /> {p.comments}
        </span>
      </div>
    </div>
  );
}

function Row({ posts, reverse }: { posts: Post[]; reverse?: boolean }) {
  const doubled = [...posts, ...posts];
  return (
    <motion.div
      className="flex w-max gap-3"
      animate={{ x: reverse ? ['-50%', '0%'] : ['0%', '-50%'] }}
      transition={{ duration: 34, repeat: Infinity, ease: 'linear' }}
    >
      {doubled.map((p, i) => (
        <PostCard key={`${p.name}-${i}`} p={p} />
      ))}
    </motion.div>
  );
}

export function LandingFeed() {
  return (
    <section className="overflow-hidden py-20">
      <div className="container mb-8 text-center">
        <h2 className="text-3xl font-semibold tracking-tight md:text-4xl">
          A place students actually live in
        </h2>
        <p className="mx-auto mt-3 max-w-xl text-muted-foreground">
          Practice, community, freelance, competitions, every win is verifiable and every profile is
          real.
        </p>
      </div>
      <div className="space-y-3 [mask-image:linear-gradient(to_right,transparent,black_8%,black_92%,transparent)]">
        <Row posts={POSTS} />
        <Row posts={[...POSTS].reverse()} reverse />
      </div>
    </section>
  );
}
