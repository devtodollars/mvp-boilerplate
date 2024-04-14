import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:devtodollars/services/auth_notifier.dart';
import 'package:url_launcher/url_launcher.dart';

class PaymentsScreen extends ConsumerStatefulWidget {
  final String? price; // stripe price
  const PaymentsScreen({super.key, this.price});

  @override
  ConsumerState<PaymentsScreen> createState() => _PaymentsScreenState();
}

class _PaymentsScreenState extends ConsumerState<PaymentsScreen> {
  @override
  void initState() {
    WidgetsBinding.instance.addPostFrameCallback((_) async {
      final authNotif = ref.read(authProvider.notifier);
      final url = await authNotif.getUserStripeLink(price: widget.price);
      if (url == null) {
        if (mounted) {
          showDialog(
            context: context,
            builder: (_) => AlertDialog(
              title: const Text("Failed to open checkout portal"),
              content: Text(
                  "Error getting stripe checkout portal for price: ${widget.price}"),
              actions: [
                TextButton(onPressed: context.pop, child: const Text("Ok"))
              ],
            ),
          );
        }
        return;
      }
      launchUrl(url, webOnlyWindowName: "_self");
    });
    super.initState();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const CircularProgressIndicator(),
            const SizedBox(height: 20),
            const Text(
              "You are being redirected to Stripe for payment.\nPlease wait a moment...",
              textAlign: TextAlign.center,
              style: TextStyle(
                fontSize: 16,
              ),
            ),
            const SizedBox(height: 40),
            TextButton(
              onPressed: () => context.replaceNamed('home'),
              child: const Text("Return to Home"),
            ),
          ],
        ),
      ),
    );
  }
}
