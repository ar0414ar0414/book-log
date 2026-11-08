// Folio の Service Worker。
// 方針: オンラインの挙動は一切変えない（必ずネットワークを先に見る）。
// ネットワークが死んでいるときだけキャッシュで補う。

const VERSION = "v3";
const PAGES = `folio-pages-${VERSION}`;    // 画面のHTML（network-first）
const STATIC = `folio-static-${VERSION}`;  // /_next/static と同一オリジン画像（不変）
const PHOTOS = `folio-photos-${VERSION}`;  // Supabase の写真
const OFFLINE_URL = "/offline.html";

const KEEP = [PAGES, STATIC, PHOTOS];
const PHOTO_LIMIT = 60; // 1枚1MB近いので上限を設ける

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(STATIC).then((c) => c.add(OFFLINE_URL)));
  self.skipWaiting();
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => !KEEP.includes(k)).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// ログアウト時に呼ばれる。端末に個人データを残さない
self.addEventListener("message", (e) => {
  if (e.data?.type === "CLEAR_CACHES") {
    e.waitUntil(caches.keys().then((keys) => Promise.all(keys.map((k) => caches.delete(k)))));
  }
});

/** 古いものから間引く（Cache API は挿入順を保つ） */
async function trim(cacheName, max) {
  const cache = await caches.open(cacheName);
  const keys = await cache.keys();
  if (keys.length <= max) return;
  await Promise.all(keys.slice(0, keys.length - max).map((k) => cache.delete(k)));
}

async function cacheFirst(request, cacheName, key = request) {
  const cache = await caches.open(cacheName);
  const hit = await cache.match(key);
  if (hit) return hit;
  const res = await fetch(request);
  if (res.ok) cache.put(key, res.clone());
  return res;
}

/**
 * 画面の HTML。常にネットワークを先に見るので、オンラインでの表示は従来どおり。
 * 取れた場合だけ控えを取っておき、オフライン時にそれを出す。
 */
async function pageNetworkFirst(request) {
  const cache = await caches.open(PAGES);
  try {
    // 認証切れのリダイレクトをここで追ってしまうと、
    // respondWith がリダイレクト済みレスポンスを拒否する。
    // manual にしてブラウザ側に追わせる。
    const res = await fetch(new Request(request, { redirect: "manual" }));
    if (res.type === "opaqueredirect" || res.redirected) return res;
    if (res.ok && res.type === "basic") cache.put(request, res.clone());
    return res;
  } catch {
    const hit = await cache.match(request, { ignoreSearch: false });
    if (hit) return hit;
    const offline = await caches.match(OFFLINE_URL);
    return offline ?? Response.error();
  }
}

/**
 * Supabase の写真。署名付き URL は発行のたびにトークンが変わるため、
 * クエリを落としたパスをキーにしないと永遠にキャッシュに当たらない。
 * パスは写真ごとに一意（uuid 入り）なので、中身が入れ替わることはない。
 */
function photoKey(url) {
  return new Request(url.origin + url.pathname, { method: "GET" });
}

self.addEventListener("fetch", (e) => {
  const { request } = e;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  const sameOrigin = url.origin === self.location.origin;

  // Supabase の写真だけは別オリジンでも扱う
  if (!sameOrigin) {
    if (url.hostname.endsWith(".supabase.co") && url.pathname.includes("/storage/v1/object/")) {
      e.respondWith(
        cacheFirst(request, PHOTOS, photoKey(url))
          .then((res) => { e.waitUntil(trim(PHOTOS, PHOTO_LIMIT)); return res; })
          .catch(() => caches.match(photoKey(url)).then((r) => r ?? Response.error()))
      );
    }
    return;
  }

  // API と認証は常にネットワーク。古い結果を見せてはいけない
  if (url.pathname.startsWith("/api/") || url.pathname.startsWith("/auth/")) return;

  // 画面のHTML
  if (request.mode === "navigate") {
    // ログイン画面は端末に残さない
    if (url.pathname.startsWith("/login")) return;
    e.respondWith(pageNetworkFirst(request));
    return;
  }

  // /_next/static はコンテンツハッシュ付きで不変
  if (url.pathname.startsWith("/_next/static/")) {
    e.respondWith(cacheFirst(request, STATIC).catch(() => fetch(request)));
    return;
  }

  // public 配下の画像など
  if (request.destination === "image") {
    e.respondWith(cacheFirst(request, STATIC).catch(() => fetch(request)));
    return;
  }
});
