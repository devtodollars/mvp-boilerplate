import 'package:devtodollars/models/stripe.dart';
import 'package:devtodollars/models/user_metadata.dart';
import 'package:flutter_test/flutter_test.dart';

/// Rows shaped exactly like PostgREST returns them for
/// `subscriptions.select('*, prices(*, products(*))')` and `users.select('*')`.
final subscriptionRow = <String, dynamic>{
  'id': 'sub_123',
  'user_id': '6b0c1f5e-0000-4000-8000-000000000001',
  'status': 'active',
  'metadata': <String, dynamic>{},
  'price_id': 'price_hobby_month',
  'quantity': 1,
  'cancel_at_period_end': false,
  'created': '2026-11-17T19:00:00+00:00',
  'current_period_start': '2026-11-17T19:00:00+00:00',
  'current_period_end': '2026-12-17T19:00:00+00:00',
  'ended_at': null,
  'cancel_at': null,
  'canceled_at': null,
  'trial_start': null,
  'trial_end': null,
  'prices': {
    'id': 'price_hobby_month',
    'product_id': 'prod_hobby',
    'active': true,
    'description': null,
    'unit_amount': 1000,
    'currency': 'USD',
    'type': 'recurring',
    'interval': 'month',
    'interval_count': 1,
    'trial_period_days': 0,
    'metadata': <String, dynamic>{},
    'products': {
      'id': 'prod_hobby',
      'active': true,
      'name': 'Hobby',
      'description': 'Hobby product description',
      'image': null,
      'metadata': {'index': '0'},
    },
  },
};

void main() {
  group('SubscriptionWithPrice', () {
    test('M1 parses a subscription with nested price and product', () {
      final sub = SubscriptionWithPrice.fromJson(subscriptionRow);
      expect(sub.id, 'sub_123');
      expect(sub.status, 'active');
      expect(sub.cancelAtPeriodEnd, isFalse);
      expect(sub.quantity, 1);
      expect(sub.prices?.unitAmount, 1000);
      expect(sub.prices?.interval, 'month');
      expect(sub.prices?.products?.name, 'Hobby');
    });

    test('M2 round-trips through toJson', () {
      final json = SubscriptionWithPrice.fromJson(subscriptionRow).toJson();
      final again = SubscriptionWithPrice.fromJson(json);
      expect(again.toJson(), json);
    });

    test('M3 tolerates a subscription whose price was deleted', () {
      final row = Map<String, dynamic>.from(subscriptionRow)..['prices'] = null;
      final sub = SubscriptionWithPrice.fromJson(row);
      expect(sub.prices, isNull);
    });
  });

  group('UserMetadata', () {
    test('M4 parses a public.users row (nulls for a new user)', () {
      final meta = UserMetadata.fromJson({
        'id': '6b0c1f5e-0000-4000-8000-000000000001',
        'full_name': null,
        'avatar_url': null,
        'billing_address': null,
        'payment_method': null,
      });
      expect(meta.id, isNotEmpty);
      expect(meta.subscription, isNull);
    });

    test('M5 carries an attached subscription', () {
      final meta = UserMetadata.fromJson({
        'id': 'u1',
        'billing_address': {'city': 'Toronto'},
        'payment_method': {'brand': 'visa', 'last4': '4242'},
        'subscription': subscriptionRow,
      });
      expect(meta.billingAddress?['city'], 'Toronto');
      expect(meta.subscription?.prices?.products?.name, 'Hobby');
    });
  });
}
