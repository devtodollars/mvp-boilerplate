-- Fix RLS policies for users table to allow profile creation
-- Drop existing policies
drop policy if exists "Can view own user data." on users;
drop policy if exists "Can update own user data." on users;

-- Create new policies that allow insert, select, and update
create policy "Can insert own user data." on users for insert with check (auth.uid() = id);
create policy "Can view own user data." on users for select using (auth.uid() = id);
create policy "Can update own user data." on users for update using (auth.uid() = id);

-- Also allow users to view other users' basic profile info (for roommate matching, etc.)
create policy "Can view other users' public data." on users for select using (true); 