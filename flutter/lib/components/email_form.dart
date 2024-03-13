import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:devtodollars/components/recover_password_dialog.dart';
import 'package:devtodollars/services/auth_notifier.dart';

enum AuthAction { signIn, signUp }

class EmailForm extends ConsumerStatefulWidget {
  const EmailForm({super.key});

  @override
  ConsumerState<EmailForm> createState() => _EmailFormState();
}

class _EmailFormState extends ConsumerState<EmailForm> {
  AuthAction action = AuthAction.signUp;
  final TextEditingController emailController = TextEditingController();
  final TextEditingController pwController = TextEditingController();
  final TextEditingController confirmPwController = TextEditingController();

  String errorMessage = '';
  bool loading = false;
  final _formKey = GlobalKey<FormState>();

  String? validateEmailField() {
    final email = emailController.text;
    if (email.isEmpty) {
      return "Email is required";
    }
    // https://stackoverflow.com/a/4964766/13659833
    if (!RegExp(r"^\S+@\S+\.\S+$").hasMatch(email)) {
      return "Invalid email";
    }
    return null;
  }

  String? validatePasswordField() {
    final password = pwController.text;
    if (password.isEmpty) {
      return "Password is required";
    }
    if (password.length < 6) {
      return "Password must be at least 6 characters long";
    }
    return null;
  }

  String? validateConfirmPasswordField() {
    final password = pwController.text;
    final confirmPassword = confirmPwController.text;
    if (confirmPassword.isEmpty) {
      return "Password confirmation is required";
    }
    if (confirmPassword != password) {
      return "Passwords do not match";
    }
    return null;
  }

  void submitForm() async {
    final email = emailController.text;
    final password = pwController.text;
    if (_formKey.currentState!.validate()) {
      try {
        setState(() => loading = true);
        final authNotif = ref.read(authProvider.notifier);

        if (action == AuthAction.signIn) {
          await authNotif.signInWithPassword(email, password);
        } else if (action == AuthAction.signUp) {
          await authNotif.signUp(email, password);
          if (mounted) {
            setState(() => action = AuthAction.signIn);
            showDialog(
              context: context,
              builder: (_) => AlertDialog(
                title: const Text("Check your Email!"),
                content: const Text(
                    "We sent an email from pleasereply@devtodollars.com to verify your email"),
                actions: [
                  TextButton(
                      onPressed: context.pop, child: const Text("Ok Matt."))
                ],
              ),
            );
          }
        }
        if (mounted) setState(() => loading = false);
      } on AuthException catch (e) {
        setState(() {
          loading = false;
          errorMessage = e.message;
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final textTheme = Theme.of(context).textTheme;
    final colorScheme = Theme.of(context).colorScheme;

    return Form(
      key: _formKey,
      child: AutofillGroup(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Text((action == AuthAction.signIn) ? "Login" : "Create an account",
                style: textTheme.titleLarge),
            const SizedBox(height: 16),
            TextFormField(
              controller: emailController,
              enabled: !loading,
              autofocus: true,
              decoration: const InputDecoration(
                  labelText: "Email", border: OutlineInputBorder()),
              validator: (_) => validateEmailField(),
              keyboardType: TextInputType.emailAddress,
              autofillHints: const [AutofillHints.email],
            ),
            const SizedBox(height: 16),
            TextFormField(
              controller: pwController,
              enabled: !loading,
              decoration: const InputDecoration(
                  labelText: "Password", border: OutlineInputBorder()),
              obscureText: true,
              validator: (_) => validatePasswordField(),
              autofillHints: const [AutofillHints.password],
              keyboardType: TextInputType.text,
            ),
            (action == AuthAction.signUp)
                ? Column(
                    children: [
                      const SizedBox(height: 16),
                      TextFormField(
                        controller: confirmPwController,
                        enabled: !loading,
                        decoration: const InputDecoration(
                          labelText: "Confirm Password",
                          border: OutlineInputBorder(),
                        ),
                        obscureText: true,
                        validator: (_) => validateConfirmPasswordField(),
                        autofillHints: const [AutofillHints.password],
                        keyboardType: TextInputType.text,
                      ),
                    ],
                  )
                : const SizedBox(height: 0),
            if (errorMessage.isNotEmpty)
              Padding(
                padding: const EdgeInsets.only(top: 8),
                child: Text(
                  errorMessage,
                  style:
                      textTheme.bodyMedium?.copyWith(color: colorScheme.error),
                ),
              ),
            const SizedBox(height: 16),
            Padding(
              padding: const EdgeInsets.only(bottom: 24),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  TextButton(
                    onPressed: () {
                      setState(() {
                        if (action == AuthAction.signIn) {
                          action = AuthAction.signUp;
                        } else {
                          action = AuthAction.signIn;
                        }
                        errorMessage = "";
                      });
                    },
                    child: Text((action == AuthAction.signIn)
                        ? "Don't have an account?"
                        : "Have an account?"),
                  ),
                  TextButton(
                    onPressed: () {
                      showDialog(
                        context: context,
                        builder: (_) {
                          return RecoverPasswordDialog(
                              email: emailController.text);
                        },
                      );
                    },
                    child: Text(
                      "Forgot Password",
                      style: textTheme.bodyMedium
                          ?.copyWith(color: colorScheme.outline),
                    ),
                  ),
                ],
              ),
            ),
            ElevatedButton(
              onPressed: (loading) ? null : submitForm,
              style: ElevatedButton.styleFrom(
                backgroundColor: colorScheme.primary,
                foregroundColor: colorScheme.onPrimary,
              ),
              child: Padding(
                padding: const EdgeInsets.symmetric(vertical: 10),
                child: Text(
                  (action == AuthAction.signUp) ? "Create Acccount" : "Login",
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
