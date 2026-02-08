create type "public"."currency_type" as enum ('USD', 'XMR', 'CAD');

create type "public"."payment_provider" as enum ('STRIPE', 'MONERO');

create type "public"."xmr_invoice_status" as enum ('pending', 'payment_detected', 'confirmed', 'expired');

alter table "public"."prices" drop constraint "prices_currency_check";


  create table "public"."xmr_invoices" (
    "id" uuid not null,
    "user_id" uuid,
    "product_id" text,
    "amount_xmr" numeric(12,12) not null,
    "status" public.xmr_invoice_status not null default 'pending'::public.xmr_invoice_status,
    "address" text,
    "created_at" timestamp with time zone default now(),
    "confirmed_at" timestamp with time zone,
    "price_id" text
      );


alter table "public"."xmr_invoices" enable row level security;

alter table "public"."prices" alter column "currency" set data type public.currency_type using "currency"::public.currency_type;

alter table "public"."prices" alter column "unit_amount" set data type numeric using "unit_amount"::numeric;

alter table "public"."products" add column "provider" public.payment_provider not null default 'STRIPE'::public.payment_provider;

CREATE UNIQUE INDEX xmr_invoices_pkey ON public.xmr_invoices USING btree (id);

alter table "public"."xmr_invoices" add constraint "xmr_invoices_pkey" PRIMARY KEY using index "xmr_invoices_pkey";

alter table "public"."xmr_invoices" add constraint "xmr_invoices_price_id_fkey" FOREIGN KEY (price_id) REFERENCES public.prices(id) not valid;

alter table "public"."xmr_invoices" validate constraint "xmr_invoices_price_id_fkey";

alter table "public"."xmr_invoices" add constraint "xmr_invoices_product_id_fkey" FOREIGN KEY (product_id) REFERENCES public.products(id) not valid;

alter table "public"."xmr_invoices" validate constraint "xmr_invoices_product_id_fkey";

alter table "public"."xmr_invoices" add constraint "xmr_invoices_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."xmr_invoices" validate constraint "xmr_invoices_user_id_fkey";

grant delete on table "public"."xmr_invoices" to "anon";

grant insert on table "public"."xmr_invoices" to "anon";

grant references on table "public"."xmr_invoices" to "anon";

grant select on table "public"."xmr_invoices" to "anon";

grant trigger on table "public"."xmr_invoices" to "anon";

grant truncate on table "public"."xmr_invoices" to "anon";

grant update on table "public"."xmr_invoices" to "anon";

grant delete on table "public"."xmr_invoices" to "authenticated";

grant insert on table "public"."xmr_invoices" to "authenticated";

grant references on table "public"."xmr_invoices" to "authenticated";

grant select on table "public"."xmr_invoices" to "authenticated";

grant trigger on table "public"."xmr_invoices" to "authenticated";

grant truncate on table "public"."xmr_invoices" to "authenticated";

grant update on table "public"."xmr_invoices" to "authenticated";

grant delete on table "public"."xmr_invoices" to "service_role";

grant insert on table "public"."xmr_invoices" to "service_role";

grant references on table "public"."xmr_invoices" to "service_role";

grant select on table "public"."xmr_invoices" to "service_role";

grant trigger on table "public"."xmr_invoices" to "service_role";

grant truncate on table "public"."xmr_invoices" to "service_role";

grant update on table "public"."xmr_invoices" to "service_role";


  create policy "Users read own invoices"
  on "public"."xmr_invoices"
  as permissive
  for select
  to public
using ((auth.uid() = user_id));


