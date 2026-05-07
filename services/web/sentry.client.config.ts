// Loaded automatically by @sentry/nextjs when this filename exists.
// Uses dynamic import so the Sentry bundle is never evaluated during SSR/prerender.

if (typeof window !== 'undefined' && process.env.NEXT_PUBLIC_SENTRY_DSN) {
  import('@sentry/nextjs').then(({ init, replayIntegration }) => {
    init({
      dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
      environment: process.env.NODE_ENV,
      tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.2 : 1.0,
      replaysOnErrorSampleRate: 1.0,
      replaysSessionSampleRate: 0.05,
      integrations: [replayIntegration({ maskAllText: false, blockAllMedia: false })],
    });
  });
}
