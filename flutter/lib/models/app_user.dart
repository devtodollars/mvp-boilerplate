import 'package:supabase_flutter/supabase_flutter.dart';

class AppUser {
  Session session;
  AuthChangeEvent? authEvent;
  List<String> activeProducts;

  AppUser({
    required this.session,
    this.authEvent,
    this.activeProducts = const [],
  });
}
