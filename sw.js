// Service worker OPAC publik: halaman & data diambil dari jaringan dulu (selalu terbaru),
// jika luring dipakai salinan terakhir. Aset (CSS, font, sampul) disimpan setelah dimuat.
const CACHE = 'opac-v3';
const INTI = ['./', './index.html', './manifest.webmanifest', './ikon-192.png', './ikon-512.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(INTI)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  const lokal = url.origin === location.origin;
  const jaringanDulu = lokal && (req.mode === 'navigate' || url.pathname.endsWith('.json') || url.pathname.endsWith('/') || url.pathname.endsWith('.html'));
  if (jaringanDulu) {
    const kunci = url.pathname.endsWith('.json') ? url.origin + url.pathname : req;
    e.respondWith(fetch(req).then(r => {
      if (r.ok) { const s = r.clone(); caches.open(CACHE).then(c => c.put(kunci, s)); }
      return r;
    }).catch(() => caches.match(kunci).then(x => x || caches.match('./index.html'))));
    return;
  }
  e.respondWith(caches.match(req).then(x => x || fetch(req).then(r => {
    if (r.ok || r.type === 'opaque') { const s = r.clone(); caches.open(CACHE).then(c => c.put(req, s)); }
    return r;
  })));
});
