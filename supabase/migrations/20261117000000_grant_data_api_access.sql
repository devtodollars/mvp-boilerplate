/**
 * Explicit Data API grants.
 *
 * Supabase no longer exposes new tables in `public` to the Data API roles
 * (anon, authenticated, service_role) by default, and the legacy
 * `[api] auto_expose_new_tables` opt-out was removed on 2026-10-30. Without
 * these grants a fresh database (local `supabase start`, a new cloud project,
 * CI) rejects every read and write with "permission denied for table ...".
 *
 * Projects created under the old defaults already have broader grants; GRANT
 * only adds privileges, so this is a no-op for them.
 *
 * Grants are kept as narrow as the RLS policies in the init migration:
 * RLS still decides which rows each role can see.
 */

-- Edge functions (stripe_webhook, get_stripe_url, sync script) use service_role.
grant select, insert, update, delete on
  public.users,
  public.customers,
  public.products,
  public.prices,
  public.subscriptions,
  public.checkout_sessions
to service_role;

-- Pricing is public.
grant select on public.products, public.prices to anon, authenticated;

-- Signed-in users read and update their own profile (RLS: auth.uid() = id).
grant select, update on public.users to authenticated;

-- Signed-in users read their own billing records (RLS: auth.uid() = user_id).
grant select on public.subscriptions, public.checkout_sessions to authenticated;

-- public.customers is intentionally not granted to anon/authenticated: it maps
-- users to Stripe customer ids and is only touched by service_role.
