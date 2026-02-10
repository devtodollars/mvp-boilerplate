#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
MONERO_DIR="$SCRIPT_DIR"
MARKER="$ROOT_DIR/.monero-installed"
BACKUP_DIR="$ROOT_DIR/.monero-backup"

if [[ -f "$MARKER" ]]; then
  echo "Monero module is already installed. Run monero/uninstall.sh first to reinstall."
  exit 1
fi

echo "Installing Monero payment module..."

# --- 1. Copy Monero-only files into place ---
echo "  Copying Monero edge functions and migration..."
mkdir -p "$ROOT_DIR/supabase/functions/get_xmr_url"
mkdir -p "$ROOT_DIR/supabase/functions/xmr_webhook"
mkdir -p "$ROOT_DIR/supabase/migrations"

cp "$MONERO_DIR/supabase/functions/get_xmr_url/index.ts" "$ROOT_DIR/supabase/functions/get_xmr_url/index.ts"
cp "$MONERO_DIR/supabase/functions/xmr_webhook/index.ts"  "$ROOT_DIR/supabase/functions/xmr_webhook/index.ts"
cp "$MONERO_DIR/supabase/migrations/"*.sql                 "$ROOT_DIR/supabase/migrations/"

# --- 2. Backup current Stripe-only files ---
echo "  Backing up Stripe-only files to .monero-backup/..."
mkdir -p "$BACKUP_DIR/nextjs/components/landing"
mkdir -p "$BACKUP_DIR/nextjs/components/misc"
mkdir -p "$BACKUP_DIR/nextjs/app/account"
mkdir -p "$BACKUP_DIR/nextjs/utils/supabase"
mkdir -p "$BACKUP_DIR/nextjs/styles"
mkdir -p "$BACKUP_DIR/supabase/functions/_shared"
mkdir -p "$BACKUP_DIR/supabase/functions/_scripts"
mkdir -p "$BACKUP_DIR/supabase"

cp "$ROOT_DIR/nextjs/components/landing/Pricing.tsx"       "$BACKUP_DIR/nextjs/components/landing/Pricing.tsx"
cp "$ROOT_DIR/nextjs/components/misc/AccountPage.tsx"      "$BACKUP_DIR/nextjs/components/misc/AccountPage.tsx"
cp "$ROOT_DIR/nextjs/app/account/page.tsx"                 "$BACKUP_DIR/nextjs/app/account/page.tsx"
cp "$ROOT_DIR/nextjs/utils/supabase/queries.ts"            "$BACKUP_DIR/nextjs/utils/supabase/queries.ts"
cp "$ROOT_DIR/nextjs/components/landing/Items.tsx"         "$BACKUP_DIR/nextjs/components/landing/Items.tsx"
cp "$ROOT_DIR/nextjs/styles/main.css"                      "$BACKUP_DIR/nextjs/styles/main.css"
cp "$ROOT_DIR/nextjs/schema.sql"                           "$BACKUP_DIR/nextjs/schema.sql"
cp "$ROOT_DIR/supabase/functions/_shared/supabase.ts"      "$BACKUP_DIR/supabase/functions/_shared/supabase.ts"
cp "$ROOT_DIR/supabase/functions/_scripts/sync-stripe.ts"  "$BACKUP_DIR/supabase/functions/_scripts/sync-stripe.ts"
cp "$ROOT_DIR/supabase/config.toml"                        "$BACKUP_DIR/supabase/config.toml"
cp "$ROOT_DIR/.env.example"                                "$BACKUP_DIR/.env.example"

# --- 3. Overlay Monero-enhanced versions ---
echo "  Applying Monero-enhanced file versions..."
cp "$MONERO_DIR/patches/nextjs/components/landing/Pricing.tsx"       "$ROOT_DIR/nextjs/components/landing/Pricing.tsx"
cp "$MONERO_DIR/patches/nextjs/components/misc/AccountPage.tsx"      "$ROOT_DIR/nextjs/components/misc/AccountPage.tsx"
cp "$MONERO_DIR/patches/nextjs/app/account/page.tsx"                 "$ROOT_DIR/nextjs/app/account/page.tsx"
cp "$MONERO_DIR/patches/nextjs/utils/supabase/queries.ts"            "$ROOT_DIR/nextjs/utils/supabase/queries.ts"
cp "$MONERO_DIR/patches/nextjs/components/landing/Items.tsx"         "$ROOT_DIR/nextjs/components/landing/Items.tsx"
cp "$MONERO_DIR/patches/nextjs/styles/main.css"                      "$ROOT_DIR/nextjs/styles/main.css"
cp "$MONERO_DIR/patches/nextjs/schema.sql"                           "$ROOT_DIR/nextjs/schema.sql"
cp "$MONERO_DIR/patches/supabase/functions/_shared/supabase.ts"      "$ROOT_DIR/supabase/functions/_shared/supabase.ts"
cp "$MONERO_DIR/patches/supabase/functions/_scripts/sync-stripe.ts"  "$ROOT_DIR/supabase/functions/_scripts/sync-stripe.ts"
cp "$MONERO_DIR/patches/supabase/config.toml"                        "$ROOT_DIR/supabase/config.toml"
cp "$MONERO_DIR/patches/.env.example"                                "$ROOT_DIR/.env.example"

# --- 4. Write marker ---
date -u > "$MARKER"

echo ""
echo "Monero module installed successfully!"
echo ""
echo "Next steps:"
echo "  1. supabase db reset"
echo "  2. npx supabase gen types typescript --local --schema public > ./nextjs/types_db.ts"
echo "  3. deno run --env -A supabase/functions/_scripts/sync-stripe.ts --monero"
echo "  4. cd nextjs && pnpm dev"
