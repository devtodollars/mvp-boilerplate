import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { Database } from '@/types_db';

// For admin operations using service role (no cookie access)
export const createAdminClient = () => {
  return createSupabaseClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
};

// For admin operations with cookie access (can get logged-in user + service role)
export const createAdminClientWithCookies = async () => {
  const cookieStore = cookies();

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      cookies: {
        async get(name: string) {
          const store = await cookieStore;
          return store.get(name)?.value;
        },
        async set(name: string, value: string, options: CookieOptions) {
          try {
            const store = await cookieStore;
            store.set({ name, value, ...options });
          } catch {
            // Ignore errors in Server Components
          }
        },
        async remove(name: string, options: CookieOptions) {
          try {
            const store = await cookieStore;
            store.set({ name, value: '', ...options });
          } catch {
            // Ignore errors in Server Components
          }
        },
      },
    }
  );
};
