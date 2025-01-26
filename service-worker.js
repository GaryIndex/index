const CACHE_NAME = 'app-cache-v1';
const CACHE_FILES = [
  '/',
  '/index.html',
  '/manifest.json',
  '/path/to/your/icon.png',
  '/path/to/your/icon-512.png',
];
  
self.addEventListener('install', (event) => {
  // 在安装阶段完成缓存
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('开始缓存文件...');
      return cache.addAll(CACHE_FILES);
    }).then(() => {
      console.log('缓存成功，跳过等待...');
      self.skipWaiting(); // 立即激活新的 Service Worker
    }).catch((err) => {
      console.error('缓存失败:', err);
    })
  );
});

self.addEventListener('activate', (event) => {
  console.log('Service Worker 激活');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            console.log('清理旧缓存:', cache);
            return caches.delete(cache);
          }
        })
      );
    })
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      // 优先使用缓存，若没有则发起网络请求
      return cachedResponse || fetch(event.request);
    })
  );
});