# Production Boilerplate for Startups

**Community**: [Join Discord](https://discord.gg/8cUHbgAHXH)

## Getting Started

Choose: [Flutter](./flutter/README.md) or [NextJS](./nextjs/README.md)

- [Choose Flutter](./flutter/README.md) if you plan to build or expand into a cross-platform apps (e.g. Uber, Fitbit, Spotify, Tinder, etc.)
- [Choose NextJS](./nextjs/README.md) if you page load speeds are extremely important and web specific libraries are integral to your app (e.g. Amazon, Medium, Ticketmaster, etc.)

Additionally, it's also possible to start with one-platform and move onto the next one depending on your needs. For example, start with Next.JS and then move to Flutter when a mobile app is needed. Both are configured to work straight out of the box.

## What's Included:

### Frontend ([Flutter](./flutter/README.md) or [NextJS](./nextjs/README.md))

### Backend ([Supabase](./supabase/README.md))

* Authentication
  * Email + PW
  * SSO (Google, Github, etc.)
* Fully configured for local development from day one
* 🚧 [backend tests](https://github.com/devtodollars/flutter-supabase-production-template/issues/16) 🚧

### Analytics ([Posthog](https://posthog.com/))

* Unified analytics across frontend and backend based on `user_id`
  * Frontend analytics comes pre-installed for iOS, Android, Web, and MacOS
  * Backend analytics installed and linked to frontend analytics
* Basic events captured:
  * `user signs in`
  * `user signs up`
  * `user deletes account`
  * `user starts checkout`
  * `user opens billing portal`
  * `user completes checkout`

### Payments ([Stripe](https://stripe.com/en-ca))

* Stripe fully setup and works with one-time payments and subscriptions
  * `stripe` table to store `stripe_customer_id` and current `active_products`
  * Stripe webhook to sync user subscriptions from stripe to supabase
  * Deno function to retrieve the billing portal url or a checkout session url which works with the `payments_screen`

### Release ([Github Actions](https://github.com/features/actions))

* Script to `bumpversion.sh` following semantic versioning
* Deploys a web preview on Netlify for every PR
* Publishing pipeline to publish to Netlify and to publish supabase functions
* 🚧 [Workflow to create signed releases for Android and iOS](https://github.com/devtodollars/flutter-supabase-production-template/issues/22) 🚧

### Emails ([Postmark](https://postmarkapp.com/))

* Send transactional emails
* DNS setup to avoid spam folder (DKIM, DMARC, SPF in subdomain)
* Simplify email updates by using postmark templates

### 🚧 Error Monitoring ([Sentry](https://sentry.io/welcome/)) 🚧

TODO: based on [demand](https://github.com/devtodollars/flutter-supabase-production-template/issues/18).
