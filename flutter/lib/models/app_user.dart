import 'package:supabase_flutter/supabase_flutter.dart';

class AppUser {
  Session session;
  AuthChangeEvent? authEvent;
  List<String> oneTimePaymentProducts;
  String? activeSubscriptionProduct;

  AppUser({
    required this.session,
    this.authEvent,
    this.oneTimePaymentProducts = const [],
    this.activeSubscriptionProduct,
  });
}
