---
sidebar_position: 8
---
# Error Logging (Sentry)

[Sentry](https://sentry.io/welcome/) is wired into every part of the boilerplate:

- **Next.js**: browser, Node.js server, and edge runtime. Unhandled errors from React rendering, Server Components, and route handlers are reported automatically, plus the auth and billing failures the app catches and shows to the user.
- **Supabase edge functions**: `get_stripe_url`, `stripe_webhook`, and `on_user_modify` report the errors they catch.
- **Flutter**: uncaught Dart and Flutter framework errors on every platform, plus the auth and billing failures the app catches.

Sentry stays disabled in each of them until you provide a DSN, so nothing is sent while the variables below are empty.

## Setup

1. Create a [Sentry account](https://sentry.io/signup/). The free Developer plan is enough; its quota is shared by all projects in the organization.
2. Create three projects, one per app, so each gets its own issue list, alerts, and release/source map settings:
   - **Next.js** (platform: Next.js)
   - **Edge functions** (platform: Deno)
   - **Flutter** (platform: Flutter)

   Skip the setup wizard Sentry offers (`npx @sentry/wizard`); the integration is already in the code and the wizard would overwrite it. You can also use a single project for everything: paste the same DSN in each place below.
3. Copy each project's **DSN** from **Settings > Projects > your project > Client Keys (DSN)**. It looks like `https://examplePublicKey@o0.ingest.sentry.io/0`. A DSN only allows sending events, so it is safe in client code.
4. Set the variables for each app as described below.

### Next.js

| Variable | Where | Value |
|---|---|---|
| `NEXT_PUBLIC_SENTRY_DSN` | `nextjs/.env` and Vercel | The Next.js project's DSN |
| `NEXT_PUBLIC_SENTRY_ENVIRONMENT` | `nextjs/.env` (`development`) and Vercel Production (`production`) | Tags events so local errors don't trigger production alerts. When empty, Sentry uses Vercel's environment (`production`/`preview`) or `NODE_ENV` |
| `SENTRY_ORG` | Vercel | Your organization slug (the `<slug>` in `<slug>.sentry.io`) |
| `SENTRY_PROJECT` | Vercel | The Next.js project's slug |
| `SENTRY_AUTH_TOKEN` | Vercel only, never committed | An organization token (`sntrys_…`) from **Settings > Auth Tokens** |

The last three upload source maps during `pnpm build`, so production stack traces point at your code instead of minified files. Without them the build skips the upload and continues. The release is set automatically from the git commit. `NEXT_PUBLIC_` variables are inlined at build time, so redeploy after changing them.

### Supabase edge functions

| Variable | Where | Value |
|---|---|---|
| `SENTRY_DSN` | Root `.env`, pushed with `supabase secrets set --env-file .env` | The Deno project's DSN |
| `SENTRY_ENVIRONMENT` | Root `.env` | `production` (the default when unset) |
| `SENTRY_RELEASE` | Set for you | Deploy with `pnpm supabase:deploy-functions` (from `nextjs/`): it sets this secret to the current git commit, then runs `supabase functions deploy`, so Sentry can tell which deploy introduced an error |
| `SENTRY_DEBUG` | Optional | `true` logs what the SDK sends or drops to the function logs |

Locally, `supabase/.env.local` points `SENTRY_DSN` at the test suite's capture server (see [Tests](#tests)). To try the real project locally, put the Deno DSN there instead and restart `supabase functions serve`.

### Flutter

| Variable | Where | Value |
|---|---|---|
| `SENTRY_DSN` | `flutter/env.json` (or `env.local.json`) | The Flutter project's DSN, passed in with `--dart-define-from-file` |
| `SENTRY_ENVIRONMENT` | Optional `--dart-define` | Defaults to `development` for debug runs and `production` for release builds. On Vercel, `vercel-build.sh` uses Vercel's environment; Netlify PR previews use `preview` |
| `SENTRY_ORG`, `SENTRY_PROJECT`, `SENTRY_AUTH_TOKEN` | The Flutter web Vercel project | Upload web source maps after the build (`flutter/vercel-build.sh` runs `sentry_dart_plugin`). `SENTRY_PROJECT` is the Flutter project's slug |

`vercel-build.sh` sets the release to `flutter@<git commit>` for both the app and the uploaded source maps, and deletes the `.map` files from the build afterwards so they aren't served publicly.

## Verify it works

1. **Next.js**: run `pnpm dev`, then in the browser console run `setTimeout(() => { throw new Error('Sentry test') })`.
2. **Edge functions**: with a real DSN in `supabase/.env.local`, send a request with a wrong signature: `curl -X POST -H 'Stripe-Signature: t=1,v1=x' -d '{}' http://127.0.0.1:54321/functions/v1/stripe_webhook`. It is reported as a warning.
3. **Flutter**: run the app with a DSN and temporarily add `throw Exception('Sentry test');` to a button handler.
4. Open **Issues** in the matching Sentry project. Each error shows up within a few seconds.

## What is reported, and what isn't

| Where | Reported | Not reported (user-caused or noise) |
|---|---|---|
| Next.js auth routes (`/api/auth_callback`, `/api/reset_password`) | Unexpected failures, e.g. a wrong redirect URL or email template, tagged `auth_route` and `auth_error_code` | Expired or reused links (`otp_expired`, `flow_state_expired`), links opened in a different browser (`bad_code_verifier`, `pkce_code_verifier_not_found`) |
| Next.js billing (`Pricing.tsx`, `AccountPage.tsx`) | Requests that never reach `get_stripe_url` (network, CORS, not deployed), a missing `redirect_url`, a pricing tier with no synced Stripe price (warning). Tagged `billing_action` | Errors `get_stripe_url` returned itself; the function already reports those |
| Next.js browser | Uncaught errors | `ResizeObserver` loop warnings, aborted requests, errors from browser extensions |
| `stripe_webhook` | Handler failures (tagged with the Stripe event type and id); signed requests that fail verification, as one grouped warning (`webhook_failure: invalid_signature`); a missing signing secret | Requests without a `Stripe-Signature` header (not from Stripe) |
| `get_stripe_url` | Every failure, with the user's id | |
| Flutter auth and billing | Auth 5xx (error) or network failures (warning), tagged `auth_action`; `get_stripe_url` 5xx and network errors | Auth 4xx (wrong password, weak password, rate limits); `get_stripe_url` 4xx (reported by the function) |

**Alerts worth setting up** (Alerts > Create Alert, per project): any new issue in `environment:production`; and in the edge functions project, an alert when `webhook_failure:invalid_signature` occurs more than a few times in an hour. That pattern means `STRIPE_WEBHOOK_SIGNING_SECRET` doesn't match the endpoint in Stripe, and subscriptions have stopped syncing.

## Privacy

- **Users** are identified by their Supabase user id only, never email or name, so Sentry holds no personal data and you can still look the user up in Supabase. Next.js sets it on sign-in and sign-out in the browser and when the server loads the user; the edge functions attach it per event (not globally, since one function instance serves concurrent requests); Flutter sets it from the auth state.
- **Collected data**: Sentry 11 (Next.js, edge functions) collects cookies, request and response bodies, local variables and user details by default. The boilerplate turns these off with `dataCollection`, because they can contain passwords, session tokens and Stripe payloads. Flutter keeps `sendDefaultPii` off.
- **URLs**: one-time auth codes, tokens, `email` and error text are replaced with `[Filtered]` in event and breadcrumb URLs.

## Where the integration lives

### Next.js

- `nextjs/utils/sentry.ts` holds the options shared by all three runtimes (DSN, environment, sample rate, data collection, noise filters, URL scrubbing) and the helpers `setSentryUser`, `reportBillingError` and `reportAuthLinkError`.
- `nextjs/instrumentation-client.ts` initializes Sentry in the browser and sends events through the tunnel at `/monitoring` (`SENTRY_TUNNEL_PATH`), so ad blockers don't drop them.
- `nextjs/sentry.server.config.ts` initializes Sentry on the server and serves the tunnel (`serveTunnelIntegration`). `nextjs/sentry.edge.config.ts` initializes it on the edge runtime. `/monitoring` is excluded from the proxy matcher in `nextjs/proxy.ts`, so forwarding an event does not trigger a Supabase session refresh.
- `nextjs/instrumentation.ts` loads the matching server config and exports `onRequestError`, which reports Server Component and route handler errors.
- `nextjs/app/error.tsx` reports page render errors and shows a "Something went wrong" page inside the normal layout. `nextjs/app/global-error.tsx` handles errors in the root layout itself.
- `nextjs/components/misc/SentryUser.tsx` keeps the browser's Sentry user in sync with the Supabase session. On the server, `getUser` in `nextjs/utils/supabase/queries.ts` and the session refresh in `nextjs/utils/supabase/middleware.ts` set it.
- `nextjs/next.config.mjs` wraps the config with `withSentryConfig` for build-time instrumentation and source map upload.

The sample rate for performance traces is 100% in development and 10% in production.

### Supabase edge functions

- `supabase/functions/_shared/sentry.ts` initializes the [Sentry Deno SDK](https://docs.sentry.io/platforms/javascript/guides/deno/), tags events with the Supabase region and execution id, and exports `captureException(error, { level, userId, tags, fingerprint })`, which reports an error on its own scope and waits for it to be sent before the function returns. Sentry's Dedupe integration is turned off: it drops an event identical to the previous one, which in a long-lived function instance would drop repeats of the same failure from different requests.
- `_shared/request.ts` reports errors from any function built on `clientRequestHandler` or `clientRequestHandlerWithUser` (which covers `get_stripe_url`, with the user's id).
- `stripe_webhook/index.ts` reports webhook handler failures and signature failures as described above.
- `on_user_modify/index.ts` reports anything thrown while handling the auth trigger.

### Flutter

- `flutter/lib/main.dart` starts Sentry before Supabase, so a failure while starting Supabase is reported too, and installs the handlers for uncaught Flutter and Dart errors. On web, `sentry_flutter` loads the Sentry JavaScript SDK from `browser.sentry-cdn.com`; allow it if you add a Content Security Policy.
- `flutter/lib/services/error_reporting.dart` has the reporting rules for caught auth and billing errors, `setSentryUser`, and the URL scrubbing.
- `flutter/vercel-build.sh` and the `sentry:` section of `flutter/pubspec.yaml` set the release and upload web source maps.

`sentry_flutter` is on 9.x. Version 10 requires Swift Package Manager instead of CocoaPods on iOS/macOS and Xcode 16 or newer.

## Tests

`nextjs/e2e/sentry.spec.ts` (cases SE1–SE6 for Next.js, SF1–SF3 for the edge functions) and `flutter/test/error_reporting_test.dart` (FE1–FE8) cover the rules above. Test runs never report to your real Sentry projects: Playwright points the Next.js server at a local capture server, and `supabase/.env.local` points the edge functions at it too. See `tests/README.md`.
