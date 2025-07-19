drop trigger if exists "enforce_bucket_name_length_trigger" on "storage"."buckets";

drop trigger if exists "objects_delete_delete_prefix" on "storage"."objects";

drop trigger if exists "objects_insert_create_prefix" on "storage"."objects";

drop trigger if exists "objects_update_create_prefix" on "storage"."objects";

drop trigger if exists "prefixes_create_hierarchy" on "storage"."prefixes";

drop trigger if exists "prefixes_delete_hierarchy" on "storage"."prefixes";

revoke delete on table "storage"."prefixes" from "anon";

revoke insert on table "storage"."prefixes" from "anon";

revoke references on table "storage"."prefixes" from "anon";

revoke select on table "storage"."prefixes" from "anon";

revoke trigger on table "storage"."prefixes" from "anon";

revoke truncate on table "storage"."prefixes" from "anon";

revoke update on table "storage"."prefixes" from "anon";

revoke delete on table "storage"."prefixes" from "authenticated";

revoke insert on table "storage"."prefixes" from "authenticated";

revoke references on table "storage"."prefixes" from "authenticated";

revoke select on table "storage"."prefixes" from "authenticated";

revoke trigger on table "storage"."prefixes" from "authenticated";

revoke truncate on table "storage"."prefixes" from "authenticated";

revoke update on table "storage"."prefixes" from "authenticated";

revoke delete on table "storage"."prefixes" from "service_role";

revoke insert on table "storage"."prefixes" from "service_role";

revoke references on table "storage"."prefixes" from "service_role";

revoke select on table "storage"."prefixes" from "service_role";

revoke trigger on table "storage"."prefixes" from "service_role";

revoke truncate on table "storage"."prefixes" from "service_role";

revoke update on table "storage"."prefixes" from "service_role";

alter table "storage"."prefixes" drop constraint "prefixes_bucketId_fkey";

drop function if exists "storage"."add_prefixes"(_bucket_id text, _name text);

drop function if exists "storage"."delete_prefix"(_bucket_id text, _name text);

drop function if exists "storage"."delete_prefix_hierarchy_trigger"();

drop function if exists "storage"."enforce_bucket_name_length"();

drop function if exists "storage"."get_level"(name text);

drop function if exists "storage"."get_prefix"(name text);

drop function if exists "storage"."get_prefixes"(name text);

drop function if exists "storage"."objects_insert_prefix_trigger"();

drop function if exists "storage"."objects_update_prefix_trigger"();

drop function if exists "storage"."prefixes_insert_trigger"();

drop function if exists "storage"."search_legacy_v1"(prefix text, bucketname text, limits integer, levels integer, offsets integer, search text, sortcolumn text, sortorder text);

drop function if exists "storage"."search_v1_optimised"(prefix text, bucketname text, limits integer, levels integer, offsets integer, search text, sortcolumn text, sortorder text);

drop function if exists "storage"."search_v2"(prefix text, bucket_name text, limits integer, levels integer, start_after text);

alter table "storage"."prefixes" drop constraint "prefixes_pkey";

drop index if exists "storage"."idx_name_bucket_level_unique";

drop index if exists "storage"."idx_objects_lower_name";

drop index if exists "storage"."idx_prefixes_lower_name";

drop index if exists "storage"."objects_bucket_id_level_idx";

drop index if exists "storage"."prefixes_pkey";

drop table "storage"."prefixes";

alter table "storage"."objects" drop column "level";

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION storage.extension(name text)
 RETURNS text
 LANGUAGE plpgsql
AS $function$
DECLARE
_parts text[];
_filename text;
BEGIN
	select string_to_array(name, '/') into _parts;
	select _parts[array_length(_parts,1)] into _filename;
	-- @todo return the last part instead of 2
	return reverse(split_part(reverse(_filename), '.', 1));
END
$function$
;

CREATE OR REPLACE FUNCTION storage.foldername(name text)
 RETURNS text[]
 LANGUAGE plpgsql
