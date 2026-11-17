#!/usr/bin/env bash
# Starts everything the test suites need, isolated from other local projects.
#
#   tests/start-stack.sh          # start Supabase + serve edge functions (foreground)
#   tests/start-stack.sh --stop   # stop the test Supabase stack
#
# Why a separate project id: other repos on this machine (e.g. eventmate) reuse
# `project_id = "devtodollars"` in their supabase/config.toml, so they share one
# Docker volume. Running this repo under that id restores *their* database.
# SUPABASE_PROJECT_ID overrides config.toml without editing it.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
export SUPABASE_PROJECT_ID="${SUPABASE_PROJECT_ID:-mvp-boilerplate-local}"
ENV_FILE="$ROOT/supabase/.env.local"

cd "$ROOT"

if [[ "${1:-}" == "--stop" ]]; then
  supabase stop
  exit 0
fi

if [[ ! -f "$ENV_FILE" ]]; then
  cp "$ROOT/tests/env.local.example" "$ENV_FILE"
  echo "Created $ENV_FILE from tests/env.local.example."
  echo "Put a Stripe *test-mode* key in STRIPE_SECRET_KEY to enable the Stripe API tests."
fi

# Free the ports if another project's stack is still up.
for id in $(docker ps --format '{{.Label "com.supabase.cli.project"}}' | sort -u); do
  if [[ -n "$id" && "$id" != "$SUPABASE_PROJECT_ID" ]]; then
    echo "Stopping other Supabase stack: $id"
    supabase stop --project-id "$id" >/dev/null
  fi
done

supabase start
echo
echo "Serving edge functions with $ENV_FILE (Ctrl+C to stop)…"
exec supabase functions serve --env-file "$ENV_FILE"
