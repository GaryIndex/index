const CACHE_NAME = 'app-cache';
const CACHE_VERSION = 1;  // 缓存版本
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
    // 获取上次访问时间
    caches.open(CACHE_NAME).then((cache) => {
      return cache.match('/').then((response) => {
        const lastVisitTime = localStorage.getItem('lastVisitTime');
        const currentTime = new Date().getTime();
        
        if (!lastVisitTime || (currentTime - lastVisitTime) > CACHE_EXPIRY_TIME) {
          // 如果没有存储过访问时间或超过了三天，就更新缓存
          console.log('缓存过期，更新缓存...');
          return updateCache(cache);
        } else {
          console.log('缓存有效，使用旧缓存');
          return response;  // 使用旧缓存
        }
      });
    })
  );
});

// 更新缓存函数
function updateCache(cache) {
  return cache.addAll([
    '/',
    '/index.html',
    '/manifest.json',
    '/path/to/your/icon.png',
    '/path/to/your/icon-512.png',
  ]);
}

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      return cachedResponse || fetch(event.request);  // 优先使用缓存，如果没有则发起网络请求
    })
  );
});