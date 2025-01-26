const CACHE_NAME = 'app-cache-v1';
const CACHE_EXPIRY_TIME = 3 * 24 * 60 * 60 * 1000; // 3天（毫秒）
const OFFLINE_PAGE = './index.html'; // 离线时加载的页面

const PRECACHE_URLS = [
  './index.html',
  './manifest.json',
  './icon.png',
  './icon-512.png',
  OFFLINE_PAGE // 确保离线页面也缓存
];

// 安装事件：缓存必要的文件
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      const now = Date.now();  // 获取当前时间戳
      return cache.addAll(PRECACHE_URLS).then(() => {
        // 缓存时记录时间戳
        cache.put('./cache-time', new Response(JSON.stringify({ timestamp: now })));
      });
    })
  );
  self.skipWaiting(); // 立即激活
});

// 激活事件：清理旧缓存
self.addEventListener('activate', (event) => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (!cacheWhitelist.includes(cacheName)) {
            return caches.delete(cacheName); // 清理旧缓存
          }
        })
      );
    })
  );
  self.clients.claim(); // 控制所有页面
});

// 拦截网络请求
self.addEventListener('fetch', (event) => {
  // 对静态资源采用缓存优先策略
  if (event.request.url.endsWith('.html') || event.request.url.endsWith('.js') || event.request.url.endsWith('.css')) {
    event.respondWith(
      caches.match(event.request).then((cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse; // 缓存优先
        }
        return fetch(event.request).then((networkResponse) => {
          return caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, networkResponse.clone()); // 更新缓存
            return networkResponse;
          });
        });
      })
    );
  } else {
    // 对其他资源（如图片、API 请求）采用网络优先策略
    event.respondWith(
      fetch(event.request).then((networkResponse) => {
        return caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, networkResponse.clone()); // 更新缓存
          return networkResponse;
        });
      }).catch(() => {
        // 如果网络请求失败，先检查缓存
        return caches.match(event.request).then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse; // 返回缓存
          }

          // 如果缓存中没有，返回离线页面
          return caches.match(OFFLINE_PAGE);
        });
      })
    );
  }
});

// 更新缓存并后台刷新
function fetchAndUpdateCache(request, cache) {
  return fetch(request).then((networkResponse) => {
    if (networkResponse.ok) {
      // 在后台更新缓存
      caches.open(CACHE_NAME).then((cache) => {
        cache.put(request, networkResponse.clone());
        // 更新缓存时间戳
        cache.put('./cache-time', new Response(JSON.stringify({ timestamp: Date.now() })));
      });
    }
    return networkResponse;
  }).catch(() => {
    return caches.match(OFFLINE_PAGE);
  });
}