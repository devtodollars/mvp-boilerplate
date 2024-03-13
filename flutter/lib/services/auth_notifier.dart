import 'dart:async';

import 'package:flutter/foundation.dart';
import 'package:posthog_flutter/posthog_flutter.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';
import 'package:supabase_flutter/supabase_flutter.dart' as supa;
import 'package:devtodollars/models/app_user.dart';
// ignore: depend_on_referenced_packages
import 'package:path/path.dart' as p;
import 'package:supabase_flutter/supabase_flutter.dart';

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
      final appUser = await refreshUser(authState);

      // capture posthog events for analytics
      if (appUser != null) {
        await Posthog()
            .identify(userId: appUser.session.user.id, userProperties: {
          "email": appUser.session.user.email ?? "",
          "active_products": appUser.activeProducts,
          "stripe_customer_id": appUser.stripeCustomerId ?? "",
        });
      } else {
        await Posthog().reset();
      }
    });

    ref.onDispose(() {
      streamSub.cancel();
      authStateController.close();
    });
    return authStateController.stream;
  }

  supa.SupabaseClient get client => supa.Supabase.instance.client;
  supa.Session? get currentSession => client.auth.currentSession;

  Future<AppUser?> refreshUser(supa.AuthState state) async {
    final session = state.session;
    if (session == null) {
      authStateController.add(null);
      return null;
    }

    final metadata = await client
        .from("stripe")
        .select()
        .eq("user_id", session.user.id)
        .maybeSingle();
    final user = AppUser(
      session: session,
      authEvent: state.event,
      activeProducts: List<String>.from(metadata?["active_products"] ?? []),
      stripeCustomerId: metadata?["stripe_customer_id"],
    );
    authStateController.add(user);
    return user;
  }

  Future<void> signInWithPassword(String email, String password) async {
    await client.auth.signInWithPassword(password: password, email: email);
  }

  Future<void> signInWithOAuth(supa.OAuthProvider provider) async {
    String? baseUrl = (kIsWeb) ? Uri.base.origin : null;
    await client.auth.signInWithOAuth(
      provider,
      redirectTo: baseUrl,
      queryParams: {
        'access_type': 'offline',
        'prompt': 'consent',
      },
    );
  }

  Future<void> signUp(String email, String password) async {
    await client.auth.signUp(password: password, email: email);
  }

  Future<void> recoverPassword(String email) async {
    final resetUrl = p.join(Uri.base.origin, "reset");
    await client.auth.resetPasswordForEmail(email, redirectTo: resetUrl);
  }

  Future<void> updatePassword(String password) async {
    await client.auth.updateUser(
      supa.UserAttributes(
        password: password,
      ),
    );
  }

  Future<Uri?> getUserStripeLink({String? price}) async {
    String? baseUrl = (kIsWeb) ? Uri.base.origin : null;

    var res = await client.functions.invoke("get_stripe_url", body: {
      "return_url": baseUrl,
      "price": price,
    });
    String? redirectUrl = res.data["redirect_url"];
    if (redirectUrl is String) {
      return Uri.parse(redirectUrl);
    }
    return null;
  }

  Future<void> signOut() async {
    await client.auth.signOut();
  }
}
