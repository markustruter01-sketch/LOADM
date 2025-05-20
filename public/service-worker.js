// Service Worker for LOADMworkflow - Enables offline functionality

const CACHE_NAME = 'loadmworkflow-v1';

// Assets to cache
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/training-modules',
  '/documents',
  '/tools',
  '/cargo-bay.png',
  '/loadmaster-banner.jpg',
  '/scenario-banner.jpg'
];

// Install event - Cache static assets
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      })
  );
  self.skipWaiting();
});

// Activate event - Clean up old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.filter(cacheName => {
          return cacheName !== CACHE_NAME;
        }).map(cacheName => {
          return caches.delete(cacheName);
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch event - Network first with cache fallback strategy
self.addEventListener('fetch', event => {
  // Skip cross-origin requests
  if (!event.request.url.startsWith(self.location.origin)) {
    return;
  }
  
  // Skip API requests that should not be cached
  if (event.request.url.includes('/api/') && 
      !event.request.url.includes('aircraft-configs') && 
      !event.request.url.includes('training-modules')) {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then(response => {
        // Cache successful responses
        if (response && response.status === 200) {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, responseClone);
          });
        }
        return response;
      })
      .catch(() => {
        // Fallback to cache if network fails
        return caches.match(event.request)
          .then(cachedResponse => {
            if (cachedResponse) {
              return cachedResponse;
            }
            
            // If it's an API request, serve a fallback offline response
            if (event.request.url.includes('/api/')) {
              return new Response(
                JSON.stringify({ 
                  error: 'You are currently offline. This data requires an internet connection.',
                  offline: true 
                }),
                { 
                  headers: { 'Content-Type': 'application/json' } 
                }
              );
            }
            
            // For HTML pages, serve the cached home page as fallback
            if (event.request.headers.get('accept').includes('text/html')) {
              return caches.match('/');
            }
            
            // Otherwise, return a simple offline response
            return new Response('Offline content not available');
          });
      })
  );
});

// Background sync for pending changes
self.addEventListener('sync', event => {
  if (event.tag === 'sync-pending-data') {
    event.waitUntil(syncPendingData());
  }
});

// Function to sync pending data when connection is restored
async function syncPendingData() {
  try {
    // This would be implemented with IndexedDB in a full implementation
    console.log('Syncing pending data');
    // You would iterate through stored pending changes and submit them
  } catch (error) {
    console.error('Error syncing pending data:', error);
  }
}