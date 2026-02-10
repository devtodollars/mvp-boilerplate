/**
* USERS
* Note: This table contains user data. Users should only be able to view and update their own data.
*/
create table users (
  -- UUID from auth.users
  id uuid references auth.users not null primary key,
  full_name text,
  avatar_url text,
  -- The customer's billing address, stored in JSON format.
  billing_address jsonb,
  -- Stores your customer's payment instruments.
  payment_method jsonb
);
alter table users enable row level security;
create policy "Can view own user data." on users for select using (auth.uid() = id);
create policy "Can update own user data." on users for update using (auth.uid() = id);

/**
* This trigger automatically creates a user entry when a new user signs up via Supabase Auth.
*/
create function public.handle_new_user()
returns trigger as $$
begin
  insert into public.users (id, full_name, avatar_url)
  values (new.id, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'avatar_url');
  return new;
end;
$$ language plpgsql security definer;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

/**
* CUSTOMERS
* Note: this is a private table that contains a mapping of user IDs to Stripe customer IDs.
*/
create table customers (
  -- UUID from auth.users
  id uuid references auth.users not null primary key,
  -- The user's customer ID in Stripe. User must not be able to update this.
  stripe_customer_id text
);
alter table customers enable row level security;
-- No policies as this is a private table that the user must not have access to.

/**
* ENUMS
*/
create type payment_provider as enum ('STRIPE', 'MONERO');
create type currency_type as enum ('USD', 'XMR', 'CAD');
create type pricing_type as enum ('one_time', 'recurring');
create type pricing_plan_interval as enum ('day', 'week', 'month', 'year');

/**
* PRODUCTS
* Note: Stripe products are synced via webhooks. Monero products are managed manually.
*/
create table products (
  -- Product ID (Stripe ID for Stripe products, UUID cast to text for Monero products).
  id text primary key,
  -- Whether the product is currently available for purchase.
  active boolean,
  -- The product's name, meant to be displayable to the customer.
  name text,
  -- The product's description, meant to be displayable to the customer.
  description text,
  -- A URL of the product image, meant to be displayable to the customer.
  image text,
  -- Set of key-value pairs, used to store additional information about the object in a structured format.
  metadata jsonb,
  -- The payment provider for this product.
  provider payment_provider not null default 'STRIPE'
);
alter table products enable row level security;
create policy "Allow public read-only access." on products for select using (true);

