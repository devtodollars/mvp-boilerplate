---
sidebar_position: 3
---
# Upgrading Flutter Version

1. Update all workflows in `.github/workflows` to use correct version
2. Update `pubspec.yaml` to use correct sdk version using command: `flutter upgrade x.x.x`
3. Run the program to update `pubspec.lock`
