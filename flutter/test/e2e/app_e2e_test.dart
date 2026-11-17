// End-to-end test of the Flutter (web) app against the local Supabase test stack.
//
//   ../tests/start-stack.sh            # in another terminal
//   flutter test --platform chrome test/e2e --dart-define-from-file=env.local.json
//
// Browser-only: plain `flutter test` (VM) skips this file.
@TestOn('browser')
@Tags(['e2e'])
library;

//
// See ../tests/README.md for the case list (F-I1 … F-I8).
import 'package:devtodollars/main.dart';
import 'package:devtodollars/services/auth_notifier.dart';
import 'package:devtodollars/services/metadata_notifier.dart';
import 'package:devtodollars/services/router_notifier.dart' as router;
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

const supabaseUrl = String.fromEnvironment('SUPABASE_URL');
const anonKey = String.fromEnvironment('SUPABASE_ANON_KEY');
// Default service_role key of every local `supabase start` stack (not a secret).
const serviceRoleKey = String.fromEnvironment(
  'E2E_SERVICE_ROLE_KEY',
  defaultValue:
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU',
);
const password = 'Sup3r-Secret-Pw!';

final email =
    'e2e-flutter-${DateTime.now().millisecondsSinceEpoch}@example.com';
// Auth admin API (listUsers, updateUserById) — authorised by the key itself.
final admin = SupabaseClient(supabaseUrl, serviceRoleKey);
// Table access as service_role. Uses a fixed access token so it can never pick
// up the signed-in user's session (supabase_flutter syncs sessions between
// clients via BroadcastChannel on web).
final adminDb = SupabaseClient(
  supabaseUrl,
  serviceRoleKey,
  accessToken: () async => serviceRoleKey,
);
String? userId;
String? subscriptionId;
bool _initialized = false;

Future<void> startApp(WidgetTester tester) async {
  if (!_initialized) {
    assert(
      supabaseUrl.contains('127.0.0.1') || supabaseUrl.contains('localhost'),
      'Run with --dart-define-from-file=env.local.json (local Supabase only)',
    );
    // Plugins aren't registered in the browser test runner, so the default
    // (plugin-backed) session storage and deep-link detection would hang.
    // Sessions stay in memory for the whole test run instead.
    await real(
      tester,
      () => Supabase.initialize(
        url: supabaseUrl,
        publishableKey: anonKey,
        authOptions: FlutterAuthClientOptions(
          localStorage: const EmptyLocalStorage(),
          pkceAsyncStorage: _MemoryStorage(),
          detectSessionInUri: false,
        ),
      ),
    );
    _initialized = true;
  }
  // The router returns to the URL the app was opened at (Uri.base). In the
  // test runner that's the harness page, so simulate opening the site root.
  router.initUrl = Uri.parse('http://localhost/');
  await tester.pumpWidget(const ProviderScope(child: MyApp()));
}

/// Pumps frames until [finder] matches (network calls happen in real time).
Future<void> pumpUntil(
  WidgetTester tester,
  Finder finder, {
  Duration timeout = const Duration(seconds: 20),
}) async {
  final end = DateTime.now().add(timeout);
  while (DateTime.now().isBefore(end)) {
    // Let real network I/O progress, then render a frame.
    await tester.runAsync(
      () => Future.delayed(const Duration(milliseconds: 200)),
    );
    await tester.pump();
    if (finder.evaluate().isNotEmpty) return;
  }
  final onScreen = find
      .byType(Text)
      .evaluate()
      .map((e) => (e.widget as Text).data)
      .whereType<String>()
      .toList();
  throw TestFailure('Timed out waiting for $finder\nOn screen: $onScreen');
}

/// testWidgets runs in a fake-async zone; real network futures must be
/// awaited through runAsync or they never complete.
Future<T> real<T>(WidgetTester tester, Future<T> Function() fn) async =>
    (await tester.runAsync(fn)) as T;

ProviderContainer container(WidgetTester tester) =>
    ProviderScope.containerOf(tester.element(find.byType(MaterialApp)));

/// Marks the user's email as confirmed, as clicking the email link would.
/// (Email delivery + the link itself are covered by the Next.js suite; dart:io
/// is unavailable on web, so this test uses the admin API instead.)
Future<void> confirmEmail(String id) async {
  await admin.auth.admin.updateUserById(
    id,
    attributes: AdminUserAttributes(emailConfirm: true),
  );
}

Future<void> fillAndSubmit(
  WidgetTester tester, {
  required String button,
  bool confirm = false,
}) async {
  await tester.enterText(find.widgetWithText(TextFormField, 'Email'), email);
  await tester.enterText(
    find.widgetWithText(TextFormField, 'Password'),
    password,
  );
  if (confirm) {
    await tester.enterText(
      find.widgetWithText(TextFormField, 'Confirm Password'),
      password,
    );
  }
  await tester.tap(find.widgetWithText(ElevatedButton, button));
  await tester.pump();
}

