import 'package:flutter/widgets.dart';

const isSupported = false;

Widget buildHCaptcha({
  required String siteKey,
  required bool dark,
  required ValueChanged<String?> onToken,
  required void Function(VoidCallback) registerReset,
}) =>
    const SizedBox.shrink();
