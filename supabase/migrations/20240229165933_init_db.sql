create extension if not exists "moddatetime" with schema "extensions";


create table "public"."stripe" (
    "user_id" uuid not null,
    "updated_at" timestamp with time zone not null default now(),
    "stripe_customer_id" text,
    "created_at" timestamp with time zone not null default now(),
    "one_time_payment_products" text[] not null default '{}'::text[],
    "active_subscription_product" text,
    "active_subscription_status" text
);


alter table "public"."stripe" enable row level security;

CREATE UNIQUE INDEX customers_stripe_customer_id_key ON public.stripe USING btree (stripe_customer_id);

CREATE UNIQUE INDEX user_metadata_pkey ON public.stripe USING btree (user_id);

alter table "public"."stripe" add constraint "user_metadata_pkey" PRIMARY KEY using index "user_metadata_pkey";

alter table "public"."stripe" add constraint "customers_stripe_customer_id_key" UNIQUE using index "customers_stripe_customer_id_key";

alter table "public"."stripe" add constraint "stripe_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."stripe" validate constraint "stripe_user_id_fkey";

grant delete on table "public"."stripe" to "anon";

grant insert on table "public"."stripe" to "anon";

grant references on table "public"."stripe" to "anon";

grant select on table "public"."stripe" to "anon";

grant trigger on table "public"."stripe" to "anon";

grant truncate on table "public"."stripe" to "anon";

grant update on table "public"."stripe" to "anon";

grant delete on table "public"."stripe" to "authenticated";

grant insert on table "public"."stripe" to "authenticated";

grant references on table "public"."stripe" to "authenticated";

grant select on table "public"."stripe" to "authenticated";

grant trigger on table "public"."stripe" to "authenticated";

grant truncate on table "public"."stripe" to "authenticated";

grant update on table "public"."stripe" to "authenticated";

grant delete on table "public"."stripe" to "service_role";

grant insert on table "public"."stripe" to "service_role";

grant references on table "public"."stripe" to "service_role";

grant select on table "public"."stripe" to "service_role";

grant trigger on table "public"."stripe" to "service_role";

grant truncate on table "public"."stripe" to "service_role";

grant update on table "public"."stripe" to "service_role";

create policy "authenticated users can only see their data"
on "public"."stripe"
as permissive
for select
to authenticated
using ((auth.uid() = user_id));


CREATE TRIGGER handle_updated_at BEFORE UPDATE ON public.stripe FOR EACH ROW EXECUTE FUNCTION moddatetime('updated_at');


