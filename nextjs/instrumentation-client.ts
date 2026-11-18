// This file configures the initialization of Sentry on the client.
// The config you add here will be used whenever a user loads a page in their browser.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/
import * as Sentry from '@sentry/nextjs';
import { SENTRY_TUNNEL_PATH, sharedSentryOptions } from '@/utils/sentry';

Sentry.init({
  ...sharedSentryOptions,
  // Send events through this app (served by serveTunnelIntegration on the
  // server) so ad blockers can't drop them
  tunnel: { path: SENTRY_TUNNEL_PATH }
});

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
