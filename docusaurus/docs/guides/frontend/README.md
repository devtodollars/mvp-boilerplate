# Frontend (Flutter)

## Setup

Not much to setup here outside of the [getting started ](../../)guide.

## Flutter Project Structure

* `/flutter/android,ios,linux,macos,web,windows` -> Directories containing native code
* `/flutter/lib`
  * `/flutter/lib/screens` -> A container for components that is typically passed into the router
  * `/flutter/lib/components` -> Components that are contained within the screens
  * `/flutter/lib/services` -> Utility or [state management](state-management.md) classes are stored here
  * `/flutter/lib/models` -> Class or interface definitions that are passed around
* `/flutter/env.json` -> Environment variables for production
* `/flutter/env.local.json` -> Environment variables for [local development](../backend/supabase-local-development.md)
* `/flutter/bumpversion.sh` -> Script used for [upgrading the app version](../release.md)

:::warning
Do NOT put sensitive keys into `env.json` or `env.local.json`
:::

## Helpful Links

* [https://docs.flutter.dev/get-started/install](https://docs.flutter.dev/get-started/install)
