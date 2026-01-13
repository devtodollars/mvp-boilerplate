# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository Overview

This is a production MVP boilerplate for building SaaS applications with multiple frontend options (Flutter and Next.js) sharing a common Supabase backend. The architecture supports cross-platform development with integrated payments (Stripe), authentication (Supabase), analytics (PostHog), and transactional emails (Postmark).

### Project Structure

- **`nextjs/`** - Next.js web application (App Router, TypeScript, Tailwind)
- **`flutter/`** - Flutter cross-platform app (iOS, Android, Web, macOS, Linux, Windows)
- **`supabase/`** - Supabase backend configuration, migrations, and edge functions
- **`docs/`** - Comprehensive documentation for setup and configuration

## Common Commands

### Next.js Development

```bash
cd nextjs
pnpm install                    # Install dependencies
pnpm dev                        # Start development server with Turbopack
pnpm build                      # Production build
pnpm lint                       # Run ESLint
pnpm prettier-fix               # Format code with Prettier
```

### Flutter Development

```bash
cd flutter
flutter run -d chrome --dart-define-from-file=env.json  # Run web app
flutter run -d macos --dart-define-from-file=env.json   # Run macOS app
flutter pub get                                          # Install dependencies
flutter test                                             # Run tests
```

### Supabase Local Development

```bash
# From root directory
cd nextjs
pnpm supabase:start             # Start local Supabase (runs Docker containers)
pnpm supabase:stop              # Stop local Supabase
pnpm supabase:status            # View connection info and URLs
pnpm supabase:restart           # Stop and restart Supabase
pnpm supabase:reset             # Reset database (destructive)

# Generate TypeScript types from database schema
pnpm supabase:generate-types    # Generates types_db.ts in both nextjs/ and supabase/functions/

# Database migrations
pnpm supabase:generate-migration  # Create migration from schema diff
pnpm supabase:push              # Push migrations to remote
pnpm supabase:pull              # Pull migrations from remote
```

### Supabase Edge Functions

```bash
cd supabase
# Serve functions locally
supabase functions serve --env-file .env.local --import-map functions/deno.json

# Set secrets for production
supabase secrets set --env-file .env

# Deploy functions
supabase functions deploy --import-map functions/deno.json

# Sync Stripe products/prices to database
deno run -A functions/_scripts/sync-stripe.ts
```

**Available edge functions:**
- `get_stripe_url` - Returns Stripe checkout or billing portal URLs
- `stripe_webhook` - Handles Stripe webhook events (syncs subscriptions)
- `on_user_modify` - Triggered on user creation/deletion (PostHog events)

### Stripe Integration (Local Development)

```bash
cd nextjs
pnpm stripe:login               # Authenticate with Stripe CLI
pnpm stripe:listen              # Forward webhooks to local Supabase function
pnpm stripe:fixtures            # Load test products/prices from fixtures/stripe-fixtures.json
```

## Architecture

### Authentication Flow

- Supabase Auth handles all authentication (email/password, OAuth providers)
- Next.js uses Server Components with `@supabase/ssr` for server-side auth
- Flutter uses `supabase_flutter` with session persistence
- On user creation, `handle_new_user()` trigger creates entry in `users` table
- On user modify, `on_user_modify` edge function logs events to PostHog

### Payment Flow

1. User initiates checkout from frontend (Flutter or Next.js)
2. Frontend calls `get_stripe_url` edge function with price ID
3. Edge function creates Stripe checkout session, returns URL
4. User completes payment in Stripe
5. Stripe sends webhook to `stripe_webhook` edge function
6. Webhook handler syncs subscription data to `subscriptions` table
7. Frontend polls or refreshes to show updated subscription status

**Database tables:**
- `customers` - Maps Supabase user IDs to Stripe customer IDs
- `products` - Synced from Stripe via webhooks
- `prices` - Synced from Stripe via webhooks
- `subscriptions` - User subscription status, synced from Stripe

### Next.js Structure

- **App Router** with React Server Components
- **Supabase client creation:**
  - `utils/supabase/server.ts` - Server Component client
  - `utils/supabase/client.ts` - Client Component client
  - `utils/supabase/middleware.ts` - Middleware client for auth refresh
  - `utils/supabase/api.ts` - Route handler client
- **Components:**
  - `components/ui/` - shadcn/ui components (Radix UI primitives)
  - `components/landing/` - Landing page sections
  - `components/misc/` - Miscellaneous shared components
