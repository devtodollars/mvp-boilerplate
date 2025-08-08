import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { Database } from '@/types_db';

// Define a function to create a Supabase client for server-side operations
// The function takes a cookie store created with next/headers cookies as an argument
export const createClient = async () => {
  try {
    const cookieStore = cookies();

    if (!cookieStore) {
      throw new Error('Cookie store is not available');
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || typeof supabaseUrl !== 'string') {
      throw new Error('NEXT_PUBLIC_SUPABASE_URL is not set or invalid');
    }

    if (!supabaseAnonKey || typeof supabaseAnonKey !== 'string') {
      throw new Error('NEXT_PUBLIC_SUPABASE_ANON_KEY is not set or invalid');
    }

    // Validate URL format
    try {
      new URL(supabaseUrl);
    } catch (error) {
      throw new Error('NEXT_PUBLIC_SUPABASE_URL is not a valid URL');
    }

    return createServerClient<Database>(
      // Pass Supabase URL and anonymous key from the environment to the client
      supabaseUrl,
      supabaseAnonKey,

      // Define a cookies object with methods for interacting with the cookie store and pass it to the client
      {
        cookies: {
          // The get method is used to retrieve a cookie by its name
          async get(name: string) {
            if (!name || typeof name !== 'string') {
              console.warn('Invalid cookie name provided to get:', name);
              return undefined;
            }
            
            try {
              const cookies = await cookieStore;
              return cookies.get(name)?.value;
            } catch (error) {
              console.error('Error getting cookie:', error);
              return undefined;
            }
          },
          // The set method is used to set a cookie with a given name, value, and options
          async set(name: string, value: string, options: CookieOptions) {
            if (!name || typeof name !== 'string') {
              console.warn('Invalid cookie name provided to set:', name);
              return;
            }
            if (typeof value !== 'string') {
              console.warn('Invalid cookie value provided to set:', value);
              return;
            }
            
            try {
              const cookies = await cookieStore;
              cookies.set({ name, value, ...options });
            } catch (error) {
              // If the set method is called from a Server Component, an error may occur
              // This can be ignored if there is middleware refreshing user sessions
              console.warn('Error setting cookie (this may be expected in some contexts):', error);
            }
          },
          // The remove method is used to delete a cookie by its name
          async remove(name: string, options: CookieOptions) {
            if (!name || typeof name !== 'string') {
              console.warn('Invalid cookie name provided to remove:', name);
              return;
            }
            
            try {
              const cookies = await cookieStore;
              cookies.set({ name, value: '', ...options });
            } catch (error) {
              // If the remove method is called from a Server Component, an error may occur
              // This can be ignored if there is middleware refreshing user sessions
              console.warn('Error removing cookie (this may be expected in some contexts):', error);
            }
          }
        }
      }
    );
  } catch (error) {
    console.error('Error creating server client:', error);
    throw new Error(`Failed to create server client: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

// Helper function to validate server client
export const validateServerClient = (client: any) => {
  if (!client) {
    throw new Error('Server client is required');
  }
  
  if (typeof client.auth !== 'object') {
    throw new Error('Invalid server client: missing auth property');
  }
  
  if (typeof client.from !== 'function') {
    throw new Error('Invalid server client: missing from method');
  }
  
  return true;
};

// Safe server client creation with error handling
export const createSafeServerClient = async () => {
  try {
    const client = await createClient();
    validateServerClient(client);
    return { client, error: null };
  } catch (error) {
    console.error('Error creating safe server client:', error);
    return { 
      client: null, 
      error: error instanceof Error ? error : new Error('Unknown error creating server client') 
    };
  }
};
