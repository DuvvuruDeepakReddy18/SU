'use client';

import posthog from 'posthog-js';

/**
 * Thin analytics façade. All callers go through `track(name, props)` so we
 * (a) keep a single typed enum of valid event names, (b) no-op cleanly when
 * NEXT_PUBLIC_POSTHOG_KEY isn't set, and (c) have one place to swap providers
 * later if we drop PostHog.
 *
 * Identify is called from the auth wrapper on login / signup; pass the
 * student's email as the distinct ID so funnel reports group correctly
 * across signed-in and pre-auth sessions.
 */

// Whitelisted event names — the funnel surface we care about. Add new names
// here when you instrument new flows; don't capture arbitrary strings.
export const EVENTS = {
  SIGNUP_COMPLETED: 'signup_completed',
  COLLEGE_ID_UPLOADED: 'college_id_uploaded',
  MARKSHEET_UPLOADED: 'marksheet_uploaded',
  FIRST_PROBLEM_SOLVED: 'first_problem_solved',
  DM_SENT: 'dm_sent',
  // Company portal
  RECRUITER_SIGNUP: 'recruiter_signup',
  RECRUITER_INQUIRY_SENT: 'recruiter_inquiry_sent',
  JOB_POSTED: 'job_posted',
  INQUIRY_ACCEPTED: 'inquiry_accepted',
} as const;
export type EventName = (typeof EVENTS)[keyof typeof EVENTS];

const enabled = () => typeof window !== 'undefined' && !!process.env.NEXT_PUBLIC_POSTHOG_KEY;

export function track(name: EventName, props?: Record<string, unknown>) {
  if (!enabled()) return;
  posthog.capture(name, props);
}

export function identify(distinctId: string, props?: Record<string, unknown>) {
  if (!enabled()) return;
  posthog.identify(distinctId, props);
}

export function resetIdentity() {
  if (!enabled()) return;
  posthog.reset();
}
