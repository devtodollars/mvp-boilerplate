// This file configures the initialization of Sentry on the client.
// The config you add here will be used whenever a user loads a page in their browser.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/
import * as Sentry from '@sentry/nextjs';

Sentry.init({
  // Sentry is disabled when the DSN is not set
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  // Capture 100% of transactions in development, 10% in production
  tracesSampleRate: process.env.NODE_ENV === 'development' ? 1.0 : 0.1
});

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
