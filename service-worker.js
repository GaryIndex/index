const CACHE_NAME = 'app-cache-v1';
const CACHE_EXPIRY_TIME = 3 * 24 * 60 * 60 * 1000; // 3天（以毫秒为单位）

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll([
        '/',
        '/index.html',
        '/manifest.json',
        '/path/to/your/icon.png',
        '/path/to/your/icon-512.png',
      ]);
    })
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(async (cache) => {
      const lastVisitResponse = await cache.match('/last-visit-time');
      const lastVisitTime = lastVisitResponse
        ? parseInt(await lastVisitResponse.text(), 10)
        : null;

      const currentTime = Date.now();

      if (!lastVisitTime || (currentTime - lastVisitTime) > CACHE_EXPIRY_TIME) {
        console.log('缓存过期，更新缓存...');
        await cache.addAll([
          '/',
          '/index.html',
          '/manifest.json',
          '/path/to/your/icon.png',
          '/path/to/your/icon-512.png',
        ]);
      } else {
        console.log('缓存有效，无需更新');
      }

      // 更新访问时间
      await cache.put(
        '/last-visit-time',
        new Response(currentTime.toString(), { headers: { 'Content-Type': 'text/plain' } })
      );
    })
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      return cachedResponse || fetch(event.request);
    })
  );
});