---
sidebar_position: 1
slug: /
---
# ▶️  Getting Started

### Welcome to DevToDollars

Here's a quick overview of the boilerplate. Follow along to get your app up and running.

Once you're done, start with [this tutorial](getting-started.md) to launch your project in 5 minutes. Let's get started in **under 2 minutes**. ⚡️

### Run flutter local web server

1. [Install flutter](https://docs.flutter.dev/get-started/install)
2. In your terminal, run the following commands:

```bash
git clone https://github.com/devtodollars/flutter-supabase-production-template.git YOUR_APP_NAME
cd YOUR_APP_NAME
```

3. Run the local web server.

```bash
cd flutter
flutter run -d chrome --dart-define-from-file=env.json
```

:::info
The Supabase backend used is the same one as [https://app.devtodollars.com](https://app.devtodollars.com) . See how to [setup your own backend](services/backend/).
:::
