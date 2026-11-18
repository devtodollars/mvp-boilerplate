# Production MVP Boilerplate

## 👉 [See documentation to get started](https://resources.devtodollars.com/docs) 👈
- [Flutter Demo](https://flutter.devtodollars.com)
- [NextJS Demo](https://nextjs.devtodollars.com)
- Building a startup? [Join the tech founder community](https://discord.gg/6q63Xa6SEB)

## What's Included:

### Mobile / Desktop / Web App ([Flutter](./flutter/README.md))

- State Management ([riverpod](https://pub.dev/packages/riverpod))
- Routing ([go_router](https://pub.dev/packages/go_router))
- Payments with Stripe
- Authentication with Supabase
- 🚧 [Frontend Tests](https://github.com/devtodollars/flutter-supabase-production-template/issues/4) 🚧
- 🚧 [Adjustable Theme](https://github.com/devtodollars/startup-boilerplate/issues/40) 🚧

### Landing Page / Web App ([NextJS](./nextjs/README.md))

- App Router
- Typescript
- Payments with Stripe
- Authentication with Supabase
- 🚧 [Landing Page Template](https://github.com/devtodollars/startup-boilerplate/issues/54) 🚧

### Backend ([Supabase](./supabase/README.md))

-  Authentication
  - Email + PW
  - SSO (Google, Github, etc.)
- Fully configured for local development from day one
- 🚧 [backend tests](https://github.com/devtodollars/flutter-supabase-production-template/issues/16) 🚧
- Test
### Analytics ([Posthog](https://posthog.com/))

- Unified analytics across frontend and backend based on `user_id`
  - Frontend analytics comes pre-installed for iOS, Android, Web, and MacOS
  - Backend analytics installed and linked to frontend analytics
- Basic events captured:
  - `user signs in`
  - `user signs up`
  - `user deletes account`
  - `user starts checkout`
  - `user opens billing portal`
  - `user completes checkout`

### Payments ([Stripe](https://stripe.com/en-ca))

- Stripe fully setup and works with one-time payments and subscriptions
  - `stripe` table to store `stripe_customer_id` and current `active_products`
  - Stripe webhook to sync user subscriptions from stripe to supabase
  - Deno function to retrieve the billing portal url or a checkout session url which works with the `payments_screen`

### Release ([Github Actions](https://github.com/features/actions))

- Script to `bumpversion.sh` following semantic versioning
- Deploys a web preview on Netlify for every PR
- Publishing pipeline to publish to Netlify and to publish supabase functions
- 🚧 [Automated Mobile Publishing](https://github.com/devtodollars/flutter-supabase-production-template/issues/22) 🚧

### Emails ([Loops.so](https://loops.so))

- Send transactional emails with Loops.so
- Template-based emails with variable support
- Contact management and event-triggered campaigns
- Built-in analytics and deliverability tracking

### Error Monitoring ([Sentry](https://sentry.io/welcome/))

- Sentry wired into the Next.js app (browser, server, and edge runtimes), the Supabase edge functions, and the Flutter app
- Unhandled errors from React rendering, Server Components, and route handlers are reported automatically, and the auth proxy and edge functions report the errors they catch
- Disabled until a DSN is set (`NEXT_PUBLIC_SENTRY_DSN` for Next.js, `SENTRY_DSN` for edge functions and Flutter), so local development stays quiet by default

