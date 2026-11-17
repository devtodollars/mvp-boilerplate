import 'dart:async';
import 'dart:js_interop';
import 'dart:js_interop_unsafe';

import 'package:flutter/widgets.dart';
import 'package:web/web.dart' as web;

const isSupported = true;

/// The `hcaptcha` global from https://js.hcaptcha.com/1/api.js (loaded with
/// `render=explicit` in web/index.html), or null until the script has loaded.
JSObject? get _hcaptcha =>
    globalContext.getProperty<JSObject?>('hcaptcha'.toJS);

// The checkbox widget's fixed size.
const _width = 303.0;
const _height = 78.0;

Widget buildHCaptcha({
  required String siteKey,
  required bool dark,
  required ValueChanged<String?> onToken,
  required void Function(VoidCallback) registerReset,
}) {
  return SizedBox(
    width: _width,
    height: _height,
    child: HtmlElementView.fromTagName(
      tagName: 'div',
      onElementCreated: (element) async {
        final container = element as web.HTMLElement;
        final api = await _waitForApi();
        if (api == null) return;

        final params = JSObject()
          ..setProperty('sitekey'.toJS, siteKey.toJS)
          ..setProperty('theme'.toJS, (dark ? 'dark' : 'light').toJS)
          ..setProperty(
              'callback'.toJS, ((String token) => onToken(token)).toJS)
          ..setProperty('expired-callback'.toJS, (() => onToken(null)).toJS)
          ..setProperty('error-callback'.toJS, (() => onToken(null)).toJS);

        final widgetId =
            api.callMethod<JSAny?>('render'.toJS, container, params);
        registerReset(() {
          onToken(null);
          api.callMethod<JSAny?>('reset'.toJS, widgetId);
        });
      },
    ),
  );
}

/// The script loads async, so poll briefly until the global exists.
Future<JSObject?> _waitForApi() async {
  for (var i = 0; i < 100; i++) {
    final api = _hcaptcha;
    if (api != null) return api;
    await Future.delayed(const Duration(milliseconds: 100));
  }
  debugPrint('hCaptcha script failed to load');
  return null;
}
