// Enhanced Service Worker for Equilibria PWA
const CACHE_NAME = 'equilibria-v2';
const STATIC_CACHE = 'equilibria-static-v2';
const DYNAMIC_CACHE = 'equilibria-dynamic-v2';
const OFFLINE_URL = '/';
const API_CACHE_NAME = 'equilibria-api-v2';

// Cache expiration times (in milliseconds)
const API_CACHE_EXPIRY = 5 * 60 * 1000; // 5 minutes
const STATIC_CACHE_EXPIRY = 24 * 60 * 60 * 1000; // 24 hours

// Static assets to cache on install
const STATIC_ASSETS = [
  '/',
  '/transactions',
  '/wallets',
  '/goals',
  '/debts',
  '/reminders',
  '/settings',
  '/manifest.json',
  '/icon.svg',
  '/favicon.svg',
];

// API routes to cache with network-first strategy
const NETWORK_FIRST_API_ROUTES = [
  '/api/transactions',
  '/api/wallets',
  '/api/goals',
  '/api/debts',
  '/api/budgets',
  '/api/health',
  '/api/summary',
  '/api/networth',
  '/api/settings',
];

// API routes to cache with stale-while-revalidate
const STALE_WHILE_REVALIDATE_ROUTES = [
  '/api/categories',
  '/api/health',
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('[SW] Installing service worker...');
  event.waitUntil(
    Promise.all([
      caches.open(STATIC_CACHE).then((cache) => {
        console.log('[SW] Caching static assets');
        return cache.addAll(STATIC_ASSETS).catch(err => {
          console.log('[SW] Failed to cache some assets:', err);
        });
      }),
      caches.open(DYNAMIC_CACHE).then((cache) => {
        console.log('[SW] Dynamic cache ready');
        return cache;
      }),
      caches.open(API_CACHE_NAME).then((cache) => {
        console.log('[SW] API cache ready');
        return cache;
      })
    ]).then(() => {
      console.log('[SW] Service worker installed');
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
        cacheNames.map((name) => {
          if (name !== STATIC_CACHE && name !== DYNAMIC_CACHE && name !== API_CACHE_NAME) {
            console.log('[SW] Deleting old cache:', name);
            return caches.delete(name);
          }
        })
      );
    }).then(() => {
      console.log('[SW] Service worker activated');
      return self.clients.claim();
    })
  );
});

// Fetch event - network first for API, cache first for static
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') return;

  // Skip cross-origin requests
  if (url.origin !== self.location.origin) return;

  // API requests - different strategies based on route
  if (url.pathname.startsWith('/api/')) {
    // Network first for data that needs to be fresh
    if (NETWORK_FIRST_API_ROUTES.some(route => url.pathname.startsWith(route))) {
      event.respondWith(networkFirstWithCache(request, API_CACHE_NAME));
      return;
    }
    // Stale-while-revalidate for reference data
    if (STALE_WHILE_REVALIDATE_ROUTES.some(route => url.pathname.startsWith(route))) {
      event.respondWith(staleWhileRevalidate(request, API_CACHE_NAME));
      return;
    }
    // Cache only for health checks
    if (url.pathname === '/api/health') {
      event.respondWith(cacheFirstWithNetwork(request, API_CACHE_NAME));
      return;
    }
    return;
  }

  // Static assets - cache first with network fallback
  if (
    request.destination === 'document' ||
    request.destination === 'script' ||
    request.destination === 'style' ||
    request.destination === 'image' ||
    request.destination === 'font'
  ) {
    event.respondWith(cacheFirstWithNetwork(request, STATIC_CACHE));
    return;
  }

  // Navigation requests - network first with offline fallback
  if (request.mode === 'navigate') {
    event.respondWith(networkFirstWithCache(request, DYNAMIC_CACHE));
    return;
  }

  // External resources (CDN) - stale-while-revalidate
  if (url.hostname.includes('unpkg.com') || url.hostname.includes('cdnjs.cloudflare.com')) {
    event.respondWith(staleWhileRevalidate(request, DYNAMIC_CACHE));
    return;
  }

  // Default - network only
  event.respondWith(fetch(request).catch(() => {
    return caches.match(OFFLINE_URL);
  }));
});

