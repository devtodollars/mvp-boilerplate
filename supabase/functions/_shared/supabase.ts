// TODO: fix the import_map.json to also work with types
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7";

export const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  {
    auth: {
      persistSession: false,
    },
  },
);
