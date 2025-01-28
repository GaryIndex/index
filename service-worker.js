const CACHE_NAME = 'garyindex-app-v1.1.10'; // 缓存名称
const PRECACHE_URLS = [
  './index.html',       // 主页面
  './manifest.json',    // PWA 配置文件
  './service-worker.js',// Service Worker 文件
  './github.svg',       // GitHub 图标
];

// 安装阶段：缓存所有静态资源
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PRECACHE_URLS); // 缓存资源
    })
  );
  self.skipWaiting(); // 安装完成后立即激活
});

// 激活阶段：清理旧缓存
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) =>
      Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName); // 删除旧缓存
          }
        })
      )
    )
  );
  self.clients.claim(); // 确保当前页面受控制
});

// 拦截所有请求：始终使用缓存
self.addEventListener('fetch', (event) => {
  const { request } = event;

  // 只处理 GET 请求
  if (request.method !== 'GET') return;

  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      // 如果有缓存，直接返回
      if (cachedResponse) {
        return cachedResponse;
      }

      // 如果没有缓存，尝试从网络获取并缓存
      return fetch(request)
        .then((networkResponse) => {
          return caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, networkResponse.clone()); // 更新缓存
            return networkResponse;
          });
        })
        .catch(() => {
          // 如果网络失败，返回主页面（兜底）
          if (request.headers.get('accept').includes('text/html')) {
            return caches.match('./index.html');
          }
        });
    })
  );
});