// Network first with cache fallback
async function networkFirstWithCache(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cachedResponse = await cache.match(request);
  const cachedTime = cachedResponse?.headers.get('sw-cached-time');
  const isCacheValid = cachedTime && (Date.now() - parseInt(cachedTime, 10)) < API_CACHE_EXPIRY;

  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      // Clone and add cache timestamp
      const responseToCache = networkResponse.clone();
      const headers = new Headers(responseToCache.headers);
      headers.set('sw-cached-time', Date.now().toString());

      const responseWithTimestamp = new Response(await responseToCache.blob(), {
        status: responseToCache.status,
        statusText: responseToCache.statusText,
        headers: headers
      });

      cache.put(request, responseWithTimestamp);
    }
    return networkResponse;
  } catch (error) {
    // Return cached response if available
    if (cachedResponse && isCacheValid) {
      console.log('[SW] Returning cached response for:', request.url);
      return cachedResponse;
    }
    // Return stale cache if network fails
    if (cachedResponse) {
      console.log('[SW] Returning stale cache for:', request.url);
      return cachedResponse;
    }
    // Return offline page for navigation requests
    if (request.mode === 'navigate') {
      return caches.match(OFFLINE_URL);
    }
    throw error;
  }
}

// Stale-while-revalidate strategy
async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cachedResponse = await cache.match(request);

  const fetchPromise = fetch(request).then((networkResponse) => {
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  }).catch(() => null);

  // Return cached response immediately if available, otherwise wait for network
  return cachedResponse || fetchPromise;
}

// Cache first with network fallback
async function cacheFirstWithNetwork(request, cacheName) {
  const cachedResponse = await caches.match(request);
  if (cachedResponse) {
    // Update cache in background
    fetch(request).then((response) => {
      if (response.ok) {
        caches.open(cacheName).then((cache) => cache.put(request, response));
      }
    }).catch(() => {});
    return cachedResponse;
  }
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    throw error;
  }
}

// Cache expiration cleanup
async function cleanupExpiredCache(cacheName, maxAge) {
  const cache = await caches.open(cacheName);
  const keys = await cache.keys();

  for (const request of keys) {
    const response = await cache.match(request);
    const cachedTime = response?.headers.get('sw-cached-time');

    if (cachedTime) {
      const age = Date.now() - parseInt(cachedTime, 10);
      if (age > maxAge) {
        await cache.delete(request);
        console.log('[SW] Deleted expired cache:', request.url);
      }
    }
  }
}

// Periodic cache cleanup (runs on startup)
self.addEventListener('message', (event) => {
  if (event.data.type === 'CLEANUP_CACHE') {
    cleanupExpiredCache(API_CACHE_NAME, API_CACHE_EXPIRY);
    cleanupExpiredCache(STATIC_CACHE, STATIC_CACHE_EXPIRY);
  }
});

// Push notification event
self.addEventListener('push', (event) => {
  console.log('[SW] Push received');

  let data = {
    title: 'Equilibria',
    body: 'You have a new notification',
    icon: '/icon.svg',
    badge: '/icon.svg',
    tag: 'equilibria-notification',
    data: {}
  };

  try {
    if (event.data) {
      data = { ...data, ...event.data.json() };
    }
  } catch (e) {
    console.log('[SW] Error parsing push data:', e);
  }

  const options = {
    body: data.body,
    icon: data.icon,
    badge: data.badge,
    tag: data.tag,
    vibrate: [200, 100, 200, 100, 200],
    requireInteraction: true,
    data: data.data,
    actions: [
      { action: 'view', title: 'Lihat' },
      { action: 'dismiss', title: 'Tutup' }
    ]
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

// Notification click event
self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notification clicked');
  event.notification.close();

  if (event.action === 'dismiss') {
    return;
  }

  const redirectUrl = event.notification.data?.redirect || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Check if there's already a window open
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.navigate(redirectUrl);
          return client.focus();
        }
      }
      // Open new window
      if (clients.openWindow) {
        return clients.openWindow(redirectUrl);
      }
    })
  );
});

// Background sync for offline transactions
self.addEventListener('sync', (event) => {
  console.log('[SW] Background sync:', event.tag);

  if (event.tag === 'sync-transactions') {
    event.waitUntil(syncOfflineTransactions());
  }
});

async function syncOfflineTransactions() {
  try {
    // Get offline queue from IndexedDB or localStorage
    const clients = await self.clients.matchAll();
    if (clients.length > 0) {
      clients[0].postMessage({ type: 'SYNC_OFFLINE_TRANSACTIONS' });
    }
  } catch (error) {
    console.log('[SW] Sync failed:', error);
  }
}

// Message handler for communication with main thread
self.addEventListener('message', (event) => {
  console.log('[SW] Message received:', event.data);

  if (event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }

  if (event.data.type === 'GET_VERSION') {
    event.ports[0].postMessage({ version: CACHE_NAME });
  }
});

console.log('[SW] Service worker loaded');