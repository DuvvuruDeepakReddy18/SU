// Loaded by Next.js automatically on every page load (sentry.client.config.ts
// is one of the magic filenames @sentry/nextjs picks up). No-op if
// NEXT_PUBLIC_SENTRY_DSN isn't set.

import * as Sentry from '@sentry/nextjs';

if (process.env.NEXT_PUBLIC_SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
    environment: process.env.NODE_ENV,
    // Replay on errors only — full session replay is overkill at our scale.
    replaysOnErrorSampleRate: 1.0,
    replaysSessionSampleRate: 0,
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 0,
    integrations: [Sentry.replayIntegration({ maskAllText: true, blockAllMedia: true })],
  });
}
