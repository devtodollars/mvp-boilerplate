#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
MARKER="$ROOT_DIR/.monero-installed"
BACKUP_DIR="$ROOT_DIR/.monero-backup"

if [[ ! -f "$MARKER" ]]; then
  echo "Monero module is not installed. Nothing to uninstall."
  exit 1
fi

echo "Uninstalling Monero payment module..."

# --- 1. Remove Monero-only files ---
echo "  Removing Monero edge functions, migration, and docs..."
rm -f "$ROOT_DIR/supabase/functions/get_xmr_url/index.ts"
rmdir "$ROOT_DIR/supabase/functions/get_xmr_url" 2>/dev/null || true
rm -f "$ROOT_DIR/supabase/functions/xmr_webhook/index.ts"
rmdir "$ROOT_DIR/supabase/functions/xmr_webhook" 2>/dev/null || true
rm -f "$ROOT_DIR/supabase/migrations/20260207145825_monero-payment-migrations.sql"

# --- 2. Restore Stripe-only files from backup ---
echo "  Restoring Stripe-only file versions..."
cp "$BACKUP_DIR/nextjs/components/landing/Pricing.tsx"       "$ROOT_DIR/nextjs/components/landing/Pricing.tsx"
cp "$BACKUP_DIR/nextjs/components/misc/AccountPage.tsx"      "$ROOT_DIR/nextjs/components/misc/AccountPage.tsx"
cp "$BACKUP_DIR/nextjs/app/account/page.tsx"                 "$ROOT_DIR/nextjs/app/account/page.tsx"
cp "$BACKUP_DIR/nextjs/utils/supabase/queries.ts"            "$ROOT_DIR/nextjs/utils/supabase/queries.ts"
cp "$BACKUP_DIR/nextjs/components/landing/Items.tsx"         "$ROOT_DIR/nextjs/components/landing/Items.tsx"
cp "$BACKUP_DIR/nextjs/styles/main.css"                      "$ROOT_DIR/nextjs/styles/main.css"
cp "$BACKUP_DIR/nextjs/schema.sql"                           "$ROOT_DIR/nextjs/schema.sql"
cp "$BACKUP_DIR/supabase/functions/_shared/supabase.ts"      "$ROOT_DIR/supabase/functions/_shared/supabase.ts"
cp "$BACKUP_DIR/supabase/functions/_scripts/sync-stripe.ts"  "$ROOT_DIR/supabase/functions/_scripts/sync-stripe.ts"
cp "$BACKUP_DIR/supabase/config.toml"                        "$ROOT_DIR/supabase/config.toml"
cp "$BACKUP_DIR/.env.example"                                "$ROOT_DIR/.env.example"

# --- 3. Clean up ---
echo "  Cleaning up..."
rm -rf "$BACKUP_DIR"
rm -f "$MARKER"

echo ""
echo "Monero module uninstalled successfully!"
echo ""
echo "Next steps:"
echo "  1. cd nextjs && pnpm supabase:start"
echo "  2. pnpm supabase:generate-types"
echo "  3. pnpm dev"
