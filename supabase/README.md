# Supabase Production Template

[Supabase](https://supabase.com) Backend configured with stripe integration, posthog analytics, and Loops.so transactional emails.

Migration pull requests run [RattleCheck](../.github/workflows/rattlecheck.yml) on both the standard backend and the schema assembled by the Monero installer. The check uses `rattlecheck@latest` and flags high or critical permission findings introduced or worsened by the change. It reads the SQL files without connecting to Supabase.

# Start local supabase server

```
supabase start
```

# Start local supabase functions

```
supabase functions serve --env-file supabase/.env.local --import-map supabase/functions/deno.json
```

# Set supabase secrets from .env file

```
supabase secrets set --env-file supabase/.env
```

# Sync Stripe products and prices with Supabase

```
deno run  -A supabase/functions/_scripts/sync-stripe.ts
```

# Deploy Functions

```
supabase functions deploy --import-map supabase/functions/deno.json
```
