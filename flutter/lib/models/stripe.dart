class SubscriptionWithPrice {
  final String? cancelAt;
  final bool? cancelAtPeriodEnd;
  final String? canceledAt;
  final String created;
  final String currentPeriodEnd;
  final String currentPeriodStart;
  final String? endedAt;
  final String id;
  final Map<String, dynamic>? metadata;
  final String? priceId;
  final int? quantity;
  final String? status;
  final String? trialEnd;
  final String? trialStart;
  final String userId;
  final PriceWithProduct? prices;

  SubscriptionWithPrice({
    this.cancelAt,
    this.cancelAtPeriodEnd,
    this.canceledAt,
    required this.created,
    required this.currentPeriodEnd,
    required this.currentPeriodStart,
    this.endedAt,
    required this.id,
    this.metadata,
    this.priceId,
    this.quantity,
    this.status,
    this.trialEnd,
    this.trialStart,
    required this.userId,
    this.prices,
  });

  factory SubscriptionWithPrice.fromJson(Map<String, dynamic> json) {
    return SubscriptionWithPrice(
      cancelAt: json['cancel_at'],
      cancelAtPeriodEnd: json['cancel_at_period_end'],
      canceledAt: json['canceled_at'],
      created: json['created'],
      currentPeriodEnd: json['current_period_end'],
      currentPeriodStart: json['current_period_start'],
      endedAt: json['ended_at'],
      id: json['id'],
      metadata: json['metadata'],
      priceId: json['price_id'],
      quantity: json['quantity'],
      status: json['status'],
      trialEnd: json['trial_end'],
      trialStart: json['trial_start'],
      userId: json['user_id'],
      prices: json['prices'] != null
          ? PriceWithProduct.fromJson(json['prices'])
          : null,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'cancel_at': cancelAt,
      'cancel_at_period_end': cancelAtPeriodEnd,
      'canceled_at': canceledAt,
      'created': created,
      'current_period_end': currentPeriodEnd,
      'current_period_start': currentPeriodStart,
      'ended_at': endedAt,
      'id': id,
      'metadata': metadata,
      'price_id': priceId,
      'quantity': quantity,
      'status': status,
      'trial_end': trialEnd,
      'trial_start': trialStart,
      'user_id': userId,
      'prices': prices?.toJson(),
    };
  }
}

class PriceWithProduct {
  final bool? active;
  final String? currency;
  final String? description;
  final String id;
  final String? interval;
  final int? intervalCount;
  final Map<String, dynamic>? metadata;
  final String? productId;
  final int? trialPeriodDays;
  final String? type;
  final int? unitAmount;
  final Product? products;

  PriceWithProduct({
    this.active,
    this.currency,
    this.description,
    required this.id,
    this.interval,
    this.intervalCount,
    this.metadata,
    this.productId,
    this.trialPeriodDays,
    this.type,
    this.unitAmount,
    this.products,
  });

  factory PriceWithProduct.fromJson(Map<String, dynamic> json) {
    return PriceWithProduct(
      active: json['active'],
      currency: json['currency'],
      description: json['description'],
      id: json['id'],
      interval: json['interval'],
      intervalCount: json['interval_count'],
      metadata: json['metadata'],
      productId: json['product_id'],
      trialPeriodDays: json['trial_period_days'],
      type: json['type'],
      unitAmount: json['unit_amount'],
      products:
          json['products'] != null ? Product.fromJson(json['products']) : null,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'active': active,
      'currency': currency,
      'description': description,
      'id': id,
      'interval': interval,
      'interval_count': intervalCount,
      'metadata': metadata,
      'product_id': productId,
      'trial_period_days': trialPeriodDays,
      'type': type,
      'unit_amount': unitAmount,
      'products': products?.toJson(),
    };
  }
}

class Product {
  final bool? active;
  final String? description;
  final String id;
  final String? image;
  final Map<String, dynamic>? metadata;
  final String? name;

  Product({
    this.active,
    this.description,
    required this.id,
    this.image,
    this.metadata,
    this.name,
  });

  factory Product.fromJson(Map<String, dynamic> json) {
    return Product(
      active: json['active'],
      description: json['description'],
      id: json['id'],
      image: json['image'],
      metadata: json['metadata'],
      name: json['name'],
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'active': active,
      'description': description,
      'id': id,
      'image': image,
      'metadata': metadata,
      'name': name,
    };
  }
}
