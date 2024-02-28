import 'package:go_router/go_router.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';
import 'package:test/screens/auth_screen.dart';
import 'package:test/screens/home_screen.dart';
import 'package:test/services/auth_notifier.dart';

part 'router_notifier.g.dart';

@riverpod
GoRouter router(RouterRef ref) {
  // Using riverpod *directly* for authentication redirection.
  final user = ref.watch(authProvider).value;
  return GoRouter(
    redirect: (context, state) async {
      if (user == null) return "/login";
      return null;
    },
    routes: <RouteBase>[
      GoRoute(
        name: 'login',
        path: '/login',
        redirect: (context, state) {
          if (user != null) return "/";
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
      ),
    ],
  );
}
