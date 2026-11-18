import 'package:devtodollars/services/error_reporting.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:sentry_flutter/sentry_flutter.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

/// Sentry reporting rules for errors the app catches (lib/services/error_reporting.dart).
/// Events are captured by `beforeSend` and dropped, so nothing is sent.
void main() {
  final captured = <SentryEvent>[];

  setUpAll(() async {
    await Sentry.init((options) {
      options.dsn = 'https://public@o0.ingest.sentry.io/0';
      options.beforeSend = (event, hint) {
        captured.add(event);
        return null;
      };
    });
  });

  setUp(captured.clear);
  tearDownAll(Sentry.close);

  group('reportAuthError', () {
    test('FE1 skips user mistakes (4xx)', () async {
      await reportAuthError(
        const AuthException('Invalid login credentials', statusCode: '400'),
        StackTrace.current,
        'email_form',
      );
      await reportAuthError(
        const AuthException('Rate limited', statusCode: '429'),
        StackTrace.current,
        'email_form',
      );
      expect(captured, isEmpty);
    });

    test('FE2 reports server errors (5xx) as errors with the action', () async {
      await reportAuthError(
        const AuthException('Database error saving new user', statusCode: '500'),
        StackTrace.current,
        'email_form',
      );
      expect(captured, hasLength(1));
      expect(captured.single.level, SentryLevel.error);
      expect(captured.single.tags?['auth_action'], 'email_form');
    });

    test('FE3 reports failures with no status (network) as warnings', () async {
      await reportAuthError(
        const AuthException('Failed host lookup'),
        StackTrace.current,
        'recover_password',
      );
      expect(captured.single.level, SentryLevel.warning);
    });
  });

  group('reportBillingError', () {
    test('FE4 skips errors get_stripe_url returned itself (4xx)', () async {
      await reportBillingError(
        const FunctionException(status: 400, details: {'message': 'x'}),
        StackTrace.current,
      );
      expect(captured, isEmpty);
    });

    test('FE5 reports a crashed or missing function (5xx) and network errors', () async {
      await reportBillingError(
        const FunctionException(status: 503),
        StackTrace.current,
      );
      await reportBillingError(
        Exception('Connection refused'),
        StackTrace.current,
      );
      expect(captured, hasLength(2));
      expect(captured.first.tags?['billing_action'], 'get_stripe_url');
    });
  });

  test('FE6 setSentryUser identifies the user by id only', () async {
    final user = User.fromJson({
      'id': '11111111-2222-3333-4444-555555555555',
      'email': 'someone@example.com',
      'app_metadata': <String, dynamic>{},
      'user_metadata': <String, dynamic>{},
      'aud': 'authenticated',
      'created_at': DateTime.now().toIso8601String(),
    })!;
    await setSentryUser(user);
    await Sentry.captureMessage('with user');
    expect(captured.single.user?.id, user.id);
    expect(captured.single.user?.email, isNull);

    await setSentryUser(null);
    await Sentry.captureMessage('signed out');
    expect(captured.last.user, isNull);
  });

  group('scrubUrl', () {
    test('FE7 filters one-time codes and personal data, keeps the rest', () {
      final scrubbed = scrubUrl(
        'https://app.example.com/reset?code=abc123&email=a%40b.com&tab=billing',
      );
      expect(scrubbed, isNot(contains('abc123')));
      expect(scrubbed, isNot(contains('a%40b.com')));
      expect(scrubbed, contains('tab=billing'));
      expect(Uri.parse(scrubbed).queryParameters['code'], '[Filtered]');
    });

    test('FE8 leaves URLs without a query unchanged', () {
      expect(scrubUrl('https://app.example.com/home'), 'https://app.example.com/home');
    });
  });
}
