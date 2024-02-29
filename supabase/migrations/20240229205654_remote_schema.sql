alter table "public"."stripe" drop column "active_subscription_product";

alter table "public"."stripe" drop column "active_subscription_status";

alter table "public"."stripe" drop column "one_time_payment_products";

alter table "public"."stripe" add column "active_products" text[] not null default '{}'::text[];


