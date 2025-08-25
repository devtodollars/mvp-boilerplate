/**
 * Simple in-memory cache for API responses to prevent duplicate requests
 * Especially useful for user-specific data that doesn't change frequently
 */

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  userId: string;
}

class ApiCache {
  private cache = new Map<string, CacheEntry<any>>();
  private readonly DEFAULT_TTL = 30000; // 30 seconds

  /**
   * Get cached data if available and not expired
   */
  get<T>(key: string, userId: string, ttl: number = this.DEFAULT_TTL): T | null {
    const entry = this.cache.get(key);
    
    if (!entry) return null;
    
    // Check if expired or different user
    if (Date.now() - entry.timestamp > ttl || entry.userId !== userId) {
      this.cache.delete(key);
      return null;
    }
    
    return entry.data;
  }

  /**
   * Set cached data
   */
  set<T>(key: string, data: T, userId: string): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      userId
    });
  }

  /**
   * Clear cache for specific user (call on sign out)
   */
  clearUser(userId: string): void {
    for (const [key, entry] of this.cache.entries()) {
      if (entry.userId === userId) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Clear all cache
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Clean up expired entries
   */
  cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > this.DEFAULT_TTL) {
        this.cache.delete(key);
      }
    }
  }
}

export const apiCache = new ApiCache();

// Clean up expired entries every 5 minutes
if (typeof window !== 'undefined') {
  setInterval(() => {
    apiCache.cleanup();
  }, 5 * 60 * 1000);
}