AS $function$
DECLARE
_parts text[];
BEGIN
	select string_to_array(name, '/') into _parts;
	return _parts[1:array_length(_parts,1)-1];
END
$function$
;

CREATE OR REPLACE FUNCTION storage.get_size_by_bucket()
 RETURNS TABLE(size bigint, bucket_id text)
 LANGUAGE plpgsql
AS $function$
BEGIN
    return query
        select sum((metadata->>'size')::int) as size, obj.bucket_id
        from "storage".objects as obj
        group by obj.bucket_id;
END
$function$
;

CREATE OR REPLACE FUNCTION storage.search(prefix text, bucketname text, limits integer DEFAULT 100, levels integer DEFAULT 1, offsets integer DEFAULT 0, search text DEFAULT ''::text, sortcolumn text DEFAULT 'name'::text, sortorder text DEFAULT 'asc'::text)
 RETURNS TABLE(name text, id uuid, updated_at timestamp with time zone, created_at timestamp with time zone, last_accessed_at timestamp with time zone, metadata jsonb)
 LANGUAGE plpgsql
 STABLE
AS $function$
declare
  v_order_by text;
  v_sort_order text;
begin
  case
    when sortcolumn = 'name' then
      v_order_by = 'name';
    when sortcolumn = 'updated_at' then
      v_order_by = 'updated_at';
    when sortcolumn = 'created_at' then
      v_order_by = 'created_at';
    when sortcolumn = 'last_accessed_at' then
      v_order_by = 'last_accessed_at';
    else
      v_order_by = 'name';
  end case;

  case
    when sortorder = 'asc' then
      v_sort_order = 'asc';
    when sortorder = 'desc' then
      v_sort_order = 'desc';
    else
      v_sort_order = 'asc';
  end case;

  v_order_by = v_order_by || ' ' || v_sort_order;

  return query execute
    'with folders as (
       select path_tokens[$1] as folder
       from storage.objects
         where objects.name ilike $2 || $3 || ''%''
           and bucket_id = $4
           and array_length(objects.path_tokens, 1) <> $1
       group by folder
       order by folder ' || v_sort_order || '
     )
     (select folder as "name",
            null as id,
            null as updated_at,
            null as created_at,
            null as last_accessed_at,
            null as metadata from folders)
     union all
     (select path_tokens[$1] as "name",
            id,
            updated_at,
            created_at,
            last_accessed_at,
            metadata
     from storage.objects
     where objects.name ilike $2 || $3 || ''%''
       and bucket_id = $4
       and array_length(objects.path_tokens, 1) = $1
     order by ' || v_order_by || ')
     limit $5
     offset $6' using levels, prefix, search, bucketname, limits, offsets;
end;
$function$
;

create policy "Authenticated upload"
on "storage"."objects"
as permissive
for insert
to public
with check ((auth.role() = 'authenticated'::text));


create policy "Give users authenticated access to folder 1i0okip_0"
on "storage"."objects"
as permissive
for select
to public
using (((bucket_id = 'listing-images'::text) AND ((storage.foldername(name))[1] = 'private'::text) AND (auth.role() = 'authenticated'::text)));


create policy "Give users authenticated access to folder 1i0okip_1"
on "storage"."objects"
as permissive
for insert
to public
with check (((bucket_id = 'listing-images'::text) AND ((storage.foldername(name))[1] = 'private'::text) AND (auth.role() = 'authenticated'::text)));


create policy "Give users authenticated access to folder 1i0okip_2"
on "storage"."objects"
as permissive
for update
to public
using (((bucket_id = 'listing-images'::text) AND ((storage.foldername(name))[1] = 'private'::text) AND (auth.role() = 'authenticated'::text)));


create policy "Give users authenticated access to folder 1i0okip_3"
on "storage"."objects"
as permissive
for delete
to public
using (((bucket_id = 'listing-images'::text) AND ((storage.foldername(name))[1] = 'private'::text) AND (auth.role() = 'authenticated'::text)));



