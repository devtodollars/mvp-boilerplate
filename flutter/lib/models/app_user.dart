import 'package:supabase_flutter/supabase_flutter.dart';

class AppUser {
  Session session;
  AuthChangeEvent? authEvent;

  AppUser({
    required this.session,
    this.authEvent,
  });
}
