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
      await refreshUser(authState.session);
    });
    // ensure finish building
    // SchedulerBinding.instance.addPostFrameCallback((_) async {
    //   await refreshUser(currentSession);
    // });

    ref.onDispose(() {
      streamSub.cancel();
      authStateController.close();
    });
    return authStateController.stream;
  }

  supa.SupabaseClient get client => supa.Supabase.instance.client;
  supa.Session? get currentSession => client.auth.currentSession;

  Future<void> refreshUser(supa.Session? session) async {
    if (session == null) return authStateController.add(null);
    final user = AppUser(session: session);
    authStateController.add(user);
  }

  // Future<void> updateMetadata(UserMetadata metadata) async {
  //   metadata = metadata;
  //   await client.from("user_metadata").upsert(metadata.toMap());
  //   captureEvent("user updates metadata", properties: {
  //     "\$set": {
  //       "name": metadata.name,
  //       "occupation": metadata.occupation,
  //       "standardized_test": metadata.standardizedTest,
  //     }
  //   });
  //   await refreshUser(currentSession);
  // }

  // Future<void> signInWithGoogle(String? redirectTo,
  //     {String? referralId}) async {
  //   bool isGood = await client.auth.signInWithOAuth(
  //     supa.Provider.google,
  //     redirectTo: redirectTo,
  //   );
  //   if (isGood) {
  //     captureEvent(
  //       "user signs in",
  //       properties: {
  //         "provider": "google",
  //         if (referralId != null) "referralId": referralId,
  //       },
  //     );
  //   }
  // }

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

  // Future<Uri?> getUserStripeLink({String? type, String? tier}) async {
  //   Uri baseUri = Uri.base;
  //   String baseUrl = Uri(
  //           scheme: baseUri.scheme,
  //           host: baseUri.host,
  //           port: baseUri.hasPort ? baseUri.port : null)
  //       .toString();
  //
  //   var res = await client.functions.invoke("get_user_stripe_link", body: {
  //     "success_url": baseUrl,
  //     "cancel_url": baseUrl,
  //     "return_url": baseUrl,
  //     "type": type,
  //     "tier": tier,
  //   });
  //   throwException(res);
  //   String? redirectUrl = res.data["redirect_url"];
  //   if (redirectUrl is String) {
  //     return Uri.parse(redirectUrl);
  //   }
  //   return null;
  // }

  // void captureEvent(String event,
  //     {Map<String, dynamic> properties = const {}}) {
  //   String? alias;
  //   // posthog should automatically track the distinct id across different subdomains
  //   if (kIsWeb) {
  //     try {
  //       alias = context["posthog"].callMethod("get_distinct_id");
  //     } catch (e) {
  //       debugPrint('Failed to get_distinct_id from posthog: $e');
  //     }
  //   }
  //   client.functions.invoke("posthog_capture", body: {
  //     "alias": alias,
  //     "event": event,
  //     "properties": properties,
  //   });
  // }
}
