import 'package:devtodollars/models/stripe.dart';

class UserMetadata {
  final String? avatarUrl;
  final Map<String, dynamic>? billingAddress;
  final String? fullName;
  final String id;
  final Map<String, dynamic>? paymentMethod;
  SubscriptionWithPrice? subscription;

  UserMetadata({
    this.avatarUrl,
    this.billingAddress,
    this.fullName,
    required this.id,
    this.paymentMethod,
    this.subscription,
  });

  factory UserMetadata.fromJson(Map<String, dynamic> json) {
    return UserMetadata(
      avatarUrl: json['avatar_url'],
      billingAddress: json['billing_address'],
      fullName: json['full_name'],
      id: json['id'],
      paymentMethod: json['payment_method'],
      subscription: json['subscription'] != null
          ? SubscriptionWithPrice.fromJson(json['subscription'])
          : null,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'avatar_url': avatarUrl,
      'billing_address': billingAddress,
      'full_name': fullName,
      'id': id,
      'payment_method': paymentMethod,
      'subscription': subscription?.toJson(),
    };
  }
}
