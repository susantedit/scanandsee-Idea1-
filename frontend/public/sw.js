// ScanAndSee Service Worker v2
// Handles: offline caching + push notifications

const CACHE_NAME = 'scanandsee-v2';
const PRECACHE   = ['/', '/index.html', '/manifest.json', '/icons/icon-192.png', '/icons/icon-512.png'];

self.addEventListener('install',  (e) => { e.waitUntil(caches.open(CACHE_NAME).then(c => c.addAll(PRECACHE))); self.skipWaiting(); });
self.addEventListener('activate', (e) => { e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))))); self.clients.claim(); });

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  if (event.request.method !== 'GET' || url.protocol === 'chrome-extension:' || url.protocol === 'moz-extension:' || url.pathname.startsWith('/api/') || url.hostname.includes('firebase') || url.hostname.includes('googleapis') || url.hostname.includes('gstatic')) return;
  if (url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com') {
    event.respondWith(caches.open('fonts-v1').then(cache => cache.match(event.request).then(cached => cached || fetch(event.request).then(res => { cache.put(event.request, res.clone()); return res; }))));
    return;
  }
  event.respondWith(fetch(event.request).then(res => { if (res.ok) caches.open(CACHE_NAME).then(c => c.put(event.request, res.clone())); return res; }).catch(() => caches.match(event.request).then(cached => cached || caches.match('/index.html'))));
});

// ── Push Notifications ────────────────────────────────────────────────────────
self.addEventListener('push', (event) => {
  let data = { title: 'ScanAndSee', body: "Time to scan your food!", icon: '/icons/icon-192.png' };
  try { if (event.data) data = { ...data, ...event.data.json() }; } catch {}
  event.waitUntil(self.registration.showNotification(data.title, {
    body: data.body, icon: data.icon || '/icons/icon-192.png',
    badge: '/icons/icon-96.png', tag: data.tag || 'scanandsee',
    data: data.url ? { url: data.url } : {}, vibrate: [100, 50, 100],
  }));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = event.notification.data?.url || '/';
  event.waitUntil(clients.matchAll({ type: 'window', includeUncontrolled: true }).then(list => {
    for (const c of list) { if (c.url.includes(self.location.origin) && 'focus' in c) { c.navigate(url); return c.focus(); } }
    return clients.openWindow(url);
  }));
});
