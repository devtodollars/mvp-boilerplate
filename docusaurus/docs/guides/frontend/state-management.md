---
sidebar_position: 2
---
# State Management

## Updating Riverpod Notifiers

We use generated code in `.g.dart` files. When making changes to the providers under `flutter/lib/services` folder, make sure to run below to update the generated code files as well.

```bash
dart run build_runner watch
```

## Helpful Links:

* [Riverpod 2.0 Guide](https://codewithandrea.com/articles/flutter-state-management-riverpod/) -> Basics of riverpod
* [Riverpod Async Notifier](https://codewithandrea.com/articles/flutter-riverpod-async-notifier/) -> Use riverpod with async requests (e.g. database queries)
