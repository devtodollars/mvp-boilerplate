# Flutter Production Boilerplate

## Demo

- https://app.devtodollars.com

[![Screenshot of demo](./public/demo.png)](https://subscription-payments.vercel.app/)

## Getting Started

Run flutter local web server

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
4. [Setup your own Supabase instance](../supabase)

## Stack

- State Management ([riverpod](https://pub.dev/packages/riverpod))
- Routing ([go\_router](https://pub.dev/packages/go\_router))
