#!/bin/bash
# Installs the Flutter SDK on Vercel's build image (Flutter isn't preinstalled).
# Pinned to the version CI builds with (.github/workflows/flutter-web.yml);
# bump both together.
set -euo pipefail

FLUTTER_VERSION="3.50.0"

# Flutter's bootstrap needs unzip to extract the Dart SDK.
command -v unzip >/dev/null || dnf install -y unzip

if [ ! -x _flutter/bin/flutter ]; then
  git clone https://github.com/flutter/flutter.git \
    --branch "$FLUTTER_VERSION" --depth 1 _flutter
fi

_flutter/bin/flutter --disable-analytics
_flutter/bin/flutter config --enable-web --no-cli-animations
_flutter/bin/flutter pub get
