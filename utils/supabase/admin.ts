import { createClient } from '@supabase/supabase-js';
import { Database } from '@/types_db';

// Create a Supabase client with service role key for admin operations
export const createAdminClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || typeof supabaseUrl !== 'string') {
    throw new Error('NEXT_PUBLIC_SUPABASE_URL is not set or invalid');
  }

  if (!supabaseServiceKey || typeof supabaseServiceKey !== 'string') {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is not set or invalid');
  }

  // Validate URL format
  try {
    new URL(supabaseUrl);
  } catch (error) {
    throw new Error('NEXT_PUBLIC_SUPABASE_URL is not a valid URL');
  }

  // Validate service key format (should be a JWT-like string)
  if (supabaseServiceKey.split('.').length !== 3) {
    console.warn('SUPABASE_SERVICE_ROLE_KEY may be invalid (should be a JWT token)');
  }

  console.log('Creating admin client with URL:', supabaseUrl);
  console.log('Service role key available:', !!supabaseServiceKey);

  try {
    const client = createClient<Database>(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    // Test the connection
    return client;
  } catch (error) {
    console.error('Error creating admin client:', error);
    throw new Error(`Failed to create admin client: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

// Helper function to validate admin client
export const validateAdminClient = (client: any) => {
  if (!client) {
    throw new Error('Admin client is required');
  }
  
  if (typeof client.auth !== 'object') {
    throw new Error('Invalid admin client: missing auth property');
  }
  
  return true;
};

// Safe admin client creation with error handling
export const createSafeAdminClient = () => {
  try {
    const client = createAdminClient();
    validateAdminClient(client);
    return { client, error: null };
  } catch (error) {
    console.error('Error creating safe admin client:', error);
    return { 
      client: null, 
      error: error instanceof Error ? error : new Error('Unknown error creating admin client') 
    };
  }
}; 