import { ImageResponse } from 'next/og';
import { api } from '@/lib/api';

/**
 * Per-profile Open Graph image. Next 14 auto-attaches this file to the
 * `<meta property="og:image">` tag for the route's pages.
 *
 * Renders a 1200x630 card from live profile data so link previews on
 * LinkedIn / WhatsApp / Twitter / Slack actually look like a portfolio,
 * not a generic site preview. Cached per-slug at the edge — re-renders
 * naturally as profile content changes because `next/og` invalidates on
 * deployment and a profile edit triggers a fresh fetch the next time the
 * preview is requested.
 *
 * NOTE: Satori-rendered JSX is a restricted subset of React. No CSS
 * classes — only inline `style` objects. Stay defensive: if the API
 * fails or the profile is missing, render a generic SkillVerify card
 * instead of throwing (a broken og:image is worse than a generic one).
 */
export const runtime = 'nodejs';
export const alt = 'Verified skill portfolio on SkillVerify';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

type PublicProfile = {
  fullName: string;
  headline: string | null;
  user: {
    institution: { name: string } | null;
    userSkills: { highestVerificationLayer: string; skill: { name: string } }[];
    projects: { id: string }[];
    certifications: { id: string }[];
  };
};

const LAYER_RANK: Record<string, number> = {
  L0_UNVERIFIED: 0,
  L1_ACADEMIC: 1,
  L2_CERTIFIED: 2,
  L3_PROVEN: 3,
  L4_EXPERT: 4,
};

function topLayer(skills: PublicProfile['user']['userSkills']): string {
  if (!skills.length) return 'L0_UNVERIFIED';
  return skills.reduce((best, s) =>
    (LAYER_RANK[s.highestVerificationLayer] ?? 0) > (LAYER_RANK[best.highestVerificationLayer] ?? 0)
      ? s
      : best,
  ).highestVerificationLayer;
}

const LAYER_LABEL: Record<string, string> = {
  L0_UNVERIFIED: 'Unverified',
  L1_ACADEMIC: 'L1 · Academic',
  L2_CERTIFIED: 'L2 · Certified',
  L3_PROVEN: 'L3 · Proven',
  L4_EXPERT: 'L4 · Expert',
};

export default async function OgImage({ params }: { params: { slug: string } }) {
  let profile: PublicProfile | null;
  try {
    profile = await api<PublicProfile>(`/profile/public/${encodeURIComponent(params.slug)}`);
  } catch {
    profile = null;
  }

  const name = profile?.fullName ?? 'SkillVerify';
  const headline = profile?.headline ?? 'Four-layer verified skill portfolios';
  const institution = profile?.user.institution?.name ?? null;
  const topSkills = (profile?.user.userSkills ?? [])
    .slice()
    .sort(
      (a, b) =>
        (LAYER_RANK[b.highestVerificationLayer] ?? 0) -
        (LAYER_RANK[a.highestVerificationLayer] ?? 0),
    )
    .slice(0, 5)
    .map((s) => s.skill.name);
  const projectCount = profile?.user.projects.length ?? 0;
  const certCount = profile?.user.certifications.length ?? 0;
  const layer = profile ? topLayer(profile.user.userSkills) : 'L0_UNVERIFIED';

  return new ImageResponse(
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        background: 'linear-gradient(135deg, #022c22 0%, #0f172a 60%, #042f2e 100%)',
        color: '#f8fafc',
        fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
        padding: '64px 72px',
        position: 'relative',
      }}
    >
      {/* corner glow */}
      <div
        style={{
          position: 'absolute',
          top: -120,
          right: -120,
          width: 480,
          height: 480,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(16,185,129,0.45) 0%, rgba(16,185,129,0) 70%)',
        }}
      />

      {/* header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 44,
              height: 44,
              borderRadius: 12,
              background: 'linear-gradient(135deg, #10b981 0%, #06b6d4 100%)',
              color: '#022c22',
              fontWeight: 800,
              fontSize: 24,
            }}
          >
            S
          </div>
          <div style={{ display: 'flex', fontSize: 28, fontWeight: 600 }}>
            <span style={{ color: '#10b981' }}>Skill</span>
            <span>Verify</span>
          </div>
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '10px 18px',
            borderRadius: 999,
            background: 'rgba(16,185,129,0.18)',
            border: '1px solid rgba(16,185,129,0.4)',
            fontSize: 20,
            color: '#a7f3d0',
          }}
        >
          {LAYER_LABEL[layer]}
        </div>
      </div>

      {/* body */}
      <div
        style={{
          marginTop: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: 16,
        }}
      >
        <div
          style={{
            fontSize: 84,
            fontWeight: 700,
            lineHeight: 1.05,
            letterSpacing: '-0.02em',
          }}
        >
          {name}
        </div>
        {institution && <div style={{ fontSize: 28, color: '#a7f3d0' }}>{institution}</div>}
        <div
          style={{
            fontSize: 26,
            color: '#cbd5e1',
            maxWidth: 1000,
            lineHeight: 1.35,
          }}
        >
          {headline.length > 140 ? headline.slice(0, 137) + '…' : headline}
        </div>
      </div>

      {/* footer chips */}
      <div
        style={{
          marginTop: 36,
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          flexWrap: 'wrap',
        }}
      >
        {topSkills.map((s) => (
          <div
            key={s}
            style={{
              padding: '8px 16px',
              borderRadius: 8,
              background: 'rgba(255,255,255,0.08)',
              border: '1px solid rgba(255,255,255,0.12)',
              fontSize: 20,
              color: '#e2e8f0',
            }}
          >
            {s}
          </div>
        ))}
        <div style={{ flex: 1 }} />
        <div style={{ display: 'flex', gap: 24, color: '#94a3b8', fontSize: 20 }}>
          <div style={{ display: 'flex' }}>
            {projectCount} project{projectCount === 1 ? '' : 's'}
          </div>
          <div style={{ display: 'flex' }}>
            {certCount} certification{certCount === 1 ? '' : 's'}
          </div>
        </div>
      </div>
    </div>,
    { ...size },
  );
}
