const CACHE_NAME = 'golet-images-v1';
const IMAGE_CACHE_NAME = 'golet-image-cache-v1';

// Install event - cache static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll([
        '/placeholder.svg',
        '/bedroom.png',
        '/defaultAvatar.png'
      ]);
    })
  );
});

// Fetch event - intercept image requests and cache them
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  
  // Only handle image requests
  if (url.pathname.startsWith('/api/images/') || 
      event.request.destination === 'image') {
    
    event.respondWith(
      caches.open(IMAGE_CACHE_NAME).then((cache) => {
        return cache.match(event.request).then((response) => {
          // Return cached version if available
          if (response) {
            return response;
          }
          
          // Fetch from network and cache
          return fetch(event.request).then((networkResponse) => {
            // Clone the response before caching
            const responseToCache = networkResponse.clone();
            
            // Cache the response
            cache.put(event.request, responseToCache);
            
            return networkResponse;
          }).catch(() => {
            // If network fails, return placeholder
            return cache.match('/placeholder.svg');
          });
        });
      })
    );
  }
});

// Clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME && cacheName !== IMAGE_CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
}); 