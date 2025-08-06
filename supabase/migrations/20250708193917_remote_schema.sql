drop policy "Can only view own checkout session data" on "public"."checkout_sessions";

drop policy "Allow public read-only access." on "public"."products";

drop policy "Can only view own subs data." on "public"."subscriptions";

revoke delete on table "public"."checkout_sessions" from "anon";

revoke insert on table "public"."checkout_sessions" from "anon";

revoke references on table "public"."checkout_sessions" from "anon";

revoke select on table "public"."checkout_sessions" from "anon";

revoke trigger on table "public"."checkout_sessions" from "anon";

revoke truncate on table "public"."checkout_sessions" from "anon";

revoke update on table "public"."checkout_sessions" from "anon";

revoke delete on table "public"."checkout_sessions" from "authenticated";

revoke insert on table "public"."checkout_sessions" from "authenticated";

revoke references on table "public"."checkout_sessions" from "authenticated";

revoke select on table "public"."checkout_sessions" from "authenticated";

revoke trigger on table "public"."checkout_sessions" from "authenticated";

revoke truncate on table "public"."checkout_sessions" from "authenticated";

revoke update on table "public"."checkout_sessions" from "authenticated";

revoke delete on table "public"."checkout_sessions" from "service_role";

revoke insert on table "public"."checkout_sessions" from "service_role";

revoke references on table "public"."checkout_sessions" from "service_role";

revoke select on table "public"."checkout_sessions" from "service_role";

revoke trigger on table "public"."checkout_sessions" from "service_role";

revoke truncate on table "public"."checkout_sessions" from "service_role";

revoke update on table "public"."checkout_sessions" from "service_role";

revoke delete on table "public"."products" from "anon";

revoke insert on table "public"."products" from "anon";

revoke references on table "public"."products" from "anon";

revoke select on table "public"."products" from "anon";

revoke trigger on table "public"."products" from "anon";

revoke truncate on table "public"."products" from "anon";

revoke update on table "public"."products" from "anon";

revoke delete on table "public"."products" from "authenticated";

revoke insert on table "public"."products" from "authenticated";

revoke references on table "public"."products" from "authenticated";

revoke select on table "public"."products" from "authenticated";

revoke trigger on table "public"."products" from "authenticated";

revoke truncate on table "public"."products" from "authenticated";

revoke update on table "public"."products" from "authenticated";

revoke delete on table "public"."products" from "service_role";

revoke insert on table "public"."products" from "service_role";

revoke references on table "public"."products" from "service_role";

revoke select on table "public"."products" from "service_role";

revoke trigger on table "public"."products" from "service_role";

revoke truncate on table "public"."products" from "service_role";

revoke update on table "public"."products" from "service_role";

revoke delete on table "public"."subscriptions" from "anon";

revoke insert on table "public"."subscriptions" from "anon";

revoke references on table "public"."subscriptions" from "anon";

revoke select on table "public"."subscriptions" from "anon";

revoke trigger on table "public"."subscriptions" from "anon";

revoke truncate on table "public"."subscriptions" from "anon";

revoke update on table "public"."subscriptions" from "anon";

revoke delete on table "public"."subscriptions" from "authenticated";

revoke insert on table "public"."subscriptions" from "authenticated";

revoke references on table "public"."subscriptions" from "authenticated";

revoke select on table "public"."subscriptions" from "authenticated";

revoke trigger on table "public"."subscriptions" from "authenticated";

revoke truncate on table "public"."subscriptions" from "authenticated";

revoke update on table "public"."subscriptions" from "authenticated";

revoke delete on table "public"."subscriptions" from "service_role";

revoke insert on table "public"."subscriptions" from "service_role";

revoke references on table "public"."subscriptions" from "service_role";

revoke select on table "public"."subscriptions" from "service_role";

revoke trigger on table "public"."subscriptions" from "service_role";

revoke truncate on table "public"."subscriptions" from "service_role";

revoke update on table "public"."subscriptions" from "service_role";

alter table "public"."checkout_sessions" drop constraint "checkout_sessions_price_id_fkey";

alter table "public"."checkout_sessions" drop constraint "checkout_sessions_user_id_fkey";

alter table "public"."prices" drop constraint "prices_product_id_fkey";

alter table "public"."subscriptions" drop constraint "subscriptions_price_id_fkey";

alter table "public"."subscriptions" drop constraint "subscriptions_user_id_fkey";

alter table "public"."checkout_sessions" drop constraint "checkout_sessions_pkey";

alter table "public"."products" drop constraint "products_pkey";

alter table "public"."subscriptions" drop constraint "subscriptions_pkey";

drop index if exists "public"."checkout_sessions_pkey";

drop index if exists "public"."products_pkey";

drop index if exists "public"."subscriptions_pkey";

drop table "public"."checkout_sessions";

drop table "public"."products";

drop table "public"."subscriptions";

create table "public"."listings" (
    "id" uuid not null default gen_random_uuid(),
    "property_name" text not null,
    "property_type" text not null,
    "description" text not null,
    "size" numeric not null,
    "address" text not null,
    "eircode" text not null,
    "active" boolean not null default true,
    "amenities" jsonb not null default '[]'::jsonb,
    "verified" boolean not null default false,
    "occupants" integer,
    "applicants" jsonb not null default '[]'::jsonb
);


CREATE UNIQUE INDEX listings_pkey ON public.listings USING btree (id);

alter table "public"."listings" add constraint "listings_pkey" PRIMARY KEY using index "listings_pkey";

grant delete on table "public"."listings" to "anon";

grant insert on table "public"."listings" to "anon";

grant references on table "public"."listings" to "anon";

grant select on table "public"."listings" to "anon";

grant trigger on table "public"."listings" to "anon";

grant truncate on table "public"."listings" to "anon";

grant update on table "public"."listings" to "anon";

grant delete on table "public"."listings" to "authenticated";

grant insert on table "public"."listings" to "authenticated";

grant references on table "public"."listings" to "authenticated";

grant select on table "public"."listings" to "authenticated";

grant trigger on table "public"."listings" to "authenticated";

grant truncate on table "public"."listings" to "authenticated";

grant update on table "public"."listings" to "authenticated";

grant delete on table "public"."listings" to "service_role";

grant insert on table "public"."listings" to "service_role";

grant references on table "public"."listings" to "service_role";

grant select on table "public"."listings" to "service_role";

grant trigger on table "public"."listings" to "service_role";

grant truncate on table "public"."listings" to "service_role";

grant update on table "public"."listings" to "service_role";


