import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_web_plugins/url_strategy.dart';
import 'package:sentry_flutter/sentry_flutter.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:devtodollars/services/router_notifier.dart';

void main() async {
  usePathUrlStrategy();
  await Supabase.initialize(
    url: const String.fromEnvironment('SUPABASE_URL'),
    anonKey: const String.fromEnvironment('SUPABASE_ANON_KEY'),
  );
  await SentryFlutter.init(
    (options) {
      // Sentry is disabled when the DSN is not set
      options.dsn = const String.fromEnvironment('SENTRY_DSN');
      // Capture 10% of transactions for performance monitoring
      options.tracesSampleRate = 0.1;
    },
    appRunner: () => runApp(const ProviderScope(child: MyApp())),
  );
}

class MyApp extends ConsumerWidget {
  const MyApp({super.key});

  // This widget is the root of your application.
  @override
  Widget build(context, ref) {
    final goRouter = ref.watch(routerProvider);
    return MaterialApp.router(
      title: 'DevToDollars',
      debugShowCheckedModeBanner: false,
      routerConfig: goRouter,
      theme: ThemeData(
        colorScheme: ColorScheme.fromSeed(seedColor: Colors.deepPurple),
        useMaterial3: true,
      ),
      builder: (context, child) => Container(child: child),
    );
  }
}
