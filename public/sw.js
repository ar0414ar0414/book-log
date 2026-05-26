const CACHE = "folio-v2";

self.addEventListener("install", (e) => {
  self.skipWaiting();
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (e) => {
  const { request } = e;
  const url = new URL(request.url);

  // 別オリジン・非GETは素通し
  if (url.origin !== self.location.origin || request.method !== "GET") return;

  // ページナビゲーション（HTMLドキュメント）は常にネットワーク
  // → キャッシュするとアップロード・削除後に古いデータが表示されてしまう
  if (request.mode === "navigate") return;

  // API・認証は常にネットワーク
  if (url.pathname.startsWith("/api/") || url.pathname.startsWith("/auth/")) return;

  // Next.js の静的アセット（/_next/static/ 以下はコンテンツハッシュ付きで不変）
  // → 長期間 Cache-first で問題なし
  if (url.pathname.startsWith("/_next/static/")) {
    e.respondWith(
      caches.open(CACHE).then((cache) =>
        cache.match(request).then(
          (cached) =>
            cached ??
            fetch(request).then((res) => {
              if (res.ok) cache.put(request, res.clone());
              return res;
            })
        )
      )
    );
    return;
  }

  // 同一オリジンの画像アセット（publicフォルダ等）は Cache-first
  if (request.destination === "image") {
    e.respondWith(
      caches.open(CACHE).then((cache) =>
        cache.match(request).then(
          (cached) =>
            cached ??
            fetch(request).then((res) => {
              if (res.ok) cache.put(request, res.clone());
              return res;
            })
        )
      )
    );
    return;
  }

  // その他（フォント・マニフェスト等）は素通し（キャッシュしない）
});
