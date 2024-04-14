# Production Boilerplate for Startups

[See documentation to get started](https://resources.devtodollars.com/docs)

## Additional Support
Support me by purchasing premium support from yours truly :)


| Code + Docs (**$0**)                                             | Premium Support (**$49**)                                                                 | I'll Build Your MVP (**$5000~**)                                         |
| ---------------------------------------------------------------- | ----------------------------------------------------------------------------------------- | ------------------------------------------------------------------------ |
| ✓ Code                                                           | ✓ 30 Min Setup Call                                                                       | ✓ Completed MVP                                                          |
| ✓ Documentation                                                  | ✓ Premium Discord Support                                                                 | ✓ Technical Co-founder                                                   |
| ✓ Discord Community                                              | ✓ Weekly Office Hours                                                                     |                                                                          |
| ✓ Life-time Updates                                              | ✓ Support Matt                                                                            |                                                                          |
| [View Code](https://github.com/devtodollars/startup-boilerplate) | [Buy Now](https://flutter.devtodollars.com/payments?price=price_1P3MEnFttF99a1NCjNcCLLvA) | [Book a Call](https://usemotion.com/meet/ithinkwong/mvp-consulting?d=30) |

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

### Emails ([Postmark](https://postmarkapp.com/))

- Send transactional emails
- DNS setup to avoid spam folder (DKIM, DMARC, SPF in subdomain)
- Simplify email updates by using postmark templates

### 🚧 [Blog / Docs](https://github.com/devtodollars/startup-boilerplate/issues/56) ([Nextra](https://nextra.site/)) 🚧

### 🚧 [Error Monitoring](https://github.com/devtodollars/flutter-supabase-production-template/issues/18) ([Sentry](https://sentry.io/welcome/)) 🚧

