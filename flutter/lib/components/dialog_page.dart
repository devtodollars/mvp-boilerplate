import 'package:flutter/material.dart';

class DialogPage<T> extends Page<T> {
  final Widget child;

  const DialogPage({required this.child, super.key});

  @override
  Route<T> createRoute(BuildContext context) {
    return DialogRoute<T>(
      context: context,
      settings: this,
      builder: (context) => child,
      useSafeArea: false,
    );
  }
}
