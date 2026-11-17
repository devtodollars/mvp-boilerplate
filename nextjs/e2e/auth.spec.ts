import { expect, Page, test } from '@playwright/test';
import { PASSWORD, uniqueEmail } from './helpers/env';
import { createSignedInUser, sql, waitForAuthLink } from './helpers/services';

const toast = (page: Page, text: string | RegExp) =>
  page.locator('li[role="status"], [data-state="open"]').filter({ hasText: text }).first();

async function fillSignup(page: Page, email: string, pw = PASSWORD, confirm = pw) {
  await page.goto('/auth/signup');
  await page.locator('#email').fill(email);
  await page.locator('#password').fill(pw);
  await page.locator('#confirmPassword').fill(confirm);
  await page.getByRole('button', { name: 'Sign Up' }).click();
}

async function signIn(page: Page, email: string, pw = PASSWORD) {
  await page.goto('/auth/signin');
  await page.locator('#email').fill(email);
  await page.locator('#password').fill(pw);
  await page.getByRole('button', { name: 'Sign In', exact: true }).last().click();
}

const expectSignedIn = (page: Page) =>
  expect(page.getByRole('button', { name: 'Account' }).first()).toBeVisible();

test.describe.serial('Email/password auth (Next.js)', () => {
  const email = uniqueEmail('auth');
  const newPassword = 'N3w-Passw0rd!';

  test('A1 sign-up rejects mismatched passwords', async ({ page }) => {
    await fillSignup(page, uniqueEmail('mismatch'), PASSWORD, 'different');
    await expect(toast(page, 'Passwords do not match')).toBeVisible();
    await expect(page.locator('#confirmPassword')).toBeVisible(); // still on the form
  });

  test('A2 sign-up creates the auth user, the public.users row, and fires on_user_modify', async ({
    page
  }) => {
    const started = new Date();
    await fillSignup(page, email);
    await expect(page.getByText('Verify Your Email')).toBeVisible();
    await expect(page.getByText(`Verification email sent to: ${email}`)).toBeVisible();

    const [authUser] = await sql`select id, email_confirmed_at from auth.users where email = ${email}`;
    expect(authUser, 'auth.users row').toBeTruthy();
    expect(authUser.email_confirmed_at).toBeNull();

    // handle_new_user() trigger
    const [profile] = await sql`select id from public.users where id = ${authUser.id}`;
    expect(profile, 'public.users row from handle_new_user trigger').toBeTruthy();

    // handle_user_modify trigger -> on_user_modify edge function (pg_net)
    await expect
      .poll(
        async () => {
          const rows = await sql`
            select status_code from net._http_response
            where created >= ${started} order by id desc limit 5`;
          return rows.map((r) => r.status_code);
        },
        { message: 'on_user_modify webhook response', timeout: 15_000 }
      )
      .toContain(200);
  });

  test('A3 sign-in before confirming shows the "not verified" message', async ({ page }) => {
    await signIn(page, email);
    await expect(toast(page, 'Your email is not verified')).toBeVisible();
  });

  test('A4 the confirmation email link verifies and signs the user in', async ({ page }) => {
    // PKCE: the code verifier cookie lives in the browser that started sign-up,
    // so start sign-up again here (resends the email), then follow the link.
    const started = new Date();
    await page.goto('/auth/signup');
    await page.locator('#email').fill(email);
    await page.locator('#password').fill(PASSWORD);
    await page.locator('#confirmPassword').fill(PASSWORD);
    await page.getByRole('button', { name: 'Sign Up' }).click();
    await expect(page.getByText('Verify Your Email')).toBeVisible();

    const link = await waitForAuthLink(email, { after: started });
    await page.goto(link);
    await expect(page).toHaveURL(/localhost:\d+\/$/);
    await expectSignedIn(page);

    const [u] = await sql`select email_confirmed_at from auth.users where email = ${email}`;
    expect(u.email_confirmed_at).not.toBeNull();
  });

  test('A5 account page shows the email and no plan; session survives reload', async ({ page }) => {
    await signIn(page, email);
    await expectSignedIn(page);
    await page.goto('/account');
    await expect(page.getByRole('heading', { name: 'Account' })).toBeVisible();
    await expect(page.getByPlaceholder('Email')).toHaveValue(email);
    await expect(page.getByText('You are not currently subscribed to any plan.')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Manage subscription' })).toHaveCount(0);

    await page.reload();
    await expect(page.getByPlaceholder('Email')).toHaveValue(email);

    // Signed-in users are bounced away from the auth pages
    await page.goto('/auth/signin');
    await expect(page).toHaveURL(/localhost:\d+\/$/);
  });

  test('A6 sign-out clears the session', async ({ page }) => {
    await signIn(page, email);
    await expectSignedIn(page);
    await page.goto('/account');
    await page.getByRole('button', { name: 'Sign out' }).click();
    await expect(page).toHaveURL(/localhost:\d+\/$/);
    await expect(page.getByRole('button', { name: 'Sign In' }).first()).toBeVisible();
    await page.goto('/account');
    await expect(page).toHaveURL(/\/auth\/signin$/);
  });

  test('A7 wrong password is rejected', async ({ page }) => {
    await signIn(page, email, 'wrong-password');
    await expect(toast(page, 'Invalid login credentials')).toBeVisible();
    await expect(page.locator('#email')).toBeVisible();
  });

  test('A9 forgot password → email link → update password → sign in with new password', async ({
    page
  }) => {
    const started = new Date();
    await page.goto('/auth/signin');
    await page.getByRole('link', { name: 'Forgot your password?' }).click();
    await expect(page.getByText('Reset Password').first()).toBeVisible();
    await page.locator('#email').fill(email);
    await page.getByRole('button', { name: 'Send Email' }).click();
    await expect(toast(page, 'Email Sent!')).toBeVisible();

    const link = await waitForAuthLink(email, { after: started });
    await page.goto(link);
    await expect(page).toHaveURL(/\/auth\/update_password/);
    await page.locator('#password').fill(newPassword);
    await page.getByRole('button', { name: 'Update Password' }).click();
    await expect(toast(page, 'Password Updated')).toBeVisible();
    await expect(page).toHaveURL(/localhost:\d+\/$/);

    // old password no longer works, new one does
    await page.context().clearCookies();
    await signIn(page, email, PASSWORD);
    await expect(toast(page, 'Invalid login credentials')).toBeVisible();
    await signIn(page, email, newPassword);
    await expectSignedIn(page);
  });

  test('A10 OAuth buttons start the provider redirect via Supabase', async ({ page }) => {
    await page.goto('/auth/signin');
    const [req] = await Promise.all([
      page.waitForRequest((r) => r.url().includes('/auth/v1/authorize?provider=github')),
      page.getByRole('button', { name: 'Github' }).click()
    ]);
    expect(req.url()).toContain('redirect_to=');
  });
});

// Independent of the serial flow above so a failure here doesn't skip it.
test.describe('Duplicate sign-up', () => {
  test('A8 signing up again with a registered email is reported', async ({ page }) => {
    const email = uniqueEmail('dup');
    await createSignedInUser(email);
    await fillSignup(page, email);
    // Older Supabase Auth returns a user with no identities; newer returns
    // 422 user_already_exists. AuthForm handles both (fixed 2026-11-17).
    await expect(toast(page, 'Email Already Registered')).toBeVisible();
    await expect(page.getByText('Verify Your Email')).toHaveCount(0);
  });
});
