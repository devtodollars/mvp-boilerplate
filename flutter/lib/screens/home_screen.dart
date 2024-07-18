import 'package:devtodollars/services/metadata_notifier.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:devtodollars/services/auth_notifier.dart';

class HomeScreen extends ConsumerStatefulWidget {
  const HomeScreen({super.key, required this.title});

  final String title;

  @override
  ConsumerState<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends ConsumerState<HomeScreen> {
  @override
  Widget build(BuildContext context) {
    final authNotif = ref.watch(authProvider.notifier);
    final metaAsync = ref.watch(metadataProvider);
    return Scaffold(
      appBar: AppBar(
        backgroundColor: Theme.of(context).colorScheme.inversePrimary,
        title: Text(widget.title),
        actions: [
          TextButton(
            onPressed: () => context.replaceNamed("payments"),
            child: const Text("Payments"),
          ),
          TextButton(onPressed: authNotif.signOut, child: const Text("Logout")),
        ],
      ),
      body: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: <Widget>[
            metaAsync.when(
                data: (metadata) {
                  final subscription = metadata?.subscription;
                  return (Text(subscription != null
                      ? "You are currently on the ${subscription.prices?.products?.name} plan."
                      : "You are not currently subscribed to any plan."));
                },
                loading: () => const CircularProgressIndicator(),
                error: (_, __) =>
                    const Text("Failed to load subscription plan")),
          ],
        ),
      ),
    );
  }
}
