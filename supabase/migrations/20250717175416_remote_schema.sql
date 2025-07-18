alter table "public"."listings" add column "lat" double precision;

alter table "public"."listings" add column "lng" double precision;

alter table "public"."listings" alter column "amenities" set not null;


