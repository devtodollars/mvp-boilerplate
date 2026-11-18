import { expect, Page, test } from '@playwright/test';
import { FUNCTIONS_URL, LOCAL, PASSWORD, uniqueEmail } from './helpers/env';
import { createSignedInUser, signStripePayload, sql } from './helpers/services';
import {
  clearSentryEvents,
  eventText,
  SENTRY_CAPTURE_ENVIRONMENT,
  sentryEvents,
  waitForSentryEvent
} from './helpers/sentry-capture';

/**
 * Sentry error reporting from the Next.js app and the edge functions. Both
 * report to the local capture server (e2e/helpers/sentry-capture.ts) instead of
 * Sentry, so these tests read the exact events that would be sent. The edge
 * functions reach it through SENTRY_DSN in supabase/.env.local (template:
 * tests/env.local.example); the SF tests are skipped when it points elsewhere.
 */

async function signInUi(page: Page, email: string) {
  await page.goto('/auth/signin');
  await page.locator('#email').fill(email);
  await page.locator('#password').fill(PASSWORD);
  await page.getByRole('button', { name: 'Sign In', exact: true }).last().click();
  await expect(page.getByRole('button', { name: 'Account' }).first()).toBeVisible();
}

// Throws outside any handler, like a bug in an event callback would
const throwInBrowser = (page: Page, message: string) =>
  page.evaluate((m) => {
    setTimeout(() => {
      throw new Error(m);
    });
  }, message);

test.describe('Sentry (Next.js)', () => {
  test.beforeEach(async () => {
    await clearSentryEvents();
  });

  test('SE1 a browser error is sent through the /monitoring tunnel with the environment', async ({ page }) => {
    await page.goto('/');
    const tunnelRequest = page.waitForRequest((r) => new URL(r.url()).pathname === '/monitoring');
    const message = `SE1 browser error ${Date.now()}`;
    await throwInBrowser(page, message);

    expect((await tunnelRequest).method()).toBe('POST');
    const event = await waitForSentryEvent((e) => eventText(e).includes(message));
    expect(event.environment).toBe(SENTRY_CAPTURE_ENVIRONMENT);
    expect(event.user).toBeUndefined();
  });

  test('SE2 a signed-in user is identified by Supabase id only', async ({ page }) => {
    const email = uniqueEmail('sentry');
    const { id } = await createSignedInUser(email);
    await signInUi(page, email);

    const message = `SE2 signed-in error ${Date.now()}`;
    await throwInBrowser(page, message);
    const event = await waitForSentryEvent((e) => eventText(e).includes(message));
    expect(event.user).toEqual({ id });
    expect(JSON.stringify(event)).not.toContain(email);

    // Signing out clears it
    await page.context().clearCookies();
    await page.evaluate(() => localStorage.clear());
    await page.goto('/');
    const after = `SE2 signed-out error ${Date.now()}`;
    await throwInBrowser(page, after);
    const signedOut = await waitForSentryEvent((e) => eventText(e).includes(after));
    expect(signedOut.user).toBeUndefined();
  });

  test('SE3 an unexpected auth link failure is reported, with secrets scrubbed from the URL', async ({ request }) => {
    const res = await request.get(
      '/api/auth_callback?error=server_error&error_code=unexpected_failure&error_description=SE3+secret+detail&token_hash=SE3-one-time-token',
      { maxRedirects: 0 }
    );
    expect(res.status()).toBe(307);

    const event = await waitForSentryEvent((e) => e.tags?.auth_route === 'auth_callback');
    expect(event.tags?.auth_error_code).toBe('unexpected_failure');
    expect(event.environment).toBe(SENTRY_CAPTURE_ENVIRONMENT);
    const url = event.request?.url ?? '';
    expect(url).toContain('/api/auth_callback');
    // Neither the one-time token nor the message text may leave the app in the URL
    const urlAndQuery = `${url} ${JSON.stringify(event.request?.query_string ?? '')}`;
    expect(urlAndQuery).not.toContain('SE3-one-time-token');
    expect(urlAndQuery).not.toContain('SE3+secret+detail');
  });

  test('SE4 user-caused auth link failures (expired, other browser) are not reported', async ({ request }) => {
    await request.get(
      '/api/auth_callback?error=access_denied&error_code=otp_expired&error_description=Email+link+is+invalid+or+has+expired',
      { maxRedirects: 0 }
    );
    // A code with no PKCE verifier in this browser: the link was opened elsewhere
    await request.get('/api/auth_callback?code=00000000-0000-0000-0000-000000000000', { maxRedirects: 0 });
    // Trigger a known event afterwards so there is something to wait for
    await request.get('/api/reset_password?error_code=unexpected_failure&error_description=SE4+marker', {
      maxRedirects: 0
    });
    await waitForSentryEvent((e) => e.tags?.auth_route === 'reset_password');
    const reported = (await sentryEvents()).filter((e) => e.tags?.auth_route === 'auth_callback');
    expect(reported).toHaveLength(0);
  });

  test('SE5 events carry no cookies or request bodies', async ({ page }) => {
    const email = uniqueEmail('sentry-pii');
    await createSignedInUser(email);
    await signInUi(page, email); // the browser now holds Supabase auth cookies

    const message = `SE5 error ${Date.now()}`;
    await throwInBrowser(page, message);
    const event = await waitForSentryEvent((e) => eventText(e).includes(message));
    expect(event.request?.cookies).toBeUndefined();
    expect(event.request?.data).toBeUndefined();
    expect(JSON.stringify(event)).not.toContain('auth-token');
    expect(JSON.stringify(event)).not.toContain(PASSWORD);
  });

  test('SE6 a checkout request that never reaches get_stripe_url is reported', async ({ page }) => {
    const email = uniqueEmail('sentry-billing');
    await createSignedInUser(email);
    await signInUi(page, email);

    const [price] = await sql`
      select pr.id from prices pr join products p on p.id = pr.product_id
      where p.name = 'Hobby' and pr.active and pr.interval = 'month' and pr.currency = 'USD'
      limit 1`;

    // Simulate the function being unreachable (network, CORS, not deployed)
    await page.route('**/functions/v1/get_stripe_url', (route) => route.abort('connectionfailed'));
    await page.goto('/#pricing');
    const card = page.locator('#pricing .glass-4').filter({ hasText: 'Hobby' });
    await card.getByRole('button', { name: 'Subscribe Now' }).click();

    if (price) {
      const event = await waitForSentryEvent((e) => e.tags?.billing_action === 'checkout');
      expect(eventText(event)).toMatch(/FunctionsFetchError|Failed to send a request/);
    } else {
      // Without synced Stripe prices the tier has no price; that is reported too
      const event = await waitForSentryEvent((e) => eventText(e).includes('No Stripe price for pricing tier'));
      expect(event.level).toBe('warning');
    }
  });
});

