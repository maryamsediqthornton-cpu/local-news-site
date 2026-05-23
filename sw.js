
const CACHE = 'witney-wire-v1';
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

self.addEventListener('fetch', event => {
  event.respondWith(
    fetch(event.request).catch(() => caches.match(event.request).then(res => res || caches.match('offline.html')))
  );
});
