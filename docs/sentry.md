---
sidebar_position: 8
---
# Error Logging (Sentry)

The Next.js app ships with [Sentry](https://sentry.io/welcome/) wired in for the browser, the Node.js server, and the edge runtime. Unhandled errors from React rendering, Server Components, route handlers, and the proxy are reported automatically. Sentry stays disabled until you provide a DSN, so nothing is sent while the environment variable is empty.

## Setup

1. Create a [Sentry account](https://sentry.io/signup/). The free Developer plan is enough for the boilerplate.
   :::note
   Sentry may ask for a credit card when you pick a paid plan or a trial. If a payment later fails, Sentry emails you and the project keeps working on the free quota.
   :::
2. Create a new project and choose **Next.js** as the platform.
3. Copy the project's **DSN**. You can find it later under **Settings > Projects > your project > Client Keys (DSN)**. It looks like `https://examplePublicKey@o0.ingest.sentry.io/0`.
4. Add the DSN to `nextjs/.env` (or `.env.local` for local development):
   ```
   NEXT_PUBLIC_SENTRY_DSN="https://examplePublicKey@o0.ingest.sentry.io/0"
   ```
5. Add the same `NEXT_PUBLIC_SENTRY_DSN` variable to your Vercel project under **Settings > Environment Variables** so production deployments report errors too.

## Verify it works

1. Run the app with `pnpm dev` and open it in your browser.
2. Trigger an error, for example by temporarily adding `throw new Error('Sentry test');` to a Server Component or route handler and loading that page.
3. Open **Issues** in your Sentry project. The error shows up within a few seconds.

## Source maps (optional)

Without source maps, production stack traces point at minified code. To upload them during `pnpm build`, set these variables in the environment that runs the build (for example Vercel or CI):

```
SENTRY_ORG="your-org-slug"
SENTRY_PROJECT="your-project-slug"
SENTRY_AUTH_TOKEN="sntrys_..."
```

Create the auth token under **Settings > Auth Tokens** with the `project:releases` and `org:read` scopes. Keep it out of version control. When these variables are missing, the build skips the upload and continues.

## Where the integration lives

- `nextjs/instrumentation-client.ts` initializes Sentry in the browser.
- `nextjs/sentry.server.config.ts` and `nextjs/sentry.edge.config.ts` initialize Sentry on the server and edge runtimes.
- `nextjs/instrumentation.ts` loads the matching server config and exports `onRequestError`, which reports Server Component, route handler, and proxy errors.
- `nextjs/app/global-error.tsx` reports errors thrown in the root layout.
- `nextjs/next.config.js` wraps the Next.js config with `withSentryConfig` for build-time instrumentation and source map upload. It also enables `tunnelRoute: '/monitoring'`, so the browser sends events through your own domain instead of `ingest.sentry.io`, which ad blockers commonly block.

All runtimes read the DSN from `NEXT_PUBLIC_SENTRY_DSN`, and the sample rate for performance traces is 100% in development and 10% in production. Adjust `tracesSampleRate` in the three config files if you need a different rate.
