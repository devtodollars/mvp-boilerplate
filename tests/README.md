# Regression tests

Everything here runs against a **local** stack: local Supabase (Docker), the
edge functions served locally, the Next.js dev server, and Stripe **test mode**.
Nothing touches production.

Use this after dependency upgrades, schema changes, or anything that touches
auth or billing.

## One-time setup

```bash
cd nextjs && pnpm install && pnpm exec playwright install chromium   # Chrome also works
cd ../flutter && flutter pub get
stripe login            # log into the DevToDollars Stripe account
```

`tests/start-stack.sh` creates `supabase/.env.local` (gitignored) from
`tests/env.local.example` on first run. Put the Stripe **test** key in it:

```bash
stripe config --list | grep test_mode_api_key   # copy the sk_test_… value into STRIPE_SECRET_KEY
```

Without a real `sk_test_` key, the `[stripe]` tests are skipped and everything else still runs.
The suites refuse to run with a live key.

## Running

```bash
tests/start-stack.sh        # terminal 1: Supabase + edge functions (leave running)
tests/run-all.sh            # terminal 2: every check, with a PASS/FAIL summary
tests/run-all.sh --quick    # static checks + unit tests only
```

Individual suites:

| What | Command (from that folder) |
|---|---|
| Next.js / DB / Stripe e2e | `cd nextjs && pnpm test:e2e` (`pnpm test:e2e:ui` to watch, `pnpm test:e2e:report` for the HTML report) |
| One spec or case | `pnpm test:e2e auth` · `pnpm test:e2e -g "S3"` |
| Flutter unit + widget | `cd flutter && flutter test` |
| Flutter web e2e | `cd flutter && flutter test --platform chrome test/e2e --dart-define-from-file=env.local.json` |
| Edge function unit tests | `cd supabase/functions && deno test _tests/` |
| Stripe → DB product sync | see `sync_stripe` in `tests/run-all.sh` |

### Why `SUPABASE_PROJECT_ID=mvp-boilerplate-local`

Other repos on this machine (e.g. eventmate) also use
`project_id = "devtodollars"`, so they share one Docker volume, and
`supabase start` here would restore *their* database. `start-stack.sh` runs this
repo under its own id without editing `config.toml`. Run other Supabase
commands for this repo with the same env var, e.g.
`SUPABASE_PROJECT_ID=mvp-boilerplate-local supabase status`.

### How Stripe webhooks are tested

The e2e suite signs its own webhook payloads with `STRIPE_WEBHOOK_SIGNING_SECRET`
from `supabase/.env.local` and posts them to the local `stripe_webhook` function.
No `stripe listen` is needed. For subscription and checkout events, the object
ids are real Stripe test-mode objects, so the handler fetches real data from
Stripe, as it does in production. To also test live delivery, run
`pnpm stripe:listen` and put the `whsec_…` it prints into `supabase/.env.local`.

### Notes for AI agents running this

When Next.js 16.4.x detects an agent, `next dev` and `next build` stop once with
a security-upgrade notice and continue when re-run within 5 minutes. That
doesn't happen for people or in CI.

---

## Test cases

Status as of **2026-11-17**, on branch `upgrade/nextjs-node-supabase-deps`
after merging `main` and fixing what the first run found. ❌ = failing on
purpose: the test asserts the intended behaviour, so it turns green when the
bug is fixed. "Fixed" notes say what was broken before.

### Next.js: landing & routing (`nextjs/e2e/landing.spec.ts`)

| ID | Case | Status |
|---|---|---|
| L1 | Home page renders hero, features, pricing, FAQ; no uncaught browser errors | ✅ |
| L2 | Pricing cards show prices read from the `products`/`prices` tables | ✅ |
| L2b | A card labelled "/month" shows the **monthly** price | ✅ fixed: `Pricing.tsx` used to take the first USD price of any interval (Freelancer showed $200/month and checked out yearly) |
| L3 | Logged-out "Subscribe Now" → `/auth/signup` | ✅ |
| L4 | Navbar "Sign In" → sign-in form | ✅ |
| L5 | `robots.txt`, `sitemap.xml`, `/api/og` (PNG) respond | ✅ |
| L6 | `/auth` rewrite; unknown auth state → `/auth`; logged-out `/account` → sign-in; logged-out `/auth/update_password` → `/auth` | ✅ |

### Next.js: auth (`nextjs/e2e/auth.spec.ts`)

