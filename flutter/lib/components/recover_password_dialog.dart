import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:devtodollars/services/auth_notifier.dart';

class RecoverPasswordDialog extends ConsumerStatefulWidget {
  const RecoverPasswordDialog({
    super.key,
    required this.email,
  });

  final String email;

  @override
  ConsumerState<RecoverPasswordDialog> createState() =>
      _RecoverPasswordDialogState();
}

class _RecoverPasswordDialogState extends ConsumerState<RecoverPasswordDialog> {
  String errMessage = '';
  final TextEditingController _emailController = TextEditingController();
  final _formKey = GlobalKey<FormState>();

  @override
  void initState() {
    _emailController.text = widget.email;
    super.initState();
  }

  @override
  Widget build(BuildContext context) {
    final authNotif = ref.read(authProvider.notifier);
    return AlertDialog(
      title: const Text("Recover Password"),
      content: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          const Text(
              "Get instructions sent to this email that explain how to reset your password"),
          const SizedBox(height: 30),
          Form(
            key: _formKey,
            child: TextFormField(
              controller: _emailController,
              autofocus: true,
              decoration: const InputDecoration(
                labelText: "Email",
                border: OutlineInputBorder(),
              ),
              validator: (_) {
                if (errMessage.isEmpty) {
                  return null;
                }
                return errMessage;
              },
            ),
          )
        ],
      ),
      actions: [
        TextButton(
          child: const Text("Cancel"),
          onPressed: () {
            Navigator.of(context).pop();
          },
        ),
        ElevatedButton(
          child: const Text("Send"),
          onPressed: () async {
            try {
              await authNotif.recoverPassword(_emailController.text);
              if (context.mounted) Navigator.of(context).pop();
            } on AuthException catch (e) {
              setState(() {
                errMessage = e.message;
              });
              _formKey.currentState!.validate();
            }
          },
        )
      ],
    );
  }
}
