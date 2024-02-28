import 'package:supabase_flutter/supabase_flutter.dart';

class AppUser {
  Session session;
  AuthChangeEvent? authEvent;
  String? paymentTier;

  AppUser({
    required this.session,
    this.authEvent,
    this.paymentTier,
  });
}
