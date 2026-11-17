import 'package:flutter/material.dart';

import 'hcaptcha_stub.dart' if (dart.library.js_interop) 'hcaptcha_web.dart'
    as impl;

/// hCaptcha site key, passed via `--dart-define-from-file=env.json`.
/// When empty the captcha is skipped (e.g. local dev without CAPTCHA enabled
/// in Supabase > Auth > Attack Protection).
const hCaptchaSiteKey = String.fromEnvironment('HCAPTCHA_SITE_KEY');

/// Whether a captcha token must be collected before calling Supabase auth.
/// Only web is supported; native platforms need a WebView-based widget.
bool get hCaptchaEnabled => hCaptchaSiteKey.isNotEmpty && impl.isSupported;

/// Lets the parent reset the widget. hCaptcha tokens are single-use, so call
/// [reset] after every auth request.
class HCaptchaController {
  VoidCallback? _reset;
  void reset() => _reset?.call();
}

class HCaptcha extends StatelessWidget {
  const HCaptcha({
    super.key,
    required this.controller,
    required this.onToken,
  });

  final HCaptchaController controller;

  /// Called with a token when solved, and with null when it expires or errors.
  final ValueChanged<String?> onToken;

  @override
  Widget build(BuildContext context) {
    if (!hCaptchaEnabled) return const SizedBox.shrink();
    return impl.buildHCaptcha(
      siteKey: hCaptchaSiteKey,
      dark: Theme.of(context).brightness == Brightness.dark,
      onToken: onToken,
      registerReset: (fn) => controller._reset = fn,
    );
  }
}
