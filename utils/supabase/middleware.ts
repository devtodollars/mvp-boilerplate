import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { type NextRequest, NextResponse } from 'next/server';

export const createClient = (request: NextRequest) => {
  if (!request) {
    throw new Error('Request object is required');
  }

  // Create an unmodified response
  let response = NextResponse.next({
    request: {
      headers: request.headers
    }
  });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || typeof supabaseUrl !== 'string') {
    throw new Error('NEXT_PUBLIC_SUPABASE_URL is not set or invalid');
  }

  if (!supabaseAnonKey || typeof supabaseAnonKey !== 'string') {
    throw new Error('NEXT_PUBLIC_SUPABASE_ANON_KEY is not set or invalid');
  }

  try {
    const supabase = createServerClient(
      supabaseUrl,
      supabaseAnonKey,
      {
        cookies: {
          get(name: string) {
            if (!name || typeof name !== 'string') {
              console.warn('Invalid cookie name provided:', name);
              return undefined;
            }
            return request.cookies.get(name)?.value;
          },
          set(name: string, value: string, options: CookieOptions) {
            if (!name || typeof name !== 'string') {
              console.warn('Invalid cookie name provided for set:', name);
              return;
            }
            if (typeof value !== 'string') {
              console.warn('Invalid cookie value provided for set:', value);
              return;
            }
            
            // If the cookie is updated, update the cookies for the request and response
            request.cookies.set({
              name,
              value,
              ...options
            });
            response = NextResponse.next({
              request: {
                headers: request.headers
              }
            });
            response.cookies.set({
              name,
              value,
              ...options
            });
          },
          remove(name: string, options: CookieOptions) {
            if (!name || typeof name !== 'string') {
              console.warn('Invalid cookie name provided for remove:', name);
              return;
            }
            
            // If the cookie is removed, update the cookies for the request and response
            request.cookies.set({
              name,
              value: '',
              ...options
            });
            response = NextResponse.next({
              request: {
                headers: request.headers
              }
            });
            response.cookies.set({
              name,
              value: '',
              ...options
            });
          }
        }
      }
    );

    return { supabase, response };
  } catch (error) {
    console.error('Error creating Supabase client:', error);
    throw new Error(`Failed to create Supabase client: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

export const updateSession = async (request: NextRequest) => {
  if (!request) {
    console.error('No request object provided to updateSession');
    return NextResponse.next();
  }

  try {
    // This `try/catch` block is only here for the interactive tutorial.
    // Feel free to remove once you have Supabase connected.
    const { supabase, response } = createClient(request);

    // This will refresh session if expired - required for Server Components
    // https://supabase.com/docs/guides/auth/server-side/nextjs
    try {
      await supabase.auth.getUser();
    } catch (authError: any) {
      // Handle refresh token errors gracefully
      if (authError?.code === 'refresh_token_not_found' || 
          authError?.message?.includes('Invalid Refresh Token')) {
        // This is expected when there's no valid session, just continue
        console.log('No valid session found, continuing without authentication');
      } else {
        // Re-throw other authentication errors
        console.error('Authentication error:', authError);
        throw authError;
      }
    }

    return response;
  } catch (e) {
    // If you are here, a Supabase client could not be created!
    // This is likely because you have not set up environment variables.
    // Check out http://localhost:3000 for Next Steps.
    console.error('Error in updateSession:', e);
    return NextResponse.next();
  }
};

// Helper function to validate request object
export const validateRequest = (request: NextRequest): boolean => {
  if (!request) {
    return false;
  }
  
  if (!request.headers) {
    return false;
  }
  
  if (!request.cookies) {
    return false;
  }
  
  return true;
};

// Safe session update with error handling
export const safeUpdateSession = async (request: NextRequest) => {
  if (!validateRequest(request)) {
    console.error('Invalid request object provided to safeUpdateSession');
    return NextResponse.next();
  }

  try {
    return await updateSession(request);
  } catch (error) {
    console.error('Error in safeUpdateSession:', error);
    return NextResponse.next();
  }
};
