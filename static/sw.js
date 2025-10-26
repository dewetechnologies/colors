const CACHE_NAME = 'minduwc-cache-v1';
const URLS_TO_CACHE = [
  '/',
  '/signin',
  '/register',
  '/static/style.css',
  '/static/main.js',
  '/static/logo.png'
];

// Install the service worker and cache the static assets
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Opened cache');
        return cache.addAll(URLS_TO_CACHE);
      })
  );
});

// Serve cached content when offline
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Cache hit - return response
        return response || fetch(event.request);
      })
  );
});

// Clean up old caches
self.addEventListener('activate', event => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then(cacheNames => Promise.all(
      cacheNames.map(cacheName => cacheWhitelist.includes(cacheName) ? null : caches.delete(cacheName))
    ))
  );
});