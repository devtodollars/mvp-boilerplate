import 'package:devtodollars/components/social_auth_button.dart';
import 'package:flutter/material.dart';
import 'package:flutter/foundation.dart';
import 'package:devtodollars/components/email_form.dart';
import 'package:go_router/go_router.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

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
    String? baseUrl = (kIsWeb) ? Uri.base.toString() : null;
    return Scaffold(
      body: Center(
        child: SingleChildScrollView(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            mainAxisAlignment: MainAxisAlignment.center,
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              SocialAuthButton(
                socialProvider: OAuthProvider.github,
                onPressed: () {},
              ),
              const SizedBox(height: 12),
              SocialAuthButton(
                socialProvider: OAuthProvider.google,
                onPressed: () {},
              ),
              const SizedBox(height: 24),
              Column(
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
                      child: const Text("Continue with Email"),
                    ),
                ],
              )
            ],
          ),
        ),
      ),
    );
  }
}
