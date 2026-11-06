---
sidebar_position: 8
---
# Error Logging (Sentry)

[Sentry](https://sentry.io/welcome/) is wired into every part of the boilerplate so errors from all of them land in one place:

- **Next.js**: browser, Node.js server, and edge runtime. Unhandled errors from React rendering, Server Components, and route handlers are reported automatically, and the auth session proxy reports the errors it swallows.
- **Supabase edge functions**: `get_stripe_url`, `stripe_webhook`, and `on_user_modify` report the errors they catch.
- **Flutter**: uncaught Dart and Flutter framework errors on every platform.

Sentry stays disabled in each of them until you provide a DSN, so nothing is sent while the variables below are empty.

## Setup

1. Create a [Sentry account](https://sentry.io/signup/). The free Developer plan is enough for the boilerplate.
   :::note
   Sentry may ask for a credit card when you pick a paid plan or a trial. If a payment later fails, Sentry emails you and the project keeps working on the free quota.
   :::
2. Create a project and choose **Next.js** as the platform. One project is enough for the whole boilerplate; create a separate **Flutter** project if you prefer to keep mobile errors apart.
3. Copy the project's **DSN**. You can find it later under **Settings > Projects > your project > Client Keys (DSN)**. It looks like `https://examplePublicKey@o0.ingest.sentry.io/0`.
4. Add the DSN in each place it is read:
   - **Next.js**: `NEXT_PUBLIC_SENTRY_DSN` in `nextjs/.env` (or `.env.local` for local development), and in your Vercel project under **Settings > Environment Variables** so production deployments report errors too.
   - **Supabase edge functions**: `SENTRY_DSN` in the root `.env` (or `.env.local` for local development), then push it with `supabase secrets set --env-file .env` as described in the [release docs](./supabase/release.md).
   - **Flutter**: `SENTRY_DSN` in `flutter/env.json` (or `env.local.json`). It is passed in with `--dart-define-from-file` like the other variables.

## Verify it works

1. **Next.js**: run `pnpm dev`, temporarily add `throw new Error('Sentry test');` to a Server Component or route handler, and load that page.
2. **Edge functions**: run `supabase functions serve` and call `get_stripe_url` without an `Authorization` header. The authentication error it returns is also reported.
3. **Flutter**: run the app with `--dart-define-from-file=env.json` and temporarily add `throw Exception('Sentry test');` to a button handler.
4. Open **Issues** in your Sentry project. Each error shows up within a few seconds.

## Source maps (optional)

Without source maps, production stack traces from the Next.js app point at minified code. To upload them during `pnpm build`, set these variables in the environment that runs the build (for example Vercel or CI):

```
SENTRY_ORG="your-org-slug"
SENTRY_PROJECT="your-project-slug"
SENTRY_AUTH_TOKEN="sntrys_..."
```

Create the auth token under **Settings > Auth Tokens** with the `project:releases` and `org:read` scopes. Keep it out of version control. When these variables are missing, the build skips the upload and continues.

## Where the integration lives

### Next.js

- `nextjs/instrumentation-client.ts` initializes Sentry in the browser.
- `nextjs/sentry.server.config.ts` and `nextjs/sentry.edge.config.ts` initialize Sentry on the server and edge runtimes.
- `nextjs/instrumentation.ts` loads the matching server config and exports `onRequestError`, which reports Server Component and route handler errors.
- `nextjs/app/global-error.tsx` reports errors thrown in the root layout.
- `nextjs/utils/supabase/middleware.ts` is the auth session refresh that runs in the proxy. It deliberately catches every error and serves the request unauthenticated instead of returning a 500, and it calls `Sentry.captureException` before doing so, so those failures are reported rather than silent.
- `nextjs/next.config.js` wraps the Next.js config with `withSentryConfig` for build-time instrumentation and source map upload. It also enables `tunnelRoute: '/monitoring'`, so the browser sends events through your own domain instead of `ingest.sentry.io`, which ad blockers commonly block. `/monitoring` is excluded from the proxy matcher in `nextjs/proxy.ts`, so forwarding an event does not trigger a Supabase session refresh.

All three Next.js runtimes read `NEXT_PUBLIC_SENTRY_DSN`, and the sample rate for performance traces is 100% in development and 10% in production. Adjust `tracesSampleRate` in the three config files if you need a different rate.

### Supabase edge functions

- `supabase/functions/_shared/sentry.ts` initializes the [Sentry Deno SDK](https://docs.sentry.io/platforms/javascript/guides/deno/) from `SENTRY_DSN`, tags events with the Supabase region and execution id, and exports `captureException`, which reports an error and waits for it to be sent before the function returns.
- `_shared/request.ts` reports errors from any function built on `clientRequestHandler` or `clientRequestHandlerWithUser`, which covers `get_stripe_url`.
- `stripe_webhook/index.ts` reports webhook handler failures. Requests with an invalid Stripe signature are rejected with a 400 without reporting.
- `on_user_modify/index.ts` reports anything thrown while handling the auth trigger.

### Flutter

- `flutter/lib/main.dart` wraps `runApp` in `SentryFlutter.init`, which reads `SENTRY_DSN` from the dart defines and installs the handlers for uncaught Flutter and Dart errors.
