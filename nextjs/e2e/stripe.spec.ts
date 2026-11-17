import { expect, Page, test } from '@playwright/test';
import { FUNCTIONS_URL, HAS_STRIPE, LOCAL, PASSWORD, uniqueEmail } from './helpers/env';
import {
  createSignedInUser,
  getStripeUrl,
  sendStripeEvent,
  sql,
  stripeApi
} from './helpers/services';

/**
 * Webhook tests sign their own payloads with STRIPE_WEBHOOK_SIGNING_SECRET, so
 * they run without `stripe listen`. Tests marked [stripe] call the real Stripe
 * TEST-mode API and are skipped unless supabase/.env.local has an sk_test_ key.
 */

const now = () => Math.floor(Date.now() / 1000);

const fakeProduct = (id: string, extra: object = {}) => ({
  id,
  object: 'product',
  active: true,
  name: `E2E ${id}`,
  description: 'created by e2e',
  images: [],
  metadata: { e2e: 'true' },
  created: now(),
  ...extra
});

const fakePrice = (id: string, product: string, extra: object = {}) => ({
  id,
  object: 'price',
  active: true,
  currency: 'usd',
  product,
  type: 'recurring',
  unit_amount: 1234,
  recurring: { interval: 'month', interval_count: 1, trial_period_days: null },
  metadata: {},
  created: now(),
  ...extra
});

test.describe('Stripe webhook → database sync (stripe_webhook)', () => {
  const suffix = Date.now();
  const productId = `prod_e2e_${suffix}`;
  const priceId = `price_e2e_${suffix}`;

  test('W1 rejects requests with an invalid signature', async ({ request }) => {
    const res = await request.post(`${FUNCTIONS_URL}/stripe_webhook`, {
      headers: { 'Stripe-Signature': 't=1,v1=deadbeef' },
      data: { type: 'product.created' }
    });
    expect(res.status()).toBe(400);
    expect(await res.text()).toContain('Webhook Error');
  });

  test('W2 ignores event types it does not handle', async () => {
    const res = await sendStripeEvent('customer.created', { id: 'cus_x', object: 'customer' });
    expect(res.status).toBe(400);
    expect(res.text).toContain('Unsupported event type');
  });

  test('W3 product.created / price.created insert rows', async () => {
    expect((await sendStripeEvent('product.created', fakeProduct(productId))).status).toBe(200);
    expect((await sendStripeEvent('price.created', fakePrice(priceId, productId))).status).toBe(200);

    const [p] = await sql`select name, active, metadata from products where id = ${productId}`;
    expect(p).toMatchObject({ name: `E2E ${productId}`, active: true });
    expect(p.metadata).toMatchObject({ e2e: 'true' });

    const [pr] = await sql`select *, unit_amount::int as unit_amount from prices where id = ${priceId}`;
    expect(pr).toMatchObject({
      product_id: productId,
      currency: 'USD', // upper-cased by the sync
      unit_amount: 1234,
      interval: 'month',
      interval_count: 1,
      type: 'recurring',
      trial_period_days: 0
    });
  });

  test('W4 product.updated / price.updated apply changes', async () => {
    await sendStripeEvent('product.updated', fakeProduct(productId, { name: 'Renamed' }));
    await sendStripeEvent('price.updated', fakePrice(priceId, productId, { active: false, unit_amount: 999 }));
    const [p] = await sql`select name from products where id = ${productId}`;
    expect(p.name).toBe('Renamed');
    const [pr] = await sql`select active, unit_amount::int as unit_amount from prices where id = ${priceId}`;
    expect(pr).toMatchObject({ active: false, unit_amount: 999 });
  });

  test('W5 price.deleted / product.deleted remove rows', async () => {
    expect((await sendStripeEvent('price.deleted', fakePrice(priceId, productId))).status).toBe(200);
    expect((await sendStripeEvent('product.deleted', fakeProduct(productId))).status).toBe(200);
    expect(await sql`select 1 from prices where id = ${priceId}`).toHaveLength(0);
    expect(await sql`select 1 from products where id = ${productId}`).toHaveLength(0);
  });

  test('W6 a price for an unknown product fails after retries (no orphan row)', async () => {
    test.slow();
    const orphan = `price_e2e_orphan_${suffix}`;
    const res = await sendStripeEvent('price.created', fakePrice(orphan, `prod_missing_${suffix}`));
    expect(res.status).toBe(400);
    expect(await sql`select 1 from prices where id = ${orphan}`).toHaveLength(0);
  });
});

