const CACHE_NAME = 'app-cache-v1';
const CACHE_EXPIRY_TIME = 3 * 24 * 60 * 60 * 1000; // 3天（以毫秒为单位）

// 安装阶段：缓存资源
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll([
        '/',
        '/index.html',
        '/manifest.json',
        '/icon-192.png',
        '/icon-512.png'
      ]);
    })
  );
});

// 激活阶段：清理旧缓存
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('清理旧缓存:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// 捕获 fetch 请求
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      // 如果缓存中有资源则返回，否则发起网络请求
      return cachedResponse || fetch(event.request);
    })
  );
});