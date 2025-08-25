// Cache management utilities
export interface CacheStats {
  size: number;
  keys: string[];
  memoryUsage?: number;
}

// Get cache statistics from storage cache
export function getStorageCacheStats(): CacheStats {
  // This will be populated by the storage module
  return {
    size: 0,
    keys: []
  };
}

// Clear all caches (storage, service worker, browser)
export async function clearAllCaches(): Promise<void> {
  // Clear storage cache
  const { clearImageCache } = await import('./supabase/storage');
  clearImageCache();
  
  // Clear service worker cache
  if ('caches' in window) {
    const cacheNames = await caches.keys();
    await Promise.all(
      cacheNames.map(cacheName => caches.delete(cacheName))
    );
  }
  
  // Clear browser cache for images
  if ('serviceWorker' in navigator) {
    const registration = await navigator.serviceWorker.getRegistration();
    if (registration) {
      await registration.unregister();
      // Re-register to clear cache
      await navigator.serviceWorker.register('/sw.js');
    }
  }
  
  console.log('All caches cleared');
}

// Preload important images
export async function preloadImages(imagePaths: string[]): Promise<void> {
  const promises = imagePaths.map(path => {
    return new Promise<void>((resolve) => {
      const img = new Image();
      img.onload = () => resolve();
      img.onerror = () => resolve(); // Don't fail on error
      img.src = path;
    });
  });
  
  await Promise.all(promises);
  console.log(`Preloaded ${imagePaths.length} images`);
}

// Monitor cache performance
export function startCacheMonitoring(): void {
  if (typeof window !== 'undefined') {
    // Monitor memory usage
    setInterval(() => {
      if ('memory' in performance) {
        const memory = (performance as any).memory;
        console.log('Memory usage:', {
          usedJSHeapSize: Math.round(memory.usedJSHeapSize / 1024 / 1024) + 'MB',
          totalJSHeapSize: Math.round(memory.totalJSHeapSize / 1024 / 1024) + 'MB',
          jsHeapSizeLimit: Math.round(memory.jsHeapSizeLimit / 1024 / 1024) + 'MB'
        });
      }
    }, 30000); // Every 30 seconds
  }
} 