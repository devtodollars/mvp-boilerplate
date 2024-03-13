import 'package:devtodollars/services/auth_notifier.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:font_awesome_flutter/font_awesome_flutter.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

// adapted from https://github.com/supabase-community/flutter-auth-ui/blob/main/lib/src/components/supa_socials_auth.dart
extension on OAuthProvider {
  IconData get iconData => switch (this) {
        OAuthProvider.apple => FontAwesomeIcons.apple,
        OAuthProvider.azure => FontAwesomeIcons.microsoft,
        OAuthProvider.bitbucket => FontAwesomeIcons.bitbucket,
        OAuthProvider.discord => FontAwesomeIcons.discord,
        OAuthProvider.facebook => FontAwesomeIcons.facebook,
        OAuthProvider.figma => FontAwesomeIcons.figma,
        OAuthProvider.github => FontAwesomeIcons.github,
        OAuthProvider.gitlab => FontAwesomeIcons.gitlab,
        OAuthProvider.google => FontAwesomeIcons.google,
        OAuthProvider.linkedin => FontAwesomeIcons.linkedin,
        OAuthProvider.slack => FontAwesomeIcons.slack,
        OAuthProvider.spotify => FontAwesomeIcons.spotify,
        OAuthProvider.twitch => FontAwesomeIcons.twitch,
        OAuthProvider.twitter => FontAwesomeIcons.xTwitter,
        _ => Icons.close,
      };

  Color get btnBgColor => switch (this) {
        OAuthProvider.apple => Colors.black,
        OAuthProvider.azure => Colors.blueAccent,
        OAuthProvider.bitbucket => Colors.blue,
        OAuthProvider.discord => Colors.purple,
        OAuthProvider.facebook => const Color(0xFF3b5998),
        OAuthProvider.figma => const Color.fromRGBO(241, 77, 27, 1),
        OAuthProvider.github => Colors.black,
        OAuthProvider.gitlab => Colors.deepOrange,
        OAuthProvider.google => Colors.white,
        OAuthProvider.kakao => const Color(0xFFFFE812),
        OAuthProvider.keycloak => const Color.fromRGBO(0, 138, 170, 1),
        OAuthProvider.linkedin => const Color.fromRGBO(0, 136, 209, 1),
        OAuthProvider.notion => const Color.fromRGBO(69, 75, 78, 1),
        OAuthProvider.slack => const Color.fromRGBO(74, 21, 75, 1),
        OAuthProvider.spotify => Colors.green,
        OAuthProvider.twitch => Colors.purpleAccent,
        OAuthProvider.twitter => Colors.black,
        OAuthProvider.workos => const Color.fromRGBO(99, 99, 241, 1),
        // ignore: unreachable_switch_case
        _ => Colors.black,
      };

  String get capitalizedName => name[0].toUpperCase() + name.substring(1);
}

class RawSocialAuthButton extends StatelessWidget {
  final OAuthProvider socialProvider;
  final VoidCallback? onPressed;
  final bool colored;
  const RawSocialAuthButton({
    super.key,
    required this.socialProvider,
    this.onPressed,
    this.colored = true,
  });

  @override
  Widget build(BuildContext context) {
    Color? foregroundColor = colored ? Colors.white : null;
    Color? backgroundColor = colored ? socialProvider.btnBgColor : null;
    Color? overlayColor = colored ? Colors.white10 : null;
    Color? iconColor = colored ? Colors.white : null;
    Widget iconWidget = SizedBox(
      height: 48,
      width: 48,
      child: Icon(
        socialProvider.iconData,
        color: iconColor,
      ),
    );
    if (socialProvider == OAuthProvider.google && colored) {
      iconWidget = Image.asset(
        'assets/logos/google_light.png',
        width: 48,
        height: 48,
      );

      foregroundColor = Colors.black;
      backgroundColor = Colors.white;
      overlayColor = Colors.white;
    }

    switch (socialProvider) {
      case OAuthProvider.notion:
        iconWidget = Image.asset(
          'assets/logos/notion.png',
          width: 48,
          height: 48,
        );
        break;
      case OAuthProvider.kakao:
        iconWidget = Image.asset(
          'assets/logos/kakao.png',
          width: 48,
          height: 48,
        );
        break;
      case OAuthProvider.keycloak:
        iconWidget = Image.asset(
          'assets/logos/keycloak.png',
          width: 48,
          height: 48,
        );
        break;
      case OAuthProvider.workos:
        iconWidget = Image.asset(
          'assets/logos/workOS.png',
          color: colored ? Colors.white : null,
          width: 48,
          height: 48,
        );
        break;
      default:
        break;
    }
    final authButtonStyle = ButtonStyle(
      foregroundColor: MaterialStateProperty.all(foregroundColor),
      backgroundColor: MaterialStateProperty.all(backgroundColor),
      overlayColor: MaterialStateProperty.all(overlayColor),
      iconColor: MaterialStateProperty.all(iconColor),
    );

    return ElevatedButton.icon(
      icon: iconWidget,
      style: authButtonStyle,
      onPressed: onPressed,
      label: Text('Continue with ${socialProvider.capitalizedName}'),
    );
  }
}

class SocialAuthButton extends ConsumerWidget {
  final OAuthProvider socialProvider;
  final VoidCallback? onPressed;
  final bool colored;
  const SocialAuthButton({
    super.key,
    required this.socialProvider,
    this.onPressed,
    this.colored = true,
  });

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final authNotifier = ref.watch(authProvider.notifier);
    return RawSocialAuthButton(
      socialProvider: socialProvider,
      onPressed:
          onPressed ?? () => authNotifier.signInWithOAuth(socialProvider),
      colored: colored,
    );
  }
}
