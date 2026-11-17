#!/usr/bin/env bash
# Runs every automated check and prints a pass/fail summary.
# Start the stack first in another terminal:  tests/start-stack.sh
#
#   tests/run-all.sh            # everything
#   tests/run-all.sh --quick    # skip the browser suites (static checks + unit tests only)
set -uo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
export SUPABASE_PROJECT_ID="${SUPABASE_PROJECT_ID:-mvp-boilerplate-local}"
QUICK="${1:-}"
declare -a RESULTS=()

run() {
  local name="$1"; shift
  echo; echo "━━━ $name"
  if (cd "$ROOT" && eval "$@"); then RESULTS+=("PASS  $name"); else RESULTS+=("FAIL  $name"); fi
}

# 1. Stripe products/prices -> local DB (needs a sk_test_ key in supabase/.env.local)
sync_stripe() {
  cd supabase
  set -a; . ./.env.local; set +a
  if [[ "$STRIPE_SECRET_KEY" == *placeholder* ]]; then echo "skipped: no Stripe test key"; return 0; fi
  SUPABASE_URL=http://127.0.0.1:54321 \
  SUPABASE_SERVICE_ROLE_KEY="$(supabase status -o env 2>/dev/null | sed -nE 's/^SERVICE_ROLE_KEY="(.*)"/\1/p')" \
  STRIPE_SUPPRESS_NOTICES=true \
    deno run -A --config functions/_scripts/deno.json functions/_scripts/sync-stripe.ts
}

run "Supabase: migrations applied"      "supabase migration up --local"
run "Stripe sync script"                sync_stripe
run "Edge functions: deno unit tests"   "cd supabase/functions && deno test _tests/"
run "Edge functions: deno check"        "cd supabase/functions && for f in stripe_webhook get_stripe_url on_user_modify; do deno check --config \$f/deno.json \$f/index.ts || exit 1; done"
run "Next.js: lint"                     "cd nextjs && pnpm lint"
run "Next.js: typecheck"                "cd nextjs && pnpm exec tsc --noEmit"
run "Next.js: production build"         "cd nextjs && pnpm build"
run "Flutter: analyze"                  "cd flutter && flutter analyze --no-fatal-infos"
run "Flutter: unit + widget tests"      "cd flutter && flutter test"
run "Flutter: web build"                "cd flutter && flutter build web --dart-define-from-file=env.local.json"

if [[ "$QUICK" != "--quick" ]]; then
  run "Next.js + DB + Stripe: Playwright e2e" "cd nextjs && pnpm test:e2e"
  run "Flutter web: e2e in Chrome"            "cd flutter && flutter test --platform chrome test/e2e --dart-define-from-file=env.local.json"
fi

echo; echo "━━━ Summary"
printf '%s\n' "${RESULTS[@]}"
[[ ! " ${RESULTS[*]} " =~ FAIL ]]
