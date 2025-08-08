import { createBrowserClient } from '@supabase/ssr';
import { Database } from '@/types_db';

// Define a function to create a Supabase client for client-side operations
export const createClient = () =>
  createBrowserClient<Database>(
    // Pass Supabase URL and anonymous key from the environment to the client
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

// Utility function to safely get user session with error handling
export const getSafeUser = async () => {
  const supabase = createClient();
  try {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error) {
      // Handle refresh token errors gracefully
      if (error.code === 'refresh_token_not_found' || 
          error.message?.includes('Invalid Refresh Token')) {
        console.log('No valid session found');
        return { user: null, error: null };
      } else {
        console.error('Authentication error:', error);
        return { user: null, error };
      }
    }
    return { user, error: null };
  } catch (error: any) {
    console.error('Unexpected error getting user:', error);
    return { user: null, error };
  }
};
