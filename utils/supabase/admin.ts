import { createClient } from '@supabase/supabase-js';
import { Database } from '@/types_db';

// Create a Supabase client with service role key for admin operations
export const createAdminClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

  if (!supabaseUrl) {
    throw new Error('NEXT_PUBLIC_SUPABASE_URL is not set');
  }

  if (!supabaseServiceKey) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is not set');
  }

  console.log('Creating admin client with URL:', supabaseUrl);
  console.log('Service role key available:', !!supabaseServiceKey);

  return createClient<Database>(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
}; 