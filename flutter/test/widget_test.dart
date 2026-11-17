import 'package:devtodollars/components/email_form.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';

/// EmailForm validation runs before any Supabase call, so these tests need no
/// backend. End-to-end auth is covered in integration_test/app_test.dart.
Widget harness() => const ProviderScope(
      child: MaterialApp(
        home: Scaffold(body: SingleChildScrollView(child: EmailForm())),
      ),
    );

Finder field(String label) => find.widgetWithText(TextFormField, label);

void main() {
  testWidgets('W1 starts on "Create an account" with a confirm field',
      (tester) async {
    await tester.pumpWidget(harness());
    expect(find.text('Create an account'), findsOneWidget);
    expect(field('Confirm Password'), findsOneWidget);
    expect(find.text('Create Acccount'), findsOneWidget); // (sic) button label
  });

  testWidgets('W2 empty submit shows required-field errors', (tester) async {
    await tester.pumpWidget(harness());
    await tester.tap(find.text('Create Acccount'));
    await tester.pump();
    expect(find.text('Email is required'), findsOneWidget);
    expect(find.text('Password is required'), findsOneWidget);
    expect(find.text('Password confirmation is required'), findsOneWidget);
  });

  testWidgets('W3 rejects a bad email, short password and mismatch',
      (tester) async {
    await tester.pumpWidget(harness());
    await tester.enterText(field('Email'), 'not-an-email');
    await tester.enterText(field('Password'), '123');
    await tester.enterText(field('Confirm Password'), '1234');
    await tester.tap(find.text('Create Acccount'));
    await tester.pump();
    expect(find.text('Invalid email'), findsOneWidget);
    expect(find.text('Password must be at least 6 characters long'),
        findsOneWidget);
    expect(find.text('Passwords do not match'), findsOneWidget);
  });

  testWidgets('W4 toggles between sign-up and login', (tester) async {
    await tester.pumpWidget(harness());
    await tester.tap(find.text('Have an account?'));
    await tester.pump();
    expect(find.text('Login'), findsNWidgets(2)); // title + button
    expect(field('Confirm Password'), findsNothing);
    await tester.tap(find.text("Don't have an account?"));
    await tester.pump();
    expect(find.text('Create an account'), findsOneWidget);
  });
}
