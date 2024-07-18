# Flutter Production Boilerplate

## Demo

- https://flutter.devtodollars.com

## Getting Started

Run flutter local web server

1. [Install flutter](https://docs.flutter.dev/get-started/install)
2. In your terminal, run the following commands:

```bash
git clone https://github.com/devtodollars/startup-boilerplate.git YOUR_APP_NAME
cd YOUR_APP_NAME
```

3. Run the local web server.

```bash
cd flutter
flutter run -d chrome --dart-define-from-file=env.json
```

## Pricing

You would normally put your pricing page on your landing page. Below are links to try out how the pricing works in the app.

- [Hobby Plan ($10 / month)](https://flutter.devtodollars.com/payments?price=price_1Pdy8yFttF99a1NCLpDa83xf)
- [Freelancer Plan ($20 / month)](https://flutter.devtodollars.com/payments?price=price_1Pdy8zFttF99a1NCGQJc5ZTZ)

## Stack

- State Management ([riverpod](https://pub.dev/packages/riverpod))
- Routing ([go_router](https://pub.dev/packages/go_router))
