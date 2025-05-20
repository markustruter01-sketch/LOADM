// Cache name for application resources
const CACHE_NAME = 'loadmaster-offline-v1';

// Resources to cache on install
const STATIC_RESOURCES = [
  '/',
  '/index.html',
  '/service-worker.js',
  '/favicon.ico',
  // Add other static assets as needed
];

// Files that should never be cached
const NEVER_CACHE = [
  '/api/auth/',
];

// Install event - cache static resources
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Service worker caching static resources');
        return cache.addAll(STATIC_RESOURCES);
      })
      .catch(error => console.error('Error caching static resources:', error))
  );
  
  // Force new service worker to become active immediately
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Service worker removing old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  
  // Claim any clients/pages loaded before the service worker became active
  self.clients.claim();
});

// Decide whether to cache a response based on its URL and response type
function shouldCacheResponse(url, response) {
  // Don't cache if it's in the NEVER_CACHE list
  if (NEVER_CACHE.some(urlPattern => url.includes(urlPattern))) {
    return false;
  }
  
  // Only cache successful responses
  if (!response || response.status !== 200) {
    return false;
  }
  
  // Don't cache API requests except for specific cacheable ones
  if (url.includes('/api/')) {
    // Always cache training modules, aircraft configs, and documents
    if (
      url.includes('/api/training-modules') ||
      url.includes('/api/aircraft-configs') ||
      url.includes('/api/document-templates') ||
      url.includes('/api/tools')
    ) {
      return true;
    }
    
    return false;
  }
  
  // Cache other successful responses (images, CSS, JS, etc.)
  return true;
}

// Cache GET API responses for offline access
self.addEventListener('fetch', (event) => {
  // Skip non-GET requests
  if (event.request.method !== 'GET') {
    return;
  }
  
  const requestUrl = new URL(event.request.url);
  
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Cache a copy of the response if appropriate
        if (shouldCacheResponse(event.request.url, response)) {
          const responseToCache = response.clone();
          caches.open(CACHE_NAME)
            .then((cache) => {
              cache.put(event.request, responseToCache);
            });
        }
        
        // Return the network response
        return response;
      })
      .catch(() => {
        // Try to get from cache if network request fails
        return caches.match(event.request)
          .then((cachedResponse) => {
            if (cachedResponse) {
              return cachedResponse;
            }
            
            // For navigation requests, return the offline fallback page
            if (event.request.mode === 'navigate') {
              return caches.match('/')
                .then((cachedIndex) => {
                  return cachedIndex || Response.error();
                });
            }
            
            // If nothing in cache and network failed, return error
            return Response.error();
          });
      })
  );
});

// Store failed requests for later retry
const pendingRequests = new Map();

// Handle POST/PUT/DELETE requests when offline
self.addEventListener('fetch', (event) => {
  // Only process non-GET requests
  if (event.request.method === 'GET') {
    return;
  }
  
  // Clone the request to use it in the fetch and save a copy
  const requestClone = event.request.clone();
  
  event.respondWith(
    fetch(event.request)
      .catch(async (error) => {
        // We're offline, store the request for later
        if (!navigator.onLine) {
          // Read the request body
          const body = await requestClone.json();
          
          // Create a unique ID for this request
          const requestId = Date.now().toString(36) + Math.random().toString(36).substring(2);
          
          // Store request details
          pendingRequests.set(requestId, {
            url: requestClone.url,
            method: requestClone.method,
            headers: Array.from(requestClone.headers.entries()),
            body: body,
            timestamp: Date.now()
          });
          
          // Store in localStorage as a backup
          self.clients.matchAll().then(clients => {
            if (clients.length > 0) {
              clients[0].postMessage({
                type: 'STORE_OFFLINE_REQUEST',
                payload: {
                  id: requestId,
                  url: requestClone.url,
                  method: requestClone.method,
                  body: body,
                  timestamp: Date.now()
                }
              });
            }
          });
          
          // Return a fake "accepted" response when offline
          return new Response(JSON.stringify({
            success: true,
            offline: true,
            message: 'Your changes have been saved offline and will be synchronized when you reconnect.'
          }), {
            status: 202,
            headers: { 'Content-Type': 'application/json' }
          });
        }
        
        // If error is not because of being offline, propagate it
        throw error;
      })
  );
});

// Process to sync pending data when coming back online
async function syncPendingData() {
  if (!navigator.onLine) {
    console.log('Still offline, cannot sync data');
    return;
  }
  
  console.log('Starting sync of pending requests');
  
  // Create an array of sync promises
  const syncPromises = [];
  
  // Process each pending request
  for (const [id, request] of pendingRequests.entries()) {
    const syncPromise = fetch(request.url, {
      method: request.method,
      headers: Object.fromEntries(request.headers),
      body: JSON.stringify(request.body),
    })
    .then(response => {
      if (response.ok) {
        console.log(`Successfully synced request ${id}`);
        pendingRequests.delete(id);
        
        // Notify the client
        self.clients.matchAll().then(clients => {
          if (clients.length > 0) {
            clients[0].postMessage({
              type: 'SYNC_SUCCESS',
              requestId: id
            });
          }
        });
      } else {
        console.error(`Failed to sync request ${id}:`, response.statusText);
      }
    })
    .catch(error => {
      console.error(`Error syncing request ${id}:`, error);
    });
    
    syncPromises.push(syncPromise);
  }
  
  // Wait for all sync attempts to complete
  await Promise.allSettled(syncPromises);
  
  // Notify clients that sync is complete
  self.clients.matchAll().then(clients => {
    clients.forEach(client => {
      client.postMessage({
        type: 'SYNC_COMPLETE'
      });
    });
  });
  
  console.log('Sync process completed');
}

// Listen for online status changes
self.addEventListener('online', () => {
  console.log('Browser is back online, starting sync');
  syncPendingData();
});

// Listen for messages from clients
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SYNC_PENDING_DATA') {
    console.log('Received sync request from client');
    syncPendingData();
  }
});