void main() {
  testWidgets('F-I1 logged-out app opens on the login screen', (tester) async {
    await startApp(tester);
    await pumpUntil(tester, find.text('or continue with email'));
    expect(find.text('or continue with email'), findsOneWidget);
  });

  testWidgets('F-I2 sign-up creates the user and asks to check email', (
    tester,
  ) async {
    await startApp(tester);
    await pumpUntil(tester, find.text('or continue with email'));
    await tester.tap(find.text('or continue with email'));
    await tester.pump();
    await fillAndSubmit(tester, button: 'Create Acccount', confirm: true);
    await pumpUntil(tester, find.text('Check your Email!'));
    await tester.tap(find.text('OK'));
    await tester.pump();

    final rows = await real(
      tester,
      () => adminDb.from('users').select('id').limit(1000),
    );
    final users = await real(
      tester,
      () => admin.auth.admin.listUsers(perPage: 1000),
    );
    userId = users.firstWhere((u) => u.email == email).id;
    expect(
      rows.map((r) => r['id']),
      contains(userId),
      reason: 'public.users row from handle_new_user trigger',
    );
  });

  testWidgets('F-I3 login before confirming the email is refused', (
    tester,
  ) async {
    await startApp(tester);
    await pumpUntil(tester, find.text('or continue with email'));
    await tester.tap(find.text('or continue with email'));
    await tester.pump();
    await tester.tap(find.text('Have an account?'));
    await tester.pump();
    await fillAndSubmit(tester, button: 'Login');
    await pumpUntil(tester, find.textContaining('Email not confirmed'));
  });

  testWidgets('F-I4 after confirming, login shows the home screen (no plan)', (
    tester,
  ) async {
    await real(tester, () => confirmEmail(userId!));
    await startApp(tester);
    await pumpUntil(tester, find.text('or continue with email'));
    await tester.tap(find.text('or continue with email'));
    await tester.pump();
    await tester.tap(find.text('Have an account?'));
    await tester.pump();
    await fillAndSubmit(tester, button: 'Login');
    await pumpUntil(
      tester,
      find.text('You are not currently subscribed to any plan.'),
    );
    expect(find.text('Payments'), findsOneWidget);
    expect(find.text('Logout'), findsOneWidget);
  });

  testWidgets('F-I5 an active subscription in the DB shows the plan name', (
    tester,
  ) async {
    final price = await real(
      tester,
      () => adminDb
          .from('prices')
          .select('id, products!inner(name)')
          .eq('products.name', 'Hobby')
          .eq('interval', 'month')
          .limit(1)
          .maybeSingle(),
    );
    expect(
      price,
      isNotNull,
      reason:
          'Hobby monthly price missing; run the Stripe sync (tests/README.md)',
    );
    subscriptionId = 'sub_e2e_flutter_${DateTime.now().millisecondsSinceEpoch}';
    final now = DateTime.now().toUtc();
    await real(
      tester,
      () => adminDb.from('subscriptions').insert({
        'id': subscriptionId,
        'user_id': userId,
        'status': 'active',
        'price_id': price!['id'],
        'created': now.toIso8601String(),
        'current_period_start': now.toIso8601String(),
        'current_period_end': now
            .add(const Duration(days: 30))
            .toIso8601String(),
      }),
    );

    await startApp(tester); // session from F-I4 is still in memory
    container(tester).invalidate(metadataProvider);
    await pumpUntil(tester, find.text('You are currently on the Hobby plan.'));
  });

  testWidgets('F-I6 get_stripe_url returns a billing portal link (no price)', (
    tester,
  ) async {
    await startApp(tester);
    await pumpUntil(tester, find.text('Logout'));
    final notifier = container(tester).read(authProvider.notifier);
    final url = await real(tester, () => notifier.getUserStripeLink());
    expect(url?.host, 'billing.stripe.com');
  });

  testWidgets('F-I7 get_stripe_url returns a checkout link for a price', (
    tester,
  ) async {
    // On native platforms getUserStripeLink sends return_url = null, and the
    // edge function passes that straight to Stripe as success_url.
    await startApp(tester);
    await pumpUntil(tester, find.text('Logout'));
    final price = await real(
      tester,
      () => adminDb
          .from('prices')
          .select('id, products!inner(name)')
          .eq('products.name', 'Freelancer')
          .eq('interval', 'month')
          .limit(1)
          .single(),
    );
    final notifier = container(tester).read(authProvider.notifier);
    final url = await real(
      tester,
      () => notifier.getUserStripeLink(price: price['id'] as String),
    );
    expect(url?.host, 'checkout.stripe.com');
  });

  testWidgets('F-I8 logout returns to the login screen', (tester) async {
    await startApp(tester);
    await pumpUntil(tester, find.text('Logout'));
    await tester.tap(find.text('Logout'));
    await pumpUntil(tester, find.text('or continue with email'));

    if (subscriptionId != null) {
      await real(
        tester,
        () => adminDb.from('subscriptions').delete().eq('id', subscriptionId!),
      );
    }
  });
}

class _MemoryStorage extends GotrueAsyncStorage {
  final _items = <String, String>{};
  @override
  Future<String?> getItem({required String key}) async => _items[key];
  @override
  Future<void> removeItem({required String key}) async => _items.remove(key);
  @override
  Future<void> setItem({required String key, required String value}) async =>
      _items[key] = value;
}
