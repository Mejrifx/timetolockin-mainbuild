// Service Worker for GM AI Web App
// Provides aggressive caching and offline support for 500K+ users

const CACHE_NAME = 'gm-ai-v1.2.0';
const STATIC_CACHE_NAME = 'gm-ai-static-v1.2.0';
const DYNAMIC_CACHE_NAME = 'gm-ai-dynamic-v1.2.0';
const API_CACHE_NAME = 'gm-ai-api-v1.2.0';

// Static assets to cache immediately
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/images/gm-ai-logo.png',
  '/timetolockin-header-logo-nobg.png',
  '/timetolockin-icon-logo-nobg.png',
];

// API endpoints to cache with different strategies
const API_ENDPOINTS = [
  '/api/pages',
  '/api/daily-tasks',
  '/api/finance-data',
  '/api/health-data',
];

// Cache strategies
const CACHE_STRATEGIES = {
  CACHE_FIRST: 'cache-first',
  NETWORK_FIRST: 'network-first',
  STALE_WHILE_REVALIDATE: 'stale-while-revalidate',
  NETWORK_ONLY: 'network-only',
  CACHE_ONLY: 'cache-only',
};

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('[SW] Installing service worker...');
  
  event.waitUntil(
    Promise.all([
      // Cache static assets
      caches.open(STATIC_CACHE_NAME).then((cache) => {
        console.log('[SW] Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      }),
      // Cache shell for offline support
      caches.open(CACHE_NAME).then((cache) => {
        console.log('[SW] Caching app shell');
        return cache.add('/');
      }),
    ]).then(() => {
      console.log('[SW] Installation complete');
      // Skip waiting to activate immediately
      return self.skipWaiting();
    })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating service worker...');
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          // Delete old caches
          if (
            cacheName !== CACHE_NAME &&
            cacheName !== STATIC_CACHE_NAME &&
            cacheName !== DYNAMIC_CACHE_NAME &&
            cacheName !== API_CACHE_NAME
          ) {
            console.log('[SW] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      console.log('[SW] Activation complete');
      // Take control of all pages immediately
      return self.clients.claim();
    })
  );
});

// Fetch event - implement caching strategies
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }
  
  // Skip chrome-extension requests
  if (url.protocol === 'chrome-extension:') {
    return;
  }

  // Handle different types of requests
  if (isStaticAsset(request)) {
    event.respondWith(handleStaticAsset(request));
  } else if (isAPIRequest(request)) {
    event.respondWith(handleAPIRequest(request));
  } else if (isDocumentRequest(request)) {
    event.respondWith(handleDocumentRequest(request));
  } else {
    event.respondWith(handleDynamicRequest(request));
  }
});

// Check if request is for static assets
function isStaticAsset(request) {
  const url = new URL(request.url);
  return (
    url.pathname.endsWith('.js') ||
    url.pathname.endsWith('.css') ||
    url.pathname.endsWith('.png') ||
    url.pathname.endsWith('.jpg') ||
    url.pathname.endsWith('.jpeg') ||
    url.pathname.endsWith('.svg') ||
    url.pathname.endsWith('.woff') ||
    url.pathname.endsWith('.woff2') ||
    url.pathname.includes('/assets/') ||
    url.pathname.includes('/images/')
  );
}

// Check if request is for API
function isAPIRequest(request) {
  const url = new URL(request.url);
  return (
    url.pathname.startsWith('/api/') ||
    url.hostname.includes('supabase') ||
    url.hostname.includes('api.')
  );
}

// Check if request is for HTML document
function isDocumentRequest(request) {
  return request.destination === 'document';
}

