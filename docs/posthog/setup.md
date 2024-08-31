---
sidebar_position: 1
---
# Setup

1. Create an account in [Posthog](https://posthog.com/) and get your posthog client key. It should look something like: `phc_XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX`
2. Update the posthog client key in the following places:
   1. [flutter/web/index.html](https://github.com/devtodollars/flutter-supabase-production-template/blob/main/flutter/web/index.html#L45)
   2. [flutter/ios/Runner/Info.plist](https://github.com/devtodollars/flutter-supabase-production-template/blob/main/flutter/ios/Runner/Info.plist#L51)
   3. [flutter/macos/Runner/Info.plist](https://github.com/devtodollars/flutter-supabase-production-template/blob/main/flutter/macos/Runner/Info.plist#L34)
   4. [flutter/android/app/src/main/AndroidManifest.xml](https://github.com/devtodollars/flutter-supabase-production-template/blob/main/flutter/android/app/src/main/AndroidManifest.xml#L31)
3. Setup [Stripe test environment](../stripe/setup.md) and setup [Supabase local development](../supabase/local-development/pull-changes.md)
4. Run a local version and simulate the following events
   1. `user signs in` -> login to the application
   2. `user signs up` -> sign up for the application
   3. `user starts checkout` -> Craft your [checkout url](../stripe/update-pricing-page.md) (e.g. `localhost:XXXXX/payments?price=price_XXXXX)` which will create a checkout sesssion but in localhost.
   4. `user completes checkout` -> complete the checkout&#x20;
5. Go to Posthog dashboard > Activity and see if the events are populated
