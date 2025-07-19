-- Fix listings RLS policies to allow public access to all listings
-- Drop the restrictive policy that only shows active listings to everyone
drop policy if exists "Published listings are viewable by everyone" on "public"."listings";

-- Create a new policy that allows everyone to see ALL listings
create policy "All listings are viewable by everyone"
on "public"."listings"
as permissive
for select
to public
using (true);

-- Keep the existing policies for authenticated users
-- Users can still view their own listings (this policy already exists)
-- Users can insert their own listings (this policy already exists)
-- Users can update their own listings (this policy already exists)
-- Users can delete their own listings (this policy already exists) 