/**
* PRICES
* Note: Stripe prices are synced via webhooks. Monero prices are managed manually.
*/
create table prices (
  -- Price ID (Stripe ID for Stripe prices, UUID cast to text for Monero prices).
  id text primary key,
  -- The ID of the product that this price belongs to.
  product_id text references products,
  -- Whether the price can be used for new purchases.
  active boolean,
  -- A brief description of the price.
  description text,
  -- The unit amount as a numeric value. For USD this is in cents, for XMR this is the XMR amount.
  unit_amount numeric,
  -- The currency for this price.
  currency currency_type,
  -- One of `one_time` or `recurring` depending on whether the price is for a one-time purchase or a recurring (subscription) purchase.
  type pricing_type,
  -- The frequency at which a subscription is billed. One of `day`, `week`, `month` or `year`.
  interval pricing_plan_interval,
  -- The number of intervals (specified in the `interval` attribute) between subscription billings. For example, `interval=month` and `interval_count=3` bills every 3 months.
  interval_count integer,
  -- Default number of trial days when subscribing a customer to this price using [`trial_from_plan=true`](https://stripe.com/docs/api#create_subscription-trial_from_plan).
  trial_period_days integer,
  -- Set of key-value pairs, used to store additional information about the object in a structured format.
  metadata jsonb
);
alter table prices enable row level security;
create policy "Allow public read-only access." on prices for select using (true);

/**
* SUBSCRIPTIONS
* Note: subscriptions are created and managed in Stripe and synced to our DB via Stripe webhooks.
* XMR subscriptions are created by the xmr_webhook edge function.
*/
create type subscription_status as enum ('trialing', 'active', 'canceled', 'incomplete', 'incomplete_expired', 'past_due', 'unpaid', 'paused');
create table subscriptions (
  -- Subscription ID from Stripe (e.g. sub_1234) or XMR (e.g. xmr_sub_{invoice_id}).
  id text primary key,
  user_id uuid references auth.users not null,
  -- The status of the subscription object, one of subscription_status type above.
  status subscription_status,
  -- Set of key-value pairs, used to store additional information about the object in a structured format.
  metadata jsonb,
  -- ID of the price that created this subscription.
  price_id text references prices,
  -- Quantity multiplied by the unit amount of the price creates the amount of the subscription. Can be used to charge multiple seats.
  quantity integer,
  -- If true the subscription has been canceled by the user and will be deleted at the end of the billing period.
  cancel_at_period_end boolean,
  -- Time at which the subscription was created.
  created timestamp with time zone default timezone('utc'::text, now()) not null,
  -- Start of the current period that the subscription has been invoiced for.
  current_period_start timestamp with time zone default timezone('utc'::text, now()) not null,
  -- End of the current period that the subscription has been invoiced for. At the end of this period, a new invoice will be created.
  current_period_end timestamp with time zone default timezone('utc'::text, now()) not null,
  -- If the subscription has ended, the timestamp of the date the subscription ended.
  ended_at timestamp with time zone default timezone('utc'::text, now()),
  -- A date in the future at which the subscription will automatically get canceled.
  cancel_at timestamp with time zone default timezone('utc'::text, now()),
  -- If the subscription has been canceled, the date of that cancellation. If the subscription was canceled with `cancel_at_period_end`, `canceled_at` will still reflect the date of the initial cancellation request, not the end of the subscription period when the subscription is automatically moved to a canceled state.
  canceled_at timestamp with time zone default timezone('utc'::text, now()),
  -- If the subscription has a trial, the beginning of that trial.
  trial_start timestamp with time zone default timezone('utc'::text, now()),
  -- If the subscription has a trial, the end of that trial.
  trial_end timestamp with time zone default timezone('utc'::text, now())
);
alter table subscriptions enable row level security;
create policy "Can only view own subs data." on subscriptions for select using (auth.uid() = user_id);

/**
* CHECKOUT SESSIONS
* Note: Completed checkouts are created and managed in Stripe and synced to our DB via Stripe webhooks.
*/
create type checkout_mode as enum ('payment', 'setup', 'subscription');
create type checkout_status as enum ('complete', 'expired', 'open');
create type checkout_payment_status as enum ('paid', 'unpaid', 'no_payment_required');
create table checkout_sessions (
  -- Checkout Session ID from Stripe, e.g. cs_1234.
  id text primary key,
  user_id uuid references auth.users not null,
  -- The mode of the Checkout Session.
  mode checkout_mode,
  -- The payment status of the Checkout Session
  payment_status checkout_payment_status,
  -- The status of the Checkout Session
  status checkout_status,
  -- Set of key-value pairs, used to store additional information about the object in a structured format.
  metadata jsonb,
  -- ID of the price that created this checkout.
  price_id text references prices,
  -- Quantity multiplied by the unit amount of the price creates the amount of the item.
  quantity integer,
  -- Time at which the checkout session was created.
  created timestamp with time zone default timezone('utc'::text, now()) not null
);
alter table checkout_sessions enable row level security;
create policy "Can only view own checkout session data" on checkout_sessions for select using (auth.uid() = user_id);

/**
* XMR INVOICES
* Track Monero payment invoices from xmrcheckout
*/
create type xmr_invoice_status as enum ('pending', 'payment_detected', 'confirmed', 'expired');
create table xmr_invoices (
  id uuid primary key,  -- xmrcheckout invoice ID
  user_id uuid references auth.users(id) on delete cascade,
  product_id text references products(id),
  price_id text references prices(id),
  amount_xmr decimal(12, 12) not null,
  status xmr_invoice_status not null default 'pending',
  address text,
  created_at timestamptz default now(),
  confirmed_at timestamptz
);
alter table xmr_invoices enable row level security;
create policy "Users read own invoices" on xmr_invoices for select using (auth.uid() = user_id);

/**
 * REALTIME SUBSCRIPTIONS
 * Only allow realtime listening on public tables.
 */
drop publication if exists supabase_realtime;
create publication supabase_realtime for table products, prices;
