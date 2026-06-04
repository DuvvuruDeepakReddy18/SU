// Next.js instrumentation hook. Loaded once per server process before any
// request is handled. We use it to pick the right Sentry config for the
// current runtime (nodejs vs edge).
//
// Note: Next 15+ exposes an optional `onRequestError` hook for RSC render
// errors. We skip re-exporting it because @sentry/nextjs v10 doesn't ship
// that symbol — server-side errors still flow through the standard Sentry
// hooks initialized in sentry.server.config.ts.

export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    await import('./sentry.server.config');
  } else if (process.env.NEXT_RUNTIME === 'edge') {
    await import('./sentry.edge.config');
  }
}
