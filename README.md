# Flutter Production Template for Startups

**Demo**: [https://app.devtodollars.com](https://app.devtodollars.com)

**Docs**: [See Pricing Below](#Pricing)

**Community**: [Join Discord](https://discord.gg/NH8u36Rwxh)

## Pricing

Either spend *13+ hours* piecing together documentation from separate websites or support me and get started in **under 30 minutes**

🎁 **Early Bird Special**: Use code `MARCH30` to get 50% OFF (Expires March 30th, 2024)

| Docs (**$99**)                                                                        | Docs + Support (**$129**)                                                             | I'll Build Your MVP (**$5000**)                                      |
| ------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------- | -------------------------------------------------------------------- |
| ✓ Private Documentation                                                                 | ✓ Private Documentation                                                                 | ✓ Technical Co-founder                                                 |
|                                                       | ✓ Discord – Text Support                                                      | ✓ Completed MVP                                                        |
|                                                                                       | ✓ Discord – Weekly Office Hours                                               | ✓ Landing Page                                                         |
|                                                                                       | ✓ 30 min Consulting ($50 value)                                                         | ✓ Code Documentation                                                   |
| [Buy Now](https://app.devtodollars.com/payments?price=price_1Oq6bXFttF99a1NCdZqHlQ8J) | [Buy Now](https://app.devtodollars.com/payments?price=price_1OqIefFttF99a1NCezXvAtcM) | [Book a Call](https://usemotion.com/meet/ithinkwong/consulting?d=30) |

**Note**: Click "Buy Now" to see how the payment redirection works in the demo

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
