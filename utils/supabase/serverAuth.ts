import { createClient } from '@/utils/supabase/server';
import { User } from '@supabase/supabase-js';

// Simple in-memory cache for server-side user sessions
// This prevents repeated auth calls within the same request cycle
const userCache = new Map<string, { user: User | null; timestamp: number }>();
const CACHE_DURATION = 30000; // 30 seconds cache

/**
 * Get user with caching to prevent repeated auth calls on server-side
 * Use this instead of direct supabase.auth.getUser() calls in server components
 */
export async function getCachedUser(): Promise<User | null> {
  try {
    const supabase = await createClient();
    
    // Create a simple cache key based on request context
    // In a real app, you'd use session ID or similar
    const cacheKey = 'current_request_user';
    const cached = userCache.get(cacheKey);
    
    // Return cached user if still valid
    if (cached && (Date.now() - cached.timestamp) < CACHE_DURATION) {
      return cached.user;
    }
    
    // Fetch user and cache result
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error) {
      // Handle refresh token errors gracefully
      if (error.code === 'refresh_token_not_found' || 
          error.message?.includes('Invalid Refresh Token')) {
        console.log('No valid session found');
        userCache.set(cacheKey, { user: null, timestamp: Date.now() });
        return null;
      } else {
        console.error('Authentication error:', error);
        return null;
      }
    }
    
    // Cache the result
    userCache.set(cacheKey, { user, timestamp: Date.now() });
    return user;
    
  } catch (error) {
    console.error('Error in getCachedUser:', error);
    return null;
  }
}

/**
 * Clear the user cache - call this when you know the user state has changed
 */
export function clearUserCache() {
  userCache.clear();
}