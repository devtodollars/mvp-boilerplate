# Flutter / Supabase Production Template for Startups

**Demo**: [https://app.devtodollars.com](https://app.devtodollars.com)

**Documentation:** [See Pricing](./#pricing)

**Landing**: https://devtodollars.com

***

## Pricing

**Free, open-source code** but paid documentation and support

| Docs ($99)                                                                             | Docs + Support ($129)                                                                  | Consulting ($99/hr)                                                                    |
| -------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| Private Documentation                                                                  | Private Documentation                                                                  | Tech / Startup Advice                                                                  |
| Exclusive Discord Community                                                            | Exclusive Discord Community                                                            | Literally what it says                                                                 |
|                                                                                        | 1 Hour Consulting ($99 value)                                                          |                                                                                        |
|                                                                                        | Discord – Priority Text Support                                                        |                                                                                        |
|                                                                                        | Discord – Weekly Office Hours                                                          |                                                                                        |
| [Buy Now](https://app.devtodollars.com/payments?price=price\_1Oq6bXFttF99a1NCdZqHlQ8J) | [Buy Now](https://app.devtodollars.com/payments?price=price\_1OqIefFttF99a1NCezXvAtcM) | [Buy Now](https://app.devtodollars.com/payments?price=price\_1Oq6ePFttF99a1NCwsJ3JrKJ) |

### Documentation Preview
![DevToDollars Docs Preview](https://github.com/devtodollars/flutter-supabase-production-template/assets/20890995/de22956d-210b-4027-84f5-5640f508d45c)

***

## What's Included:

### Frontend ([Flutter](https://flutter.dev/))

* State Management ([riverpod](https://pub.dev/packages/riverpod))
* Routing ([go\_router](https://pub.dev/packages/go\_router))
* UI Includes:
  * auth\_screen
  * payments\_screen (to redirect to stripe)
  * home\_screen
* 🚧 [frontend tests](https://github.com/devtodollars/flutter-supabase-production-template/issues/4) 🚧

### Backend ([Supabase](https://supabase.com/))

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