test.describe('get_stripe_url without a valid user', () => {
  test('G1 rejects a request with no Authorization header', async ({ request }) => {
    const res = await request.post(`${FUNCTIONS_URL}/get_stripe_url`, { data: {} });
    expect(res.status()).toBe(400);
    expect((await res.json()).message).toMatch(/Authorization/);
  });

  test('G2 rejects the anon key (not a user session)', async ({ request }) => {
    const res = await request.post(`${FUNCTIONS_URL}/get_stripe_url`, {
      headers: { Authorization: `Bearer ${LOCAL.anonKey}` },
      data: {}
    });
    expect(res.status()).toBe(400);
  });

  test('G3 answers CORS preflight', async ({ request }) => {
    const res = await request.fetch(`${FUNCTIONS_URL}/get_stripe_url`, { method: 'OPTIONS' });
    expect(res.status()).toBe(200);
    expect(res.headers()['access-control-allow-origin']).toBe('*');
  });
});

// ---------------------------------------------------------------------------
// [stripe] Real Stripe test-mode flows
// ---------------------------------------------------------------------------

async function hobbyMonthlyPrice(): Promise<string> {
  const [row] = await sql`
    select pr.id from prices pr join products p on p.id = pr.product_id
    where p.name = 'Hobby' and pr.active and pr.interval = 'month' and pr.currency = 'USD'
    limit 1`;
  if (!row) throw new Error('No Hobby monthly price in the DB. Run the Stripe sync (tests/README.md).');
  return row.id;
}

async function signInUi(page: Page, email: string) {
  await page.goto('/auth/signin');
  await page.locator('#email').fill(email);
  await page.locator('#password').fill(PASSWORD);
  await page.getByRole('button', { name: 'Sign In', exact: true }).last().click();
  await expect(page.getByRole('button', { name: 'Account' }).first()).toBeVisible();
}

