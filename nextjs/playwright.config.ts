import { defineConfig, devices } from '@playwright/test';
import { LOCAL } from './e2e/helpers/env';
import {
  SENTRY_CAPTURE_DSN,
  SENTRY_CAPTURE_ENVIRONMENT
} from './e2e/helpers/sentry-capture';

/**
 * End-to-end suite for the Next.js app, the Supabase schema and the edge
 * functions. Needs the local test stack: `../tests/start-stack.sh`.
 * See ../tests/README.md for the full list of test cases.
 */
const PORT = 3100;

export default defineConfig({
  testDir: './e2e',
  globalSetup: './e2e/global-setup.ts',
  timeout: 60_000,
  expect: { timeout: 15_000 },
  fullyParallel: false,
  workers: 1, // tests share one database and one Stripe test account
  retries: process.env.CI ? 1 : 0,
  reporter: [['list'], ['html', { open: 'never', outputFolder: 'e2e-report' }]],
  outputDir: 'e2e-results',
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    // Uses the installed Google Chrome; run `pnpm exec playwright install chromium`
    // and drop `channel` if Chrome isn't available.
    ...devices['Desktop Chrome'],
    channel: 'chrome'
  },
  webServer: {
    command: `pnpm exec next dev --port ${PORT}`,
    url: `http://localhost:${PORT}`,
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
    // Process env wins over .env files, so tests never hit cloud Supabase,
    // real hCaptcha, the production PostHog project, or the real Sentry project
    // (events go to the local capture server in e2e/helpers/sentry-capture.ts).
    env: {
      NEXT_PUBLIC_SITE_URL: `http://localhost:${PORT}`,
      NEXT_PUBLIC_SUPABASE_URL: LOCAL.supabaseUrl,
      NEXT_PUBLIC_SUPABASE_ANON_KEY: LOCAL.anonKey,
      SUPABASE_SERVICE_ROLE_KEY: LOCAL.serviceRoleKey,
      NEXT_PUBLIC_HCAPTCHA_SITE_KEY: '',
      NEXT_PUBLIC_POSTHOG_KEY: 'phc_e2e_disabled',
      NEXT_PUBLIC_POSTHOG_HOST: 'http://127.0.0.1:9',
      NEXT_PUBLIC_SENTRY_DSN: SENTRY_CAPTURE_DSN,
      NEXT_PUBLIC_SENTRY_ENVIRONMENT: SENTRY_CAPTURE_ENVIRONMENT,
      // No source map upload from test runs
      SENTRY_AUTH_TOKEN: ''
    }
  }
});
