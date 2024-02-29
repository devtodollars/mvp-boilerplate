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
  final authState = ref.watch(authProvider);
  final user = authState.value;
  return GoRouter(
    navigatorKey: navigatorKey,
    redirect: (context, state) async {
      return authState.when(
        data: (user) {
          if (user == null) return "/login";
          // below are paths we don't redirect to, to prevent loops
          if (["/login", "/loading"].contains(initUrl.path)) return null;
          return initUrl.path;
        },
        error: (_, __) => "/loading",
        loading: () => "/loading",
      );
    },
    routes: <RouteBase>[
      GoRoute(
        name: 'loading',
        path: '/loading',
        builder: (context, state) {
          return const Center(child: CircularProgressIndicator());
        },
      ),
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
