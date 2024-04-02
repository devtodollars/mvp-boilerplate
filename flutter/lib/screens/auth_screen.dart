import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:devtodollars/components/email_form.dart';
import 'package:go_router/go_router.dart';
import 'package:supabase_auth_ui/supabase_auth_ui.dart';

final Uri initUrl = Uri.base;

class AuthScreen extends StatefulWidget {
  const AuthScreen({super.key});

  @override
  State<AuthScreen> createState() => _AuthScreenState();
}

class _AuthScreenState extends State<AuthScreen> {
  bool showEmailForm = false;
  handleSignUpComplete(BuildContext context) {
    if (!context.mounted) return;
    showDialog(
      context: context,
      builder: (_) => AlertDialog(
        title: const Text("Check your Email!"),
        content: const Text(
            "We sent an email from pleasereply@devtodollars.com to verify your email"),
        actions: [
          TextButton(onPressed: context.pop, child: const Text("Ok Matt."))
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Center(
        child: SingleChildScrollView(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            mainAxisAlignment: MainAxisAlignment.center,
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              SupaSocialsAuth(
                socialProviders: const [
                  OAuthProvider.github,
                  OAuthProvider.google
                ],
                onSuccess: (_) {},
                showSuccessSnackBar: false,
                redirectUrl: (kIsWeb) ? initUrl.toString() : null,
              ),
              const SizedBox(height: 16),
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 4),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    if (showEmailForm)
                      const Padding(
                        padding: EdgeInsets.only(bottom: 16),
                        child: Divider(),
                      ),
                    if (showEmailForm)
                      const EmailForm()
                    else
                      TextButton(
                        onPressed: () => setState(() => showEmailForm = true),
                        child: const Text("or continue with email"),
                      ),
                  ],
                ),
              )
            ],
          ),
        ),
      ),
    );
  }
}