test.describe.serial('[stripe] customers, checkout, portal and subscriptions', () => {
  test.skip(!HAS_STRIPE, 'Set a Stripe sk_test_ key in supabase/.env.local');

  const email = uniqueEmail('stripe');
  let user: Awaited<ReturnType<typeof createSignedInUser>>;
  let customerId: string;
  let subscriptionId: string;
  const cleanup: (() => Promise<unknown>)[] = [];

  test.beforeAll(async () => {
    user = await createSignedInUser(email);
  });

  test.afterAll(async () => {
    for (const fn of cleanup.reverse()) await fn().catch(() => {});
  });

  test('S1 checkout URL creates and links a Stripe customer once', async () => {
    const price = await hobbyMonthlyPrice();
    const first = await getStripeUrl(user.client, { price, return_url: 'http://localhost:3100/' });
    expect(first.error).toBeNull();
    expect(first.data?.redirect_url).toMatch(/^https:\/\/checkout\.stripe\.com\//);

    const [c] = await sql`select stripe_customer_id from customers where id = ${user.id}`;
    customerId = c.stripe_customer_id;
    expect(customerId).toMatch(/^cus_/);
    cleanup.push(() => stripeApi('DELETE', `/customers/${customerId}`));

    const cus = await stripeApi('GET', `/customers/${customerId}`);
    expect(cus.email).toBe(email);
    expect(cus.metadata.supabaseUUID).toBe(user.id);

    const second = await getStripeUrl(user.client, { price, return_url: 'http://localhost:3100/' });
    expect(second.error).toBeNull();
    const [c2] = await sql`select stripe_customer_id from customers where id = ${user.id}`;
    expect(c2.stripe_customer_id).toBe(customerId); // reused, not duplicated
  });

  test('S2 no price → billing portal URL', async () => {
    const res = await getStripeUrl(user.client, { return_url: 'http://localhost:3100/account' });
    expect(res.error).toBeNull();
    expect(res.data?.redirect_url).toMatch(/^https:\/\/billing\.stripe\.com\//);
  });

  test('S3 customer.subscription.created syncs an active subscription', async () => {
    const price = await hobbyMonthlyPrice();
    const pm = await stripeApi('POST', '/payment_methods/pm_card_visa/attach', { customer: customerId });
    const sub = await stripeApi('POST', '/subscriptions', {
      customer: customerId,
      'items[0][price]': price,
      default_payment_method: pm.id
    });
    subscriptionId = sub.id;
    cleanup.push(() => stripeApi('DELETE', `/subscriptions/${subscriptionId}`));
    expect(sub.status).toBe('active');

    const res = await sendStripeEvent('customer.subscription.created', {
      id: sub.id,
      object: 'subscription',
      customer: customerId
    });
    expect(res.status, res.text).toBe(200);

    const [row] = await sql`select * from subscriptions where id = ${subscriptionId}`;
    expect(row).toMatchObject({ user_id: user.id, status: 'active', price_id: price, cancel_at_period_end: false });
    expect(row.current_period_start).toBeInstanceOf(Date);
    expect(row.current_period_end.getTime()).toBeGreaterThan(row.current_period_start.getTime());
  });

  test('S4 the web app shows the plan and opens the billing portal', async ({ page }) => {
    await signInUi(page, email);
    await page.goto('/account');
    await expect(page.getByText('You are currently on the Hobby plan.')).toBeVisible();

    await page.goto('/#pricing');
    await expect(page.getByText('You have an active subscription')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Subscribed' }).first()).toBeDisabled();

    await page.goto('/account');
    await page.getByRole('button', { name: 'Manage subscription' }).click();
    await page.waitForURL(/billing\.stripe\.com/, { timeout: 30_000 });
  });

  test('S5 cancel_at_period_end update is synced', async () => {
    await stripeApi('POST', `/subscriptions/${subscriptionId}`, { cancel_at_period_end: true });
    const res = await sendStripeEvent('customer.subscription.updated', {
      id: subscriptionId,
      object: 'subscription',
      customer: customerId
    });
    expect(res.status).toBe(200);
    const [row] = await sql`select cancel_at_period_end, cancel_at from subscriptions where id = ${subscriptionId}`;
    expect(row.cancel_at_period_end).toBe(true);
    expect(row.cancel_at).not.toBeNull();
  });

  test('S6 customer.subscription.deleted marks it canceled and the app drops the plan', async ({ page }) => {
    await stripeApi('DELETE', `/subscriptions/${subscriptionId}`);
    const res = await sendStripeEvent('customer.subscription.deleted', {
      id: subscriptionId,
      object: 'subscription',
      customer: customerId
    });
    expect(res.status).toBe(200);
    const [row] = await sql`select status, ended_at from subscriptions where id = ${subscriptionId}`;
    expect(row.status).toBe('canceled');
    expect(row.ended_at).not.toBeNull();

    await signInUi(page, email);
    await page.goto('/account');
    await expect(page.getByText('You are not currently subscribed to any plan.')).toBeVisible();
  });
});

test.describe.serial('[stripe] full checkout from the pricing page', () => {
  test.skip(!HAS_STRIPE, 'Set a Stripe sk_test_ key in supabase/.env.local');
  test.slow();
  // Keep Checkout in USD (adaptive pricing would otherwise localize the currency).
  test.use({ locale: 'en-US', timezoneId: 'America/Los_Angeles' });

  const email = uniqueEmail('checkout');
  let userId: string;
  let customerId: string | undefined;

  test.afterAll(async () => {
    if (!customerId) return;
    const subs = await stripeApi('GET', '/subscriptions', { customer: customerId, status: 'all' });
    for (const s of subs.data) if (s.status !== 'canceled') await stripeApi('DELETE', `/subscriptions/${s.id}`).catch(() => {});
    await stripeApi('DELETE', `/customers/${customerId}`).catch(() => {});
  });

  test('C1 Subscribe Now → Stripe Checkout (test card) → checkout.session.completed syncs', async ({ page }) => {
    userId = (await createSignedInUser(email)).id;
    await signInUi(page, email);

    await page.goto('/#pricing');
    const card = page.locator('#pricing .glass-4').filter({ hasText: 'Hobby' });
    await card.getByRole('button', { name: 'Subscribe Now' }).click();
    await page.waitForURL(/checkout\.stripe\.com/, { timeout: 30_000 });

    const [c] = await sql`select stripe_customer_id from customers where id = ${userId}`;
    customerId = c.stripe_customer_id;

    // Stripe-hosted page. Its payment form lives in an iframe; find that frame.
    // (Stripe changes this UI from time to time; adjust labels here if it breaks.)
    let form = page.mainFrame();
    await expect
      .poll(async () => {
        for (const f of page.frames()) {
          if (await f.getByRole('textbox', { name: 'Card number' }).count()) {
            form = f;
            return true;
          }
        }
        return false;
      }, { timeout: 30_000, message: 'Stripe card form' })
      .toBe(true);

    await form.getByRole('textbox', { name: 'Card number' }).fill('4242424242424242');
    await form.getByRole('textbox', { name: /Expiration/ }).fill('12 / 34');
    await form.getByRole('textbox', { name: 'Security code' }).fill('123');
    await form.getByRole('textbox', { name: 'Full name' }).fill('E2E Tester');
    await form.getByRole('combobox', { name: 'Country or region' }).selectOption('US');
    const address = form.getByRole('combobox', { name: 'Address' });
    await address.fill('1 Market St');
    await address.press('Escape'); // dismiss autocomplete suggestions
    await form.getByPlaceholder('City').fill('San Francisco');
    const state = form.locator('select[autocomplete="address-level1"], select[name*="dministrative"]').first();
    if (await state.count()) await state.selectOption('CA');
    await form.getByPlaceholder(/ZIP|Postal/).fill('94105');
    // Opt out of Stripe Link so no phone/OTP step appears.
    const save = form.getByRole('checkbox', { name: /Save my information/ });
    if ((await save.count()) && (await save.isChecked())) await save.uncheck();

    await form.getByRole('button', { name: 'Subscribe' }).click();
    await page.waitForURL(/localhost:3100/, { timeout: 60_000 });

    // Stripe would deliver checkout.session.completed; we replay it signed.
    const sessions = await stripeApi('GET', '/checkout/sessions', { customer: customerId!, limit: 1 });
    const session = sessions.data[0];
    expect(session.status).toBe('complete');
    const res = await sendStripeEvent('checkout.session.completed', {
      id: session.id,
      object: 'checkout.session',
      customer: customerId,
      mode: 'subscription',
      subscription: session.subscription
    });
    expect(res.status, res.text).toBe(200);

    const [cs] = await sql`select * from checkout_sessions where id = ${session.id}`;
    expect(cs).toMatchObject({ user_id: userId, mode: 'subscription', status: 'complete', payment_status: 'paid' });
    const [sub] = await sql`select status from subscriptions where id = ${session.subscription}`;
    expect(sub.status).toBe('active');

    await page.goto('/account');
    await expect(page.getByText('You are currently on the Hobby plan.')).toBeVisible();

    // copyBillingDetailsToCustomer() used to require a phone, which Checkout
    // never collects, so these stayed empty. Fixed 2026-11-17.
    const [u] = await sql`select billing_address, payment_method from users where id = ${userId}`;
    expect(u.billing_address, 'users.billing_address copied from card').not.toBeNull();
    expect(u.payment_method, 'users.payment_method copied from card').not.toBeNull();
  });
});
