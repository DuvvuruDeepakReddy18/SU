'use client';

import { useEffect } from 'react';
import { useSession } from 'next-auth/react';
import posthog from 'posthog-js';
import { identify, resetIdentity } from '@/lib/analytics';

/**
 * Mounts PostHog once on first paint and keeps the identify call in sync
 * with the auth session. No-op when NEXT_PUBLIC_POSTHOG_KEY isn't set —
 * dev environments without analytics keys run unaffected.
 */
export function PostHogProvider() {
  const { data: session, status } = useSession();

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!process.env.NEXT_PUBLIC_POSTHOG_KEY) return;
    // Guard against double-init in React 18 StrictMode.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if ((window as any).__posthog_inited__) return;
    posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY, {
      api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST ?? 'https://us.i.posthog.com',
      person_profiles: 'identified_only',
      capture_pageview: true,
      capture_pageleave: true,
    });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (window as any).__posthog_inited__ = true;
  }, []);

  // Keep identify in sync with auth state. When a session appears, identify
  // the user by email. When it disappears (sign out), reset so PostHog
  // doesn't keep attributing pre-auth pageviews to the wrong person.
  useEffect(() => {
    if (status === 'loading') return;
    if (session?.user?.email) {
      identify(session.user.email, {
        email: session.user.email,
        name: session.user.name ?? undefined,
      });
    } else {
      resetIdentity();
    }
  }, [session?.user?.email, session?.user?.name, status]);

  return null;
}
