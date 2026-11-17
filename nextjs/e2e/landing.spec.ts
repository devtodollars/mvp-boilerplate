import { expect, test } from '@playwright/test';
import { sql } from './helpers/services';

test.describe('Landing page & public routes', () => {
  test('L1 home page renders every section without page errors', async ({
    page
  }) => {
    const errors: string[] = [];
    page.on('pageerror', (e) => errors.push(e.message));

    await page.goto('/');
    await expect(page.locator('h1').first()).toBeVisible();
    for (const id of ['features', 'pricing', 'faq']) {
      await expect(page.locator(`#${id}`)).toBeVisible();
    }
    await expect(page.getByRole('heading', { name: 'Get Unlimited Access' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Sign In' }).first()).toBeVisible();
    expect(errors, 'uncaught errors in the browser').toEqual([]);
  });

  test('L2 pricing cards show prices synced from Stripe into the database', async ({
    page
  }) => {
    const rows = await sql<{ name: string; unit_amount: number }[]>`
      select p.name, pr.unit_amount from products p
      join prices pr on pr.product_id = p.id
      where p.active and pr.active and pr.currency = 'USD' and p.name in ('Hobby', 'Freelancer')`;
    test.skip(rows.length === 0, 'No Hobby/Freelancer prices synced (run the Stripe sync first).');

    await page.goto('/#pricing');
    for (const name of ['Hobby', 'Freelancer']) {
      const amounts = rows.filter((r) => r.name === name).map((r) => `$${r.unit_amount / 100}`);
      const card = page.locator('#pricing .glass-4').filter({ hasText: name });
      // The card picks one of the product's USD prices; any of them proves the DB read works.
      await expect(card.locator('.text-3xl')).toHaveText(new RegExp(`^\\$(${amounts.map((a) => a.slice(1)).join('|')})$`));
      await expect(card.getByRole('button', { name: 'Subscribe Now' })).toBeEnabled();
    }
  });

  test('L2b each card labelled "/month" shows the MONTHLY price', async ({ page }) => {
    // Regression test: Pricing.tsx used to pick the first USD price of any
    // interval (Freelancer showed its yearly $200 as "/month"). Fixed 2026-11-17.
    const rows = await sql<{ name: string; unit_amount: string }[]>`
      select p.name, pr.unit_amount from products p
      join prices pr on pr.product_id = p.id
      where p.active and pr.active and pr.currency = 'USD' and pr.interval = 'month'
        and p.name in ('Hobby', 'Freelancer')`;
    test.skip(rows.length === 0, 'No monthly Hobby/Freelancer prices synced.');

    await page.goto('/#pricing');
    for (const { name, unit_amount } of rows) {
      const card = page.locator('#pricing .glass-4').filter({ hasText: name });
      await expect(card, `${name} card price`).toContainText(
        new RegExp(`\\$${Number(unit_amount) / 100}\\s*/month`)
      );
    }
  });

  test('L3 logged-out "Subscribe Now" sends the visitor to sign up', async ({ page }) => {
    await page.goto('/#pricing');
    const card = page.locator('#pricing .glass-4').filter({ hasText: 'Hobby' });
    await card.getByRole('button', { name: 'Subscribe Now' }).click();
    await expect(page).toHaveURL(/\/auth\/signup$/);
    await expect(page.getByText('Sign Up', { exact: true }).first()).toBeVisible();
  });

  test('L4 navbar "Sign In" opens the sign-in form', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Sign In' }).first().click();
    await expect(page).toHaveURL(/\/auth(\/signin)?$/);
    await expect(page.locator('#email')).toBeVisible();
  });

  test('L5 robots.txt, sitemap.xml and the OG image route respond', async ({ request }) => {
    const robots = await request.get('/robots.txt');
    expect(robots.status()).toBe(200);
    expect(await robots.text()).toMatch(/User-Agent/i);

    const sitemap = await request.get('/sitemap.xml');
    expect(sitemap.status()).toBe(200);
    expect(await sitemap.text()).toContain('<urlset');

    const og = await request.get('/api/og');
    expect(og.status()).toBe(200);
    expect(og.headers()['content-type']).toContain('image/png');
  });

  test('L6 auth routing: /auth rewrite, unknown state, protected pages', async ({ page }) => {
    await page.goto('/auth');
    await expect(page.locator('#email')).toBeVisible();

    await page.goto('/auth/not-a-real-state');
    await expect(page.locator('#email')).toBeVisible(); // redirected to /auth

    await page.goto('/account');
    await expect(page).toHaveURL(/\/auth\/signin$/);

    await page.goto('/auth/update_password');
    await expect(page).toHaveURL(/\/auth$/);
  });
});
