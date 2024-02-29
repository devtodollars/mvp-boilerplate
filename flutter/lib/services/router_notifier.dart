import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';
import 'package:test/components/dialog_page.dart';
import 'package:test/components/reset_password_dialog.dart';
import 'package:test/screens/auth_screen.dart';
import 'package:test/screens/home_screen.dart';
import 'package:test/services/auth_notifier.dart';

part 'router_notifier.g.dart';

// This is crucial for making sure that the same navigator is used
// when rebuilding the GoRouter and not throwing away the whole widget tree.
final navigatorKey = GlobalKey<NavigatorState>();
final initUrl = Uri.base; // necessary for pw reset

@riverpod
GoRouter router(RouterRef ref) {
  // Using riverpod *directly* for authentication redirection.
  final user = ref.watch(authProvider).value;
  return GoRouter(
    navigatorKey: navigatorKey,
    redirect: (context, state) async {
      if (user == null) return "/login";
      if (initUrl.path == "/login") return null;
      return initUrl.path;
    },
    routes: <RouteBase>[
      GoRoute(
        name: 'login',
        path: '/login',
        redirect: (context, state) {
          if (user != null) return "/";
          if (initUrl.path == "/") return null;
          return null;
        },
        builder: (context, state) {
          return const AuthScreen();
        },
      ),
      GoRoute(
        name: 'home',
        path: '/',
        builder: (context, state) {
          return const HomeScreen(title: "DevToDollars");
        },
        routes: [
          GoRoute(
            name: 'reset',
            path: 'reset',
            pageBuilder: (_, __) {
              return const DialogPage(child: ResetPasswordDialog());
            },
          )
        ],
      ),
    ],
  );
}
