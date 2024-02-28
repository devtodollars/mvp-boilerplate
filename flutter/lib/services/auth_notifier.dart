import 'dart:async';

import 'package:riverpod_annotation/riverpod_annotation.dart';
import 'package:supabase_flutter/supabase_flutter.dart' as supa;
import 'package:test/models/app_user.dart';

part 'auth_notifier.g.dart';

@Riverpod(keepAlive: true)
class Auth extends _$Auth {
  final StreamController<AppUser?> authStateController =
      StreamController.broadcast();
  bool cancelled = false;

  Auth();

  @override
  Stream<AppUser?> build() {
    final streamSub = client.auth.onAuthStateChange.listen((authState) async {
      await refreshUser(authState);
    });

    ref.onDispose(() {
      streamSub.cancel();
      authStateController.close();
    });
    return authStateController.stream;
  }

  supa.SupabaseClient get client => supa.Supabase.instance.client;
  supa.Session? get currentSession => client.auth.currentSession;

  Future<void> refreshUser(supa.AuthState state) async {
    final session = state.session;
    if (session == null) return authStateController.add(null);
    final user = AppUser(session: session, authEvent: state.event);
    authStateController.add(user);
  }

  Future<void> signInWithPassword(String email, String password) async {
    await client.auth.signInWithPassword(password: password, email: email);
  }

  Future<void> signUp(String email, String password) async {
    await client.auth.signUp(password: password, email: email);
  }

  Future<void> recoverPassword(String email) async {
    final currUrl = Uri.base.origin;
    await client.auth.resetPasswordForEmail(email, redirectTo: currUrl);
  }

  Future<void> updatePassword(String password) async {
    await client.auth.updateUser(
      supa.UserAttributes(
        password: password,
      ),
    );
  }

  Future<void> signOut() async {
    await client.auth.signOut();
  }
}
