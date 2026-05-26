const CACHE = "folio-v1";

// キャッシュしない（常にネットワーク優先）パターン
const NETWORK_ONLY = ["/api/", "/auth/"];

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

  // API・認証は常にネットワーク
  if (NETWORK_ONLY.some((p) => url.pathname.startsWith(p))) return;

  // 画像は Cache-first（Supabase CDN 画像も含む）
  if (request.destination === "image" || url.hostname.includes("supabase")) {
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

  // その他（JS/CSS/フォント/ページ）は Stale-while-revalidate
  e.respondWith(
    caches.open(CACHE).then((cache) =>
      cache.match(request).then((cached) => {
        const fresh = fetch(request).then((res) => {
          if (res.ok) cache.put(request, res.clone());
          return res;
        });
        return cached ?? fresh;
      })
    )
  );
});
