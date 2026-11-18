import 'package:sentry_flutter/sentry_flutter.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

/// Errors the app catches and shows to the user are not reported to Sentry
/// automatically. These helpers report the ones that point at a bug or an
/// outage, and skip the ones the user caused.

/// Reports an auth failure unless the user caused it. Supabase Auth answers
/// user mistakes (wrong password, weak password, unconfirmed email, rate limit)
/// with a 4xx; a 5xx or no status (network) means something is broken.
Future<void> reportAuthError(
  AuthException error,
  StackTrace stackTrace,
  String action,
) async {
  final status = int.tryParse(error.statusCode ?? '');
  if (status != null && status < 500) return;
  await Sentry.captureException(
    error,
    stackTrace: stackTrace,
    withScope: (scope) {
      scope.setTag('auth_action', action);
      scope.level = status == null ? SentryLevel.warning : SentryLevel.error;
    },
  );
}

/// Reports a failed get_stripe_url call. A 4xx means the function ran and
/// returned an error, which it reports itself. A 5xx (function crashed or not
/// deployed) or any other error (network) never reached that code.
Future<void> reportBillingError(Object error, StackTrace stackTrace) async {
  if (error is FunctionException && error.status < 500) return;
  await Sentry.captureException(
    error,
    stackTrace: stackTrace,
    withScope: (scope) => scope.setTag('billing_action', 'get_stripe_url'),
  );
}

/// Identifies the signed-in user on events by Supabase id only, never email.
Future<void> setSentryUser(User? user) async {
  await Sentry.configureScope(
    (scope) => scope.setUser(user == null ? null : SentryUser(id: user.id)),
  );
}

// Query parameters that can carry one-time auth codes or personal data, e.g.
// the `code` in a password reset or email confirmation link.
const _sensitiveParams = {
  'code',
  'token',
  'token_hash',
  'access_token',
  'refresh_token',
  'error_description',
  'email',
};

String scrubUrl(String url) {
  final uri = Uri.tryParse(url);
  if (uri == null || !uri.hasQuery) return url;
  final params = uri.queryParametersAll.map(
    (key, values) => MapEntry(
      key,
      _sensitiveParams.contains(key)
          ? values.map((_) => '[Filtered]').toList()
          : values,
    ),
  );
  return uri.replace(queryParameters: params).toString();
}

/// Removes sensitive query parameters from the page URL on an event.
SentryEvent scrubEvent(SentryEvent event, Hint hint) {
  final request = event.request;
  if (request?.url != null) request!.url = scrubUrl(request.url!);
  if (request?.queryString != null) {
    request!.queryString = scrubUrl('?${request.queryString}').split('?').last;
  }
  return event;
}
