#!/bin/bash
# Builds the Flutter web app on Vercel and, when SENTRY_AUTH_TOKEN is set,
# uploads its source maps to Sentry so production stack traces are readable.
#
# Vercel environment variables (Project > Settings > Environment Variables):
#   SENTRY_AUTH_TOKEN, SENTRY_ORG, SENTRY_PROJECT  optional, for source maps
#   SENTRY_ENVIRONMENT                             optional, defaults to VERCEL_ENV
set -euo pipefail

FLUTTER="${FLUTTER:-_flutter/bin/flutter}"
COMMIT="${VERCEL_GIT_COMMIT_SHA:-$(git rev-parse HEAD 2>/dev/null || echo local)}"
# The release the app reports and the source maps are uploaded for; they must match.
export SENTRY_RELEASE="${SENTRY_RELEASE:-flutter@$COMMIT}"
ENVIRONMENT="${SENTRY_ENVIRONMENT:-${VERCEL_ENV:-production}}"

"$FLUTTER" build web --release --source-maps \
  --dart-define-from-file=env.json \
  --dart-define=SENTRY_RELEASE="$SENTRY_RELEASE" \
  --dart-define=SENTRY_ENVIRONMENT="$ENVIRONMENT"

if [ -n "${SENTRY_AUTH_TOKEN:-}" ]; then
  "$(dirname "$(command -v "$FLUTTER")")/dart" run sentry_dart_plugin
else
  echo "SENTRY_AUTH_TOKEN not set: skipping the Sentry source map upload."
fi

# Source maps expose the Dart source; Sentry has them now, so don't serve them.
find build/web -name '*.map' -delete