| ID | Case | Status |
|---|---|---|
| A1 | Sign-up rejects mismatched passwords | ✅ |
| A2 | Sign-up creates `auth.users` + `public.users` (trigger) and calls `on_user_modify` (pg_net → 200) | ✅ (local trigger timeout raised 1s → 5s in `seed.sql`; under test load 1s calls timed out) |
| A3 | Sign-in before confirming → "Your email is not verified" | ✅ |
| A4 | Confirmation email (local inbox) link → `/api/auth_callback` → signed in | ✅ |
| A5 | Account page shows email and "not subscribed"; session survives reload; signed-in users bounced off `/auth/*` | ✅ |
| A6 | Sign-out clears the session; `/account` redirects again | ✅ |
| A7 | Wrong password → "Invalid login credentials" | ✅ |
| A8 | Re-signing-up a registered email → "Email Already Registered" | ✅ fixed: newer Supabase Auth returns `422 user_already_exists`; `AuthForm` now handles that as well as the old empty-identities signal |
| A8b | Re-signing-up a registered but **unconfirmed** email → "not yet verified, we sent a new link" | ✅ (added with the Sentry branch merge) |
| A9 | Forgot password → email → `/api/reset_password` → update password → old password rejected, new one works | ✅ |
| A10 | GitHub OAuth button starts the Supabase `/authorize` redirect | ✅ |

### Database: grants, RLS, triggers (`nextjs/e2e/database.spec.ts`)

| ID | Case | Status |
|---|---|---|
| D1 | All migrations applied (incl. `…000000_grant_data_api_access`, `…000100_cascade_user_deletes`) | ✅ |
| D2 | `handle_new_user` creates a `public.users` row | ✅ |
| D3 | Anonymous: can read products/prices; cannot read users/subscriptions/checkout_sessions/customers | ✅ |
| D4 | A user sees only their own `users` row | ✅ |
| D5 | A user can update their own profile, not someone else's | ✅ |
| D6 | Users cannot read `customers` or insert into `subscriptions`/`products` | ✅ |
| D7 | `service_role` can write billing tables | ✅ (was ❌ before the grants migration) |
| D8 | Deleting an auth user removes their `public.users` row | ✅ fixed by migration `20261117000100_cascade_user_deletes` (FKs lacked `ON DELETE CASCADE`) |

### Stripe & edge functions (`nextjs/e2e/stripe.spec.ts`)

| ID | Case | Status |
|---|---|---|
| W1 | `stripe_webhook` rejects a bad signature (400) | ✅ |
| W2 | Unsupported event type → 400 | ✅ |
| W3 | `product.created` / `price.created` insert rows (currency upper-cased, interval, trial 0) | ✅ |
| W4 | `product.updated` / `price.updated` apply changes | ✅ |
| W5 | `price.deleted` / `product.deleted` remove rows | ✅ |
| W6 | Price for an unknown product retries, then 400, with no orphan row | ✅ |
| G1 | `get_stripe_url` without Authorization → 400 | ✅ |
| G2 | `get_stripe_url` with the anon key (no user) → 400 | ✅ |
| G3 | `get_stripe_url` CORS preflight | ✅ |
| S1 | [stripe] Checkout URL; Stripe customer created once with `supabaseUUID`, mapped in `customers`, reused on 2nd call | ✅ |
| S2 | [stripe] No price → billing portal URL | ✅ |
| S3 | [stripe] `customer.subscription.created` → active row with period dates | ✅ |
| S4 | [stripe] Web app shows "Hobby plan", pricing shows "Subscribed", "Manage subscription" opens the portal | ✅ |
| S5 | [stripe] `cancel_at_period_end` update synced | ✅ |
| S6 | [stripe] `customer.subscription.deleted` → `canceled`; account page drops the plan | ✅ |
| C1 | [stripe] Pricing "Subscribe Now" → real Stripe Checkout (4242 card) → `checkout.session.completed` → `checkout_sessions` + active subscription → account shows plan | ✅ (core flow) |
| C1b | …and the card's billing address / payment method are copied to `public.users` | ✅ fixed: `copyBillingDetailsToCustomer` used to require a phone, which Checkout never collects |
| SY | `sync-stripe.ts` loads active Stripe products/prices into the DB (`tests/run-all.sh`) | ✅ (was ❌ before the grants migration) |

### Sentry error reporting (`nextjs/e2e/sentry.spec.ts`)

The web server and the edge functions report to a local capture server
(`nextjs/e2e/helpers/sentry-capture.ts`, port 9997) instead of Sentry, so test
errors never reach the real projects and the tests read exactly what would be
sent. The edge functions reach it through `SENTRY_DSN` in `supabase/.env.local`
(see `tests/env.local.example`); the SF cases are skipped when it points elsewhere.