- **API Routes:**
  - `app/api/` - Next.js route handlers for server-side operations
- **PostHog:** `app/PostHogPageView.tsx` tracks pageviews, `app/providers.tsx` initializes PostHog

### Flutter Structure

- **State Management:** Riverpod with code generation (`riverpod_annotation`)
- **Routing:** `go_router` configured in `lib/services/router_notifier.dart`
- **Key Services:**
  - `lib/services/auth_notifier.dart` - Authentication state management
  - `lib/services/metadata_notifier.dart` - User metadata management
  - `lib/services/router_notifier.dart` - Navigation with auth-based redirects
- **Screens:**
  - `lib/screens/auth_screen.dart` - Login/signup with `supabase_auth_ui`
  - `lib/screens/home_screen.dart` - Main authenticated screen
  - `lib/screens/payments_screen.dart` - Stripe checkout integration
- **Configuration:** Environment variables in `env.json` (use `env.local.json` for local dev)

### Database Schema

The schema is defined in `nextjs/schema.sql` and managed via Supabase migrations in `supabase/migrations/`.

**Core tables:**
- `users` - User profiles with billing info
- `customers` - Stripe customer mapping (private table)
- `products` - Stripe products (synced via webhook)
- `prices` - Stripe prices (synced via webhook)
- `subscriptions` - User subscriptions (synced via webhook)

**Row Level Security (RLS):** All tables have RLS enabled. Users can only access their own data.

### Type Generation

Both Next.js and Supabase edge functions share the same TypeScript types generated from the database schema:
- `nextjs/types_db.ts`
- `supabase/functions/types_db.ts`

After modifying the database schema, run `pnpm supabase:generate-types` from the `nextjs/` directory to update both files.

### Local Development Ports

When running `supabase start`, the following services are available:
- API: `http://localhost:54321`
- Database: `postgresql://postgres:postgres@localhost:54322/postgres`
- Studio: `http://localhost:54323`
- Next.js: `http://localhost:3000` (default)

## Important Patterns

### Environment Variables

- **Next.js:** Uses `.env` (or `.env.local` for local dev)
- **Flutter:** Uses `env.json` (or `env.local.json` for local dev)
- **Supabase Functions:** Uses `.env` in `supabase/` directory (local: `.env.local`)

When working with environment variables, check the corresponding `.env.example` files for required variables.

### Supabase Client Usage (Next.js)

**Do not** create Supabase clients directly with `createClient()` everywhere. Use the appropriate utility:
- Server Components: `import { createClient } from '@/utils/supabase/server'`
- Client Components: `import { createClient } from '@/utils/supabase/client'`
- Middleware: `import { updateSession } from '@/utils/supabase/middleware'`
- Route Handlers: Import from `@/utils/supabase/api`

### Database Migrations Workflow

1. Make schema changes in local Supabase Studio (`http://localhost:54323`)
2. Generate migration: `pnpm supabase:generate-migration`
3. Review generated SQL in `supabase/migrations/`
4. Apply migration locally: `pnpm supabase:reset` (or restart)
5. Regenerate types: `pnpm supabase:generate-types`
6. Push to production: `pnpm supabase:push`

### Code Generation (Flutter)

Flutter uses Riverpod code generation. After modifying files with `@riverpod` annotations, run:
```bash
flutter pub run build_runner build --delete-conflicting-outputs
```

## Testing Locally

1. Start Supabase: `cd nextjs && pnpm supabase:start`
2. Start Stripe webhook listener: `pnpm stripe:listen` (in separate terminal)
3. Load Stripe test data: `pnpm stripe:fixtures`
4. Start Next.js: `pnpm dev`
   OR
   Start Flutter: `cd ../flutter && flutter run -d chrome --dart-define-from-file=env.local.json`

## Package Management

- **Next.js:** Uses `pnpm` (not npm or yarn)
- **Flutter:** Uses `flutter pub`
- **Supabase Functions:** Uses Deno with import maps (`functions/deno.json`)

## Deployment

This repository uses GitHub Actions for CI/CD:
- `.github/workflows/flutter-web.yml` - Deploys Flutter web to Netlify on PR/merge

For production deployment, refer to the documentation in `docs/` for platform-specific setup (Stripe, PostHog, Postmark, etc.).
