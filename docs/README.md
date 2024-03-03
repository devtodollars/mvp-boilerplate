# README

## Flutter / Supabase Production Template for Startups

**Demo**: [https://app.devtodollars.com](https://app.devtodollars.com)

**Free Documentation:** [https://docs.devtodollars.com](https://docs.devtodollars.com)

***

### About Me

I'm Matt, the creator of this boilerplate and a former YC founder. Throughout my journey, I went from $0 - $10k of revenue 2 separate times. Before my third time I wanted to create a startup template for building apps (Flutter / Supabase) to expedite this process. I figured that this template could help a lot of other people as well so I decided to clean it up and share it with the world!

[Follow me on twitter](https://twitter.com/IThinkWong)

***

### Pricing

I open sourced the code but decided to close source the detailed documentation. You could either **spend 20+ hours** piecing together documentation from separate websites or support me and purchase detailed guides to get you up and running as fast as possible.&#x20;

**Early Bird Special:** Prices will go up by $50 on April 20th.&#x20;

| Docs ($99)                              | Docs + Support ($129)                   | 1 Hour Consulting with Matt ($99)       |
| --------------------------------------- | --------------------------------------- | --------------------------------------- |
| Private Documentation                   | Private Documentation                   | Startup Advice / Help                   |
|                                         | 1 Hour Consulting w/ Matt               | Template Troubleshooting / Tips         |
|                                         | Discord community                       |                                         |
| [Buy Now](https://app.devtodollars.com) | [Buy Now](https://app.devtodollars.com) | [Buy Now](https://app.devtodollars.com) |

***

### What's Included:

#### Frontend ([Flutter](https://flutter.dev/))

* State Management ([riverpod](https://pub.dev/packages/riverpod))
* Routing ([go\_router](https://pub.dev/packages/go\_router))
* UI Includes:
  * auth\_screen
  * payments\_screen (to redirect to stripe)
  * home\_screen
* 🚧 frontend tests 🚧

#### Backend ([Supabase](https://supabase.com/))

* Authentication
  * Email + PW
  * 🚧 SSO (Google, Github, Apple, etc.) 🚧
* Fully configured for local development from day one
* 🚧 backend tests 🚧

#### Analytics ([Posthog](https://posthog.com/))

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

#### Payments ([Stripe](https://stripe.com/en-ca))

* Stripe fully setup and works with one-time payments and subscriptions
  * `stripe` table to store `stripe_customer_id` and current `active_products`
  * Stripe webhook to sync user subscriptions from stripe to supabase
  * Deno function to retrieve the billing portal url or a checkout session url which works with the `payments_screen`

#### Release Pipelines ([Github Actions](https://github.com/features/actions))

* Script to `bumpversion.sh` following semantic versioning
* Deploys a web preview on Netlify for every PR&#x20;
* Publishing pipeline to publish to Netlify and to publish supabase functions
* 🚧 Workflow to create signed releases for Android and iOS 🚧

#### 🚧 Error Monitoring ([Sentry](https://sentry.io/welcome/)) 🚧

TODO: based on demand.



