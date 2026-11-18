// This file configures the initialization of Sentry on the server.
// The config you add here will be used whenever the server handles a request.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/
import * as Sentry from '@sentry/nextjs';
import { SENTRY_TUNNEL_PATH, sharedSentryOptions } from '@/utils/sentry';

Sentry.init({
  ...sharedSentryOptions,
  // Forwards the browser's events from SENTRY_TUNNEL_PATH to Sentry
  integrations: [Sentry.serveTunnelIntegration({ path: SENTRY_TUNNEL_PATH })]
});
