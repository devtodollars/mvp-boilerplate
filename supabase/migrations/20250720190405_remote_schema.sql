create policy "Can delete own user data."
on "public"."users"
as permissive
for delete
to public
using ((auth.uid() = id));



