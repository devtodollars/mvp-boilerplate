import { createClient } from '@/utils/supabase/server';
import { User } from '@supabase/supabase-js';
import { NextRequest } from 'next/server';

// Simple in-memory cache for API route auth calls
// This prevents repeated auth calls within the same API request
const apiAuthCache = new Map<string, { user: User | null; timestamp: number }>();
const CACHE_DURATION = 10000; // 10 seconds cache for API routes

/**
 * Get authenticated user for API routes with caching
 * Use this instead of direct supabase.auth.getUser() calls in API routes
 */
export async function getApiUser(request?: NextRequest): Promise<{ user: User | null; error?: string }> {
  try {
    const supabase = await createClient();
    
    // Create a simple cache key based on request headers
    // In a real app, you'd use session token or similar
    const authHeader = request?.headers.get('authorization') || 'default';
    const cacheKey = `api_user_${authHeader}`;
    const cached = apiAuthCache.get(cacheKey);
    
    // Return cached user if still valid
    if (cached && (Date.now() - cached.timestamp) < CACHE_DURATION) {
      return { user: cached.user };
    }
    
    // Fetch user and cache result
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error) {
      // Handle refresh token errors gracefully
      if (error.code === 'refresh_token_not_found' || 
          error.message?.includes('Invalid Refresh Token')) {
        console.log('No valid session found in API route');
        apiAuthCache.set(cacheKey, { user: null, timestamp: Date.now() });
        return { user: null, error: 'No valid session' };
      } else {
        console.error('API Authentication error:', error);
        return { user: null, error: error.message };
      }
    }
    
    // Cache the result
    apiAuthCache.set(cacheKey, { user, timestamp: Date.now() });
    return { user };
    
  } catch (error) {
    console.error('Error in getApiUser:', error);
    return { user: null, error: 'Authentication failed' };
  }
}

/**
 * Clear the API auth cache - call this when you know the user state has changed
 */
export function clearApiAuthCache() {
  apiAuthCache.clear();
}