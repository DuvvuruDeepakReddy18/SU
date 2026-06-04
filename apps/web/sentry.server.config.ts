// Loaded by Next.js for server-rendered routes + API routes (the /api/og/...
// route, etc.). Separate from the NestJS API — that has its own DSN.

import * as Sentry from '@sentry/nextjs';

if (process.env.SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.NODE_ENV,
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 0,
  });
}