| ID | Case | Status |
|---|---|---|
| SE1 | A browser error is sent through the `/monitoring` tunnel, tagged with `NEXT_PUBLIC_SENTRY_ENVIRONMENT` | ✅ |
| SE2 | A signed-in user's errors carry `user: { id }` only (no email); cleared after sign-out | ✅ |
| SE3 | An unexpected `/api/auth_callback` failure is reported (tags `auth_route`, `auth_error_code`); one-time tokens and error text are filtered out of the URL | ✅ |
| SE4 | User-caused auth link failures (`otp_expired`, link opened in another browser: `pkce_code_verifier_not_found`) are not reported | ✅ |
| SE5 | Events carry no cookies, request bodies, auth tokens or passwords | ✅ |
| SE6 | A checkout request that never reaches `get_stripe_url` (network/CORS/not deployed) is reported with `billing_action`; with no synced price, the missing price is reported as a warning | ✅ |
| SF1 | `stripe_webhook` with a bad signature → one grouped warning (`webhook_failure: invalid_signature`), no request body | ✅ (found Sentry's Dedupe dropping repeats of the same failure within one function instance; disabled for the edge functions) |
| SF2 | `stripe_webhook` without a `Stripe-Signature` header (not from Stripe) is not reported | ✅ |
| SF3 | A `get_stripe_url` failure after sign-in carries `user: { id }` only; no email or access token | ✅ |

### Edge function unit tests (`supabase/functions/_tests/`)

| ID | Case | Status |
|---|---|---|
| E1 | `toDateTime` converts Stripe unix seconds | ✅ |
| E2 | No trial for null/undefined/<2 days | ✅ |
| E3 | Trial end = now + (days + 1) | ✅ |

### Flutter (`flutter/test/`)

| ID | Case | Status |
|---|---|---|
| M1–M5 | `SubscriptionWithPrice` / `UserMetadata` parse PostgREST rows, round-trip, tolerate nulls | ✅ |
| W1–W4 | `EmailForm`: default sign-up mode, required fields, invalid email / short password / mismatch, sign-up ⇄ login toggle | ✅ |
| FE1–FE3 | `reportAuthError`: skips 4xx (user mistakes), reports 5xx as errors and no-status (network) as warnings, tagged with the action | ✅ |
| FE4–FE5 | `reportBillingError`: skips 4xx from `get_stripe_url` (reported by the function), reports 5xx and network errors | ✅ |
| FE6 | `setSentryUser` sets the Supabase id only and clears it on sign-out | ✅ |
| FE7–FE8 | `scrubUrl` filters `code`, tokens and `email` from URLs and keeps other parameters | ✅ |
| F-I1 | Web e2e (`test/e2e/`, real app in Chrome): logged-out app opens on the login screen | ✅ |
| F-I2 | Sign-up via EmailForm → "Check your Email!" dialog; `public.users` row created | ✅ |
| F-I3 | Login before confirming → "Email not confirmed" | ✅ |
| F-I4 | After confirming, login → home screen, "not currently subscribed" | ✅ |
| F-I5 | Active subscription in DB → "You are currently on the Hobby plan." | ✅ |
| F-I6 | `getUserStripeLink()` without price → billing portal URL | ✅ |
| F-I7 | `getUserStripeLink(price)` → Stripe Checkout URL | ✅ |
| F-I8 | Logout → login screen | ✅ |

The web e2e test initializes Supabase with in-memory session storage and no
deep-link detection, because plugins aren't registered in the browser test
runner and the defaults hang. Real email delivery and links are covered by the
Next.js suite (A4, A9).

### Static checks (`tests/run-all.sh`)

| Check | Status |
|---|---|
| Next.js production build | ✅ (Next.js 16.4.5, no advisories) |
| Next.js typecheck (`tsc --noEmit`) | ✅ |
| Next.js lint | ✅ fixed (0 errors, 4 older warnings): hCaptcha code from `main` set state in an effect and read refs during render |
| Flutter analyze | ✅ (info-level deprecations only) |
| Flutter web build | ✅ |
| Flutter macOS build | ⚠️ not verifiable here: needs Xcode 16+ (this machine has 15.4); `google_sign_in_ios` (new via `supabase_auth_ui` 0.7.2) doesn't compile with Xcode 15 |
| Edge functions `deno check` | ✅ fixed (main had 31/24/2 errors). Functions now use the SDK's Stripe API version (`2026-10-28.endive`) and read period/quantity from the subscription item |