test.describe('Sentry (edge functions)', () => {
  test.beforeEach(async ({ request }) => {
    await clearSentryEvents();
    // Skip when the functions report somewhere else (e.g. a real DSN locally)
    const probe = await request.post(`${FUNCTIONS_URL}/stripe_webhook`, {
      headers: { 'Stripe-Signature': 't=1,v1=probe' },
      data: '{"probe":true}'
    });
    expect(probe.status()).toBe(400);
    const reached = await waitForSentryEvent(
      (e) => e.tags?.webhook_failure === 'invalid_signature',
      30_000
    ).catch(() => null);
    test.skip(
      !reached,
      'Edge functions do not report to the capture server: set SENTRY_DSN in supabase/.env.local as in tests/env.local.example'
    );
    await clearSentryEvents();
  });

  test('SF1 a webhook with a bad signature is reported as one grouped warning', async ({ request }) => {
    const payload = JSON.stringify({ id: 'evt_sf1', type: 'product.created' });
    const res = await request.post(`${FUNCTIONS_URL}/stripe_webhook`, {
      headers: { 'Stripe-Signature': signStripePayload(payload, 'whsec_wrong_secret') },
      data: payload
    });
    expect(res.status()).toBe(400);

    const event = await waitForSentryEvent((e) => e.tags?.webhook_failure === 'invalid_signature');
    expect(event.level).toBe('warning');
    expect(event.fingerprint).toEqual(['stripe-webhook-invalid-signature']);
    expect(event.environment).toBe('development');
    expect(JSON.stringify(event)).not.toContain('evt_sf1'); // no request body
  });

  test('SF2 a request without a Stripe signature (not from Stripe) is not reported', async ({ request }) => {
    const res = await request.post(`${FUNCTIONS_URL}/stripe_webhook`, { data: '{}' });
    expect(res.status()).toBe(400);
    // Then a reported one, so there is something to wait for
    await request.post(`${FUNCTIONS_URL}/stripe_webhook`, {
      headers: { 'Stripe-Signature': 't=1,v1=marker' },
      data: '{}'
    });
    await waitForSentryEvent((e) => e.tags?.webhook_failure === 'invalid_signature');
    expect(await sentryEvents()).toHaveLength(1);
  });

  test('SF3 a get_stripe_url failure identifies the user by id only', async ({ request }) => {
    const email = uniqueEmail('sentry-fn');
    const { id, client } = await createSignedInUser(email);
    const token = (await client.auth.getSession()).data.session!.access_token;

    // Authenticated, then fails parsing the body
    const res = await request.post(`${FUNCTIONS_URL}/get_stripe_url`, {
      headers: { Authorization: `Bearer ${token}`, apikey: LOCAL.anonKey, 'Content-Type': 'application/json' },
      data: Buffer.from('not json')
    });
    expect(res.status()).toBe(400);

    const event = await waitForSentryEvent((e) => e.user?.id === id);
    expect(event.user).toEqual({ id });
    expect(JSON.stringify(event)).not.toContain(email);
    expect(JSON.stringify(event)).not.toContain(token);
  });
});
