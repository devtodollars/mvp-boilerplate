import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:devtodollars/services/auth_notifier.dart';

class ResetPasswordDialog extends ConsumerStatefulWidget {
  const ResetPasswordDialog({
    super.key,
  });

  @override
  ConsumerState<ResetPasswordDialog> createState() =>
      _ResetPasswordDialogState();
}

class _ResetPasswordDialogState extends ConsumerState<ResetPasswordDialog> {
  String errMessage = '';
  final TextEditingController _textController = TextEditingController();
  final _formKey = GlobalKey<FormState>();

  @override
  Widget build(BuildContext context) {
    return AlertDialog(
      title: const Text("Reset Password"),
      content: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text("Set New Password"),
          const SizedBox(height: 30),
          Form(
            key: _formKey,
            child: TextFormField(
              controller: _textController,
              autofocus: true,
              decoration: const InputDecoration(
                labelText: "Password",
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
          onPressed: Navigator.of(context).pop,
          child: const Text("Cancel"),
        ),
        ElevatedButton(
          child: const Text("Submit"),
          onPressed: () async {
            final authNotif = ref.read(authProvider.notifier);
            try {
              await authNotif.updatePassword(_textController.text);
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
