/**
 * Let auth users be deleted.
 *
 * The tables below referenced auth.users without ON DELETE, so deleting a user
 * (dashboard, auth.admin.deleteUser, account deletion) failed with
 * "Database error deleting user", and on_user_modify never saw the DELETE.
 *
 * Deleting a user now removes their profile, Stripe customer mapping, and
 * synced subscription / checkout rows. Stripe itself keeps the customer and
 * billing history; cancel active subscriptions in Stripe before deleting.
 */

alter table public.users
  drop constraint if exists users_id_fkey,
  add constraint users_id_fkey
    foreign key (id) references auth.users (id) on delete cascade;

alter table public.customers
  drop constraint if exists customers_id_fkey,
  add constraint customers_id_fkey
    foreign key (id) references auth.users (id) on delete cascade;

alter table public.subscriptions
  drop constraint if exists subscriptions_user_id_fkey,
  add constraint subscriptions_user_id_fkey
    foreign key (user_id) references auth.users (id) on delete cascade;

alter table public.checkout_sessions
  drop constraint if exists checkout_sessions_user_id_fkey,
  add constraint checkout_sessions_user_id_fkey
    foreign key (user_id) references auth.users (id) on delete cascade;
