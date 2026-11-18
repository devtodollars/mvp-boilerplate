import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_web_plugins/url_strategy.dart';
import 'package:sentry_flutter/sentry_flutter.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:devtodollars/services/error_reporting.dart';
import 'package:devtodollars/services/router_notifier.dart';

void main() async {
  usePathUrlStrategy();
  // Sentry starts first so a failure while starting Supabase is reported too.
  await SentryFlutter.init(
    (options) {
      // Sentry is disabled when the DSN is not set
      options.dsn = const String.fromEnvironment('SENTRY_DSN');
      // "development" for debug runs, "production" for release builds, unless
      // set with --dart-define=SENTRY_ENVIRONMENT=... (vercel-build.sh sets
      // Vercel's environment: production or preview)
      options.environment = const String.fromEnvironment('SENTRY_ENVIRONMENT',
          defaultValue: kReleaseMode ? 'production' : 'development');
      // The git commit, set by vercel-build.sh. It must match the release the
      // web source maps are uploaded for.
      const release = String.fromEnvironment('SENTRY_RELEASE');
      if (release.isNotEmpty) options.release = release;
      // Capture every transaction in debug runs, 10% in release builds
      options.tracesSampleRate = kReleaseMode ? 0.1 : 1.0;
      // Never attach IP addresses or other personal data. The signed-in user
      // is identified by Supabase id only (see setSentryUser).
      options.sendDefaultPii = false;
      options.beforeSend = scrubEvent;
    },
    appRunner: () async {
      await Supabase.initialize(
        url: const String.fromEnvironment('SUPABASE_URL'),
        publishableKey: const String.fromEnvironment('SUPABASE_ANON_KEY'),
      );
      runApp(const ProviderScope(child: MyApp()));
    },
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
