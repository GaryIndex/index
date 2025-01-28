const CACHE_NAME = 'garyindex-app-v1.1.10';
const PRECACHE_URLS = [
  './index.html',      // 主页面
  './manifest.json',   // PWA 配置文件
  './service-worker.js', // 当前 Service Worker 文件
  './github.svg',      // 图标文件
];

// 安装阶段：缓存所有指定的文件
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PRECACHE_URLS);
    })
  );
  self.skipWaiting(); // 立即激活新的 Service Worker
});

// 激活阶段：清理旧的缓存
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName); // 删除旧缓存
          }
        })
      );
    })
  );
  self.clients.claim(); // 确保新的 Service Worker 控制页面
});

// 拦截所有请求并返回缓存内容
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        // 如果缓存命中，直接返回
        return cachedResponse;
      }

      // 如果缓存未命中，尝试从网络加载并缓存
      return fetch(event.request).then((networkResponse) => {
        return caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, networkResponse.clone());
          return networkResponse;
        });
      }).catch(() => {
        // 如果网络请求失败，返回离线页面（如 index.html）
        if (event.request.mode === 'navigate') {
          return caches.match('./index.html');
        }
      });
    })
  );
});