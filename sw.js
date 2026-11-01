
const CACHE = 'witney-wire-review-20261101-mark-direct-4';
const ASSETS = [
  './',
  'index.html',
  'styles.css',
  'app.js',
  'offline.html',
  'data/articles.json'
];

self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(ASSETS)));
});

self.addEventListener('activate', event => {
  event.waitUntil(Promise.all([
    caches.keys().then(keys => Promise.all(keys.filter(key => key.startsWith('witney-wire-') && key !== CACHE).map(key => caches.delete(key)))),
    self.clients.claim()
  ]));
});

self.addEventListener('fetch', event => {
  event.respondWith(
    fetch(event.request).catch(() => caches.match(event.request).then(res => res || caches.match('offline.html')))
  );
});
