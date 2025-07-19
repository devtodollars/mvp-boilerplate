create type "public"."gender_enum" as enum ('male', 'female', 'prefer_not_to_say');

create type "public"."marital_status_enum" as enum ('single', 'married', 'living with partner', 'divorced', 'widowed');

alter table "public"."users" add column "avatar_id" text;

alter table "public"."users" add column "bio" text;

alter table "public"."users" add column "created_at" timestamp without time zone default now();

alter table "public"."users" add column "date_of_birth" date;

alter table "public"."users" add column "first_name" character varying(50);

alter table "public"."users" add column "gender" gender_enum;

alter table "public"."users" add column "last_login" timestamp without time zone;

alter table "public"."users" add column "last_name" character varying(50);

alter table "public"."users" add column "liked_listings" uuid[];

alter table "public"."users" add column "marital_status" marital_status_enum;

alter table "public"."users" add column "occupation" character varying(100);

alter table "public"."users" add column "owned_listings" uuid[];

alter table "public"."users" add column "pending_applications" uuid[];

alter table "public"."users" add column "pets" boolean;

alter table "public"."users" add column "phone" character varying(20);

alter table "public"."users" add column "rejected_applications" uuid[];

alter table "public"."users" add column "smoker" boolean;

alter table "public"."users" add column "successful_applications" uuid[];

alter table "public"."users" add column "updated_at" timestamp without time zone default now();

alter table "public"."users" add column "uploaded_documents" text[];

alter table "public"."users" add column "verified" boolean default false;


