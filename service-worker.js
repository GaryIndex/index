// 定义缓存名称和缓存过期时间
const CACHE_NAME = 'garyindex-app-v1.1.10'; // 当前缓存名称
const CACHE_EXPIRY_TIME = 3 * 24 * 60 * 60 * 1000; // 缓存有效期：3天（以毫秒计）
const OFFLINE_PAGE = './index.html'; // 离线页面

// 需要预缓存的资源列表
const PRECACHE_URLS = [
  'index.html',      // 主页面
  './manifest.json',   // PWA 配置文件
  './icon.png',        // 图标文件
  './icon-512.png',    // 高分辨率图标
  OFFLINE_PAGE         // 离线页面（兜底）
];

// 安装阶段：缓存指定的资源
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      const now = Date.now(); // 记录当前时间
      return cache.addAll(PRECACHE_URLS).then(() => {
        // 将当前时间存储为缓存时间戳
        cache.put('./cache-time', new Response(JSON.stringify({ timestamp: now })));
      });
    })
  );
  self.skipWaiting(); // 安装完成后立即激活新的 Service Worker
});

// 激活阶段：清理旧缓存
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            // 如果缓存名称不匹配，清理该缓存
            console.log('[Service Worker] 清理旧缓存:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim(); // 确保新的 Service Worker 控制所有页面
});

// 检查缓存是否过期
async function isCacheExpired() {
  const cache = await caches.open(CACHE_NAME);
  const response = await cache.match('./cache-time'); // 获取缓存时间戳
  if (!response) return true; // 如果没有时间戳，视为过期
  const { timestamp } = await response.json();
  const now = Date.now();
  return now - timestamp > CACHE_EXPIRY_TIME; // 判断缓存是否超过有效期
}

// 更新缓存并刷新时间戳
function fetchAndUpdateCache(request) {
  return fetch(request).then((response) => {
    if (response.ok) {
      // 如果网络请求成功，更新缓存
      caches.open(CACHE_NAME).then((cache) => {
        cache.put(request, response.clone()); // 缓存最新资源
        cache.put('./cache-time', new Response(JSON.stringify({ timestamp: Date.now() }))); // 更新时间戳
      });
    }
    return response; // 返回最新的网络资源
  });
}

// 拦截所有请求
self.addEventListener('fetch', (event) => {
  const { request } = event;

  // 对静态资源（HTML、JS、CSS）使用缓存优先策略
  if (PRECACHE_URLS.includes(new URL(request.url).pathname)) {
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        if (cachedResponse) {
          // 如果缓存存在，异步检查是否过期
          isCacheExpired().then((expired) => {
            if (expired) fetchAndUpdateCache(request); // 如果过期，后台更新缓存
          });
          return cachedResponse; // 直接返回缓存内容
        }
        // 如果缓存中没有，尝试从网络获取
        return fetchAndUpdateCache(request).catch(() => {
          return caches.match(OFFLINE_PAGE); // 如果网络失败，返回离线页面
        });
      })
    );
  } else {
    // 对其他动态资源（如图片、API 请求）使用网络优先策略
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.ok) {
            // 如果网络请求成功，更新缓存
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, response.clone());
            });
          }
          return response; // 返回网络资源
        })
        .catch(() => {
          // 如果网络请求失败，尝试返回缓存内容
          return caches.match(request).then((cachedResponse) => {
            if (cachedResponse) return cachedResponse; // 返回缓存内容
            return caches.match(OFFLINE_PAGE); // 如果缓存中没有，返回离线页面
          });
        })
    );
  }
});