// Handle static assets with cache-first strategy
async function handleStaticAsset(request) {
  try {
    const cache = await caches.open(STATIC_CACHE_NAME);
    const cachedResponse = await cache.match(request);
    
    if (cachedResponse) {
      // Return cached version immediately
      // Update cache in background if needed
      updateCacheInBackground(request, cache);
      return cachedResponse;
    }
    
    // Not in cache, fetch and cache
    const response = await fetch(request);
    if (response.status === 200) {
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    console.error('[SW] Static asset fetch failed:', error);
    // Return offline fallback if available
    return getOfflineFallback(request);
  }
}

// Handle API requests with stale-while-revalidate strategy
async function handleAPIRequest(request) {
  try {
    const cache = await caches.open(API_CACHE_NAME);
    const cachedResponse = await cache.match(request);
    
    // Start network request immediately
    const networkPromise = fetch(request).then(async (response) => {
      if (response.status === 200) {
        // Cache successful responses
        cache.put(request, response.clone());
      }
      return response;
    });
    
    // If we have cached data, return it immediately and update in background
    if (cachedResponse) {
      // Don't await the network request - let it update cache in background
      networkPromise.catch(() => {}); // Ignore network errors when we have cache
      return cachedResponse;
    }
    
    // No cached data, wait for network
    return await networkPromise;
  } catch (error) {
    console.error('[SW] API request failed:', error);
    // Try to return cached version as fallback
    const cache = await caches.open(API_CACHE_NAME);
    const cachedResponse = await cache.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    throw error;
  }
}

// Handle document requests (HTML pages)
async function handleDocumentRequest(request) {
  try {
    // Always try network first for HTML documents
    const response = await fetch(request, { 
      // Add timeout to prevent slow requests
      signal: AbortSignal.timeout(5000) 
    });
    
    if (response.status === 200) {
      const cache = await caches.open(DYNAMIC_CACHE_NAME);
      cache.put(request, response.clone());
    }
    
    return response;
  } catch (error) {
    console.error('[SW] Document request failed:', error);
    // Return cached version or app shell
    const cache = await caches.open(DYNAMIC_CACHE_NAME);
    const cachedResponse = await cache.match(request);
    
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Return app shell as fallback
    return cache.match('/');
  }
}

// Handle other dynamic requests
async function handleDynamicRequest(request) {
  try {
    const response = await fetch(request);
    
    if (response.status === 200) {
      const cache = await caches.open(DYNAMIC_CACHE_NAME);
      cache.put(request, response.clone());
    }
    
    return response;
  } catch (error) {
    // Try cache fallback
    const cache = await caches.open(DYNAMIC_CACHE_NAME);
    const cachedResponse = await cache.match(request);
    
    if (cachedResponse) {
      return cachedResponse;
    }
    
    throw error;
  }
}

// Update cache in background
async function updateCacheInBackground(request, cache) {
  try {
    const response = await fetch(request);
    if (response.status === 200) {
      await cache.put(request, response.clone());
    }
  } catch (error) {
    // Ignore background update errors
    console.warn('[SW] Background cache update failed:', error);
  }
}

// Get offline fallback
async function getOfflineFallback(request) {
  // Return cached app shell for navigation requests
  if (request.destination === 'document') {
    const cache = await caches.open(CACHE_NAME);
    return cache.match('/');
  }
  
  // Return empty response for other requests
  return new Response('Offline', { status: 503 });
}

// Background sync for offline actions
self.addEventListener('sync', (event) => {
  console.log('[SW] Background sync triggered:', event.tag);
  
  if (event.tag === 'offline-actions') {
    event.waitUntil(syncOfflineActions());
  }
});

// Sync offline actions when back online
async function syncOfflineActions() {
  try {
    // Get offline actions from IndexedDB or localStorage
    const offlineActions = await getOfflineActions();
    
    for (const action of offlineActions) {
      try {
        // Replay the action
        await fetch(action.url, {
          method: action.method,
          headers: action.headers,
          body: action.body,
        });
        
        // Remove successful action
        await removeOfflineAction(action.id);
      } catch (error) {
        console.error('[SW] Failed to sync action:', error);
      }
    }
  } catch (error) {
    console.error('[SW] Background sync failed:', error);
  }
}

// Placeholder functions for offline action management
async function getOfflineActions() {
  // Implementation would use IndexedDB to store offline actions
  return [];
}

async function removeOfflineAction(id) {
  // Implementation would remove action from IndexedDB
}

// Message handling for cache management
self.addEventListener('message', (event) => {
  const { type, payload } = event.data;
  
  switch (type) {
    case 'CACHE_UPDATE':
      handleCacheUpdate(payload);
      break;
    case 'CLEAR_CACHE':
      handleClearCache(payload);
      break;
    case 'GET_CACHE_SIZE':
      handleGetCacheSize(event);
      break;
    default:
      console.warn('[SW] Unknown message type:', type);
  }
});

// Handle cache updates from the app
async function handleCacheUpdate(payload) {
  try {
    const cache = await caches.open(payload.cacheName || DYNAMIC_CACHE_NAME);
    await cache.put(payload.request, payload.response);
    console.log('[SW] Cache updated:', payload.request.url);
  } catch (error) {
    console.error('[SW] Cache update failed:', error);
  }
}

// Handle cache clearing
async function handleClearCache(payload) {
  try {
    if (payload.cacheName) {
      await caches.delete(payload.cacheName);
    } else {
      // Clear all caches
      const cacheNames = await caches.keys();
      await Promise.all(cacheNames.map(name => caches.delete(name)));
    }
    console.log('[SW] Cache cleared:', payload.cacheName || 'all');
  } catch (error) {
    console.error('[SW] Cache clear failed:', error);
  }
}

// Get cache size information
async function handleGetCacheSize(event) {
  try {
    const cacheNames = await caches.keys();
    const cacheSizes = {};
    
    for (const cacheName of cacheNames) {
      const cache = await caches.open(cacheName);
      const keys = await cache.keys();
      cacheSizes[cacheName] = keys.length;
    }
    
    event.ports[0].postMessage({
      type: 'CACHE_SIZE_RESPONSE',
      payload: cacheSizes,
    });
  } catch (error) {
    console.error('[SW] Get cache size failed:', error);
    event.ports[0].postMessage({
      type: 'CACHE_SIZE_ERROR',
      payload: error.message,
    });
  }
}
