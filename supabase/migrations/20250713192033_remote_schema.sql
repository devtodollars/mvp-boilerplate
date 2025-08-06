create type "public"."amenity_type" as enum ('Wi-Fi', 'Parking', 'Garden Access', 'Balcony/Terrace', 'Washing Machine', 'Dryer', 'Dishwasher', 'Microwave', 'TV', 'Central Heating', 'Fireplace', 'Air Conditioning', 'Gym Access', 'Swimming Pool', 'Storage Space', 'Bike Storage', 'Furnished', 'Unfurnished', 'Pet Friendly', 'Smoking Allowed');

create type "public"."ber_rating_enum" as enum ('A1', 'A2', 'A3', 'B1', 'B2', 'B3', 'C1', 'C2', 'C3', 'D1', 'D2', 'E1', 'E2', 'F', 'G');

create type "public"."lease_duration_enum" as enum ('1-month', '2-months', '3-months', '6-months', '12-months', 'flexible');

create type "public"."nearby_facility_type" as enum ('Bus Stop', 'Train Station', 'DART Station', 'Luas Stop', 'Airport', 'Ferry Terminal', 'Bike Share Station', 'Taxi Rank', 'Shopping Centre', 'Supermarket', 'Convenience Store', 'Pharmacy', 'Post Office', 'Bank', 'ATM', 'Laundromat', 'Dry Cleaners', 'Hardware Store', 'Hospital', 'GP Clinic', 'Dental Clinic', 'Walk-in Clinic', 'Veterinary Clinic', 'Primary School', 'Secondary School', 'University/College', 'Library', 'Creche/Childcare', 'Language School', 'Restaurant/Café', 'Pub', 'Takeaway', 'Coffee Shop', 'Bakery', 'Grocery Market', 'Gym/Fitness Centre', 'Park', 'Beach', 'Swimming Pool', 'Sports Complex', 'Cinema', 'Theatre', 'Museum', 'Art Gallery', 'Golf Course', 'Tennis Courts', 'Playground', 'Church', 'Mosque', 'Temple', 'Community Centre', 'Garda Station', 'Fire Station', 'Petrol Station', 'Car Park', 'Electric Car Charging');

create type "public"."property_type_enum" as enum ('house', 'apartment', 'flat', 'studio', 'other');

create type "public"."rent_frequency_enum" as enum ('weekly', 'monthly');

create type "public"."room_type_enum" as enum ('single', 'double', 'twin', 'shared', 'digs');

alter table "public"."listings" drop column "occupants";

alter table "public"."listings" add column "apartment_number" text;

alter table "public"."listings" add column "area" text not null default ''::text;

alter table "public"."listings" add column "available_from" date not null default CURRENT_DATE;

alter table "public"."listings" add column "ber_cert_number" text;

alter table "public"."listings" add column "ber_rating" ber_rating_enum;

alter table "public"."listings" add column "city" text not null default ''::text;

alter table "public"."listings" add column "county" text not null default ''::text;

alter table "public"."listings" add column "created_at" timestamp with time zone not null default now();

alter table "public"."listings" add column "current_females" integer not null default 0;

alter table "public"."listings" add column "current_males" integer not null default 0;

alter table "public"."listings" add column "ensuite" boolean not null default false;

alter table "public"."listings" add column "house_rules" text;

alter table "public"."listings" add column "images" jsonb not null default '[]'::jsonb;

alter table "public"."listings" add column "lease_duration" lease_duration_enum;

alter table "public"."listings" add column "monthly_rent" numeric(10,2) not null default 0;

alter table "public"."listings" add column "nearby_facilities" nearby_facility_type[] not null default '{}'::nearby_facility_type[];

alter table "public"."listings" add column "owner_occupied" boolean not null default false;

alter table "public"."listings" add column "pets" boolean not null default false;

alter table "public"."listings" add column "rent_frequency" rent_frequency_enum;

alter table "public"."listings" add column "room_type" room_type_enum not null default 'single'::room_type_enum;

alter table "public"."listings" add column "security_deposit" numeric(10,2) not null default 0;

alter table "public"."listings" add column "updated_at" timestamp with time zone not null default now();

alter table "public"."listings" add column "user_id" uuid;

alter table "public"."listings" add column "videos" jsonb not null default '[]'::jsonb;

alter table "public"."listings" alter column "active" set default false;

alter table "public"."listings" alter column "amenities" set default '{}'::jsonb;

alter table "public"."listings" alter column "amenities" drop not null;

-- Remove the problematic direct cast and handle it properly in a separate migration
-- alter table "public"."listings" alter column "amenities" set data type amenity_type[] using "amenities"::amenity_type[];

alter table "public"."listings" alter column "property_type" set data type property_type_enum using "property_type"::property_type_enum;

alter table "public"."listings" alter column "size" drop not null;

alter table "public"."listings" enable row level security;

CREATE INDEX idx_listings_active ON public.listings USING btree (active);

CREATE INDEX idx_listings_available_from ON public.listings USING btree (available_from);

CREATE INDEX idx_listings_city ON public.listings USING btree (city);

CREATE INDEX idx_listings_county ON public.listings USING btree (county);

CREATE INDEX idx_listings_user_id ON public.listings USING btree (user_id);

alter table "public"."listings" add constraint "listings_current_females_check" CHECK ((current_females >= 0)) not valid;

alter table "public"."listings" validate constraint "listings_current_females_check";

alter table "public"."listings" add constraint "listings_current_males_check" CHECK ((current_males >= 0)) not valid;

alter table "public"."listings" validate constraint "listings_current_males_check";

alter table "public"."listings" add constraint "listings_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."listings" validate constraint "listings_user_id_fkey";

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.generate_property_name()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
    NEW.property_name = CONCAT(
        CASE NEW.room_type
            WHEN 'single' THEN 'Single Room'
            WHEN 'double' THEN 'Double Doom'
            WHEN 'twin' THEN 'Twin Room'
            WHEN 'shared' THEN 'Shared Room'
            WHEN 'digs' THEN 'Digs'
        END,
        CASE 
            WHEN NEW.ensuite THEN ' Ensuite'
            ELSE ''
        END,
        ' in ',
        COALESCE(NEW.apartment_number || ' ', ''),
        NEW.address,
        CASE 
            WHEN NEW.area IS NOT NULL THEN ', ' || NEW.area
            ELSE ''
        END,
        ', ',
        NEW.county
    );
    RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$function$
;

create policy "Published listings are viewable by everyone"
on "public"."listings"
as permissive
for select
to public
using ((active = true));


create policy "Users can delete their own listings"
on "public"."listings"
as permissive
for delete
to public
using ((auth.uid() = user_id));


create policy "Users can insert their own listings"
on "public"."listings"
as permissive
for insert
to public
with check ((auth.uid() = user_id));


create policy "Users can update their own listings"
on "public"."listings"
as permissive
for update
to public
using ((auth.uid() = user_id));


create policy "Users can view their own listings"
on "public"."listings"
as permissive
for select
to public
using ((auth.uid() = user_id));


CREATE TRIGGER generate_listing_property_name BEFORE INSERT OR UPDATE OF room_type, ensuite, apartment_number, address, area, county ON public.listings FOR EACH ROW EXECUTE FUNCTION generate_property_name();

CREATE TRIGGER update_listings_updated_at BEFORE UPDATE ON public.listings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();


