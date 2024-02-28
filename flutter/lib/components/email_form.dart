import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:test/components/recover_password_dialog.dart';
import 'package:test/services/auth_notifier.dart';

enum AuthAction { signIn, signUp }

class EmailForm extends ConsumerStatefulWidget {
  const EmailForm({super.key});

  @override
  ConsumerState<EmailForm> createState() => _EmailFormState();
}

class _EmailFormState extends ConsumerState<EmailForm> {
  AuthAction action = AuthAction.signUp;
  String email = '';
  String password = '';
  String confirmPassword = '';
  String errorMessage = '';
  bool loading = false;
  final _formKey = GlobalKey<FormState>();

  String? validateEmailField() {
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
    if (password.isEmpty) {
      return "Password is required";
    }
    if (password.length < 6) {
      return "Password must be at least 6 characters long";
    }
    return null;
  }

  String? validateConfirmPasswordField() {
    if (confirmPassword.isEmpty) {
      return "Password confirmation is required";
    }
    if (confirmPassword != password) {
      return "Passwords do not match";
    }
    return null;
  }

  void submitForm() async {
    if (_formKey.currentState!.validate()) {
      try {
        setState(() => loading = true);
        final authNotif = ref.read(authProvider.notifier);

        if (action == AuthAction.signIn) {
          await authNotif.signInWithPassword(email, password);
        } else if (action == AuthAction.signUp) {
          await authNotif.signUp(email, password);
          await authNotif.signInWithPassword(email, password);
        }
        setState(() => loading = false);
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
              enabled: !loading,
              autofocus: true,
              decoration: const InputDecoration(
                  labelText: "Email", border: OutlineInputBorder()),
              onChanged: (String value) {
                setState(() {
                  email = value;
                });
              },
              validator: (_) => validateEmailField(),
              keyboardType: TextInputType.emailAddress,
              autofillHints: const [AutofillHints.email],
            ),
            const SizedBox(height: 16),
            TextFormField(
                enabled: !loading,
                decoration: const InputDecoration(
                    labelText: "Password", border: OutlineInputBorder()),
                obscureText: true,
                onChanged: (String value) {
                  setState(() {
                    password = value;
                  });
                },
                validator: (_) => validatePasswordField(),
                autofillHints: const [AutofillHints.password],
                keyboardType: TextInputType.text),
            (action == AuthAction.signUp)
                ? Column(
                    children: [
                      const SizedBox(height: 16),
                      TextFormField(
                          enabled: !loading,
                          decoration: const InputDecoration(
                            labelText: "Confirm Password",
                            border: OutlineInputBorder(),
                          ),
                          obscureText: true,
                          onChanged: (String value) {
                            setState(() {
                              confirmPassword = value;
                            });
                          },
                          validator: (_) => validateConfirmPasswordField(),
                          autofillHints: const [AutofillHints.password],
                          keyboardType: TextInputType.text),
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
                      if (action == AuthAction.signIn) {
                        setState(() => action = AuthAction.signUp);
                      } else {
                        setState(() => action = AuthAction.signIn);
                      }
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
                          return RecoverPasswordDialog(email: email);
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
