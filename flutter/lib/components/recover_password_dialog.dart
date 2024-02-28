import 'package:flutter/material.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

class RecoverPasswordDialog extends StatefulWidget {
  const RecoverPasswordDialog({
    super.key,
    required this.email,
    required this.onResetPassword,
  });

  final String email;
  final Function onResetPassword;

  @override
  State<RecoverPasswordDialog> createState() => _RecoverPasswordDialogState();
}

class _RecoverPasswordDialogState extends State<RecoverPasswordDialog> {
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
              Navigator.of(context).pop();
              await widget.onResetPassword(_emailController.text);
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
