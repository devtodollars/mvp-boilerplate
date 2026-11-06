// This file configures the initialization of Sentry for edge features (proxy, edge routes, and so on).
// The config you add here will be used whenever one of the edge features is loaded.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/
import * as Sentry from '@sentry/nextjs';

Sentry.init({
  // Sentry is disabled when the DSN is not set
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  // Capture 100% of transactions in development, 10% in production
  tracesSampleRate: process.env.NODE_ENV === 'development' ? 1.0 : 0.1
});
