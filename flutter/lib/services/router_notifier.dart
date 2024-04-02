import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:posthog_flutter/posthog_flutter.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';
import 'package:devtodollars/components/dialog_page.dart';
import 'package:devtodollars/components/reset_password_dialog.dart';
import 'package:devtodollars/screens/auth_screen.dart';
import 'package:devtodollars/screens/home_screen.dart';
import 'package:devtodollars/screens/payments_screen.dart';
import 'package:devtodollars/services/auth_notifier.dart';

part 'router_notifier.g.dart';

// This is crucial for making sure that the same navigator is used
// when rebuilding the GoRouter and not throwing away the whole widget tree.
final navigatorKey = GlobalKey<NavigatorState>();
Uri? initUrl = Uri.base; // needed to set intiial url state

@riverpod
GoRouter router(RouterRef ref) {
  final authState = ref.watch(authProvider);
  return GoRouter(
    initialLocation: initUrl?.path, // DO NOT REMOVE
    navigatorKey: navigatorKey,
    observers: [PosthogObserver()],
    redirect: (context, state) async {
      return authState.when(
        data: (user) {
          // build initial path
          String? path = initUrl?.path;
          final queryString = initUrl?.query.trim() ?? "";
          if (queryString.isNotEmpty && path != null) {
            path += "?$queryString";
          }
          // If user is not authenticated, direct to login screen
          if (user == null && initUrl?.path != '/login') {
            return '/login';
          }
          // If user is authenticated and trying to access login or loading, direct to home
          if (user != null &&
              (initUrl?.path == '/login' || initUrl?.path == '/loading')) {
            return "/";
          }
          // After handling initial redirection, clear initUrl to prevent repeated redirections
          initUrl = null;
          return path;
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
      GoRoute(
        name: 'payments',
        path: '/payments',
        builder: (BuildContext context, GoRouterState state) {
          final qp = state.uri.queryParameters;
          return PaymentsScreen(price: qp["price"]);
        },
      ),
    ],
  );
}
