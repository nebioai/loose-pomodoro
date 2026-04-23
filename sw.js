// Loose Pomodoro - Service Worker
// キャッシュのバージョン（更新時はこの数字を上げる）
const CACHE_VERSION = 'loose-pomodoro-v3';

// キャッシュするファイル
const CACHE_FILES = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
];

// インストール時: ファイルをキャッシュに登録
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_VERSION).then((cache) => {
      return cache.addAll(CACHE_FILES).catch((err) => {
        console.warn('Cache add failed:', err);
      });
    })
  );
  self.skipWaiting();
});

// 有効化時: 古いキャッシュを削除
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((k) => k !== CACHE_VERSION).map((k) => caches.delete(k))
      );
    })
  );
  self.clients.claim();
});

// フェッチ: キャッシュ優先、無ければネットワーク
self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached;
      return fetch(request)
        .then((response) => {
          // 成功レスポンスはキャッシュに追加
          if (response && response.status === 200 && response.type === 'basic') {
            const copy = response.clone();
            caches.open(CACHE_VERSION).then((cache) => cache.put(request, copy));
          }
          return response;
        })
        .catch(() => {
          // オフライン時、index.htmlで代替
          if (request.mode === 'navigate') {
            return caches.match('./index.html');
          }
        });
    })
  );
});
