const { withSentryConfig } = require('@sentry/nextjs/config');

const nextConfig = {
  rewrites: async () => {
    return [
      {
        source: '/auth',
        destination: '/auth/signin'
      }
    ];
  }
};

// https://docs.sentry.io/platforms/javascript/guides/nextjs/manual-setup/
module.exports = withSentryConfig(nextConfig, {
  // Org, project, and auth token for source map uploads are read from the
  // SENTRY_ORG, SENTRY_PROJECT, and SENTRY_AUTH_TOKEN environment variables.
  // Source maps are skipped when they are not set.

  // Only print logs for uploading source maps in CI
  silent: !process.env.CI,

  // Upload a larger set of source maps for prettier stack traces (increases build time)
  widenClientFileUpload: true,

  // Route browser events through this app so ad blockers cannot block them
  tunnelRoute: '/monitoring'
});
