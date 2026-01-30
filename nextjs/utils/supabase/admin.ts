import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { Database } from '@/types_db';

// For admin operations using service role
export const createAdminClient = () => {
  return createSupabaseClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
};
