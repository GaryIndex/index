const CACHE_NAME = 'app-cache-v1';
const CACHE_EXPIRY_TIME = 3 * 24 * 60 * 60 * 1000; // 3天（毫秒）
const OFFLINE_PAGE = './index.html'; // 离线时加载的页面

// 安装事件：缓存必要的文件
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll([
        './index.html',      // 缓存主页面
        './manifest.json',   // 缓存 manifest 文件
        './icon.png',        // 缓存图标
        './icon-512.png'     // 缓存高分辨率图标
      ]);
    })
  );
  self.skipWaiting(); // 立即激活
});

// 激活事件：清理过期的缓存
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
  self.clients.claim(); // 控制所有页面
});

// 拦截网络请求
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      // 优先返回缓存内容
      if (cachedResponse) {
        return cachedResponse;
      }
      // 如果缓存没有，尝试从网络获取
      return fetch(event.request).catch(() => {
        // 如果网络请求失败，返回离线页面
        if (event.request.mode === 'navigate') {
          return caches.match(OFFLINE_PAGE);
        }
      });
    })
  );
});