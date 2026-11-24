/* NUMEROSUTRAS service worker – offline support. Change CACHE when you upload a new version. */
const CACHE = 'numerosutras-v1.0.2';
const FILES = ['./', 'index.html', 'styles.css', 'engine.js', 'i18n.js', 'content.js', 'app.js', 'manifest.webmanifest', 'icon-192.png', 'icon-512.png'];
self.addEventListener('install', e => e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES)).then(() => self.skipWaiting())));
self.addEventListener('activate', e => e.waitUntil(caches.keys().then(k => Promise.all(k.filter(x => x !== CACHE).map(x => caches.delete(x)))).then(() => self.clients.claim())));
/* network first (so updates show at once), cache when offline */
self.addEventListener('fetch', e => {
  const r = e.request;
  if (r.method !== 'GET' || new URL(r.url).origin !== location.origin) return;
  e.respondWith(fetch(r).then(res => { if (res.ok) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(r, copy)); } return res; }).catch(() => caches.match(r, {ignoreSearch: true}).then(m => m || caches.match('index.html'))));
});
