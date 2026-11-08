import { describe, it, expect, beforeEach, vi } from "vitest";
import { readFileSync } from "node:fs";
import vm from "node:vm";

/**
 * public/sw.js は bundler を通らない素の静的ファイルで、ブラウザでしか動かない。
 * ここでは実ファイルを読み込んで偽の self / caches / fetch の上で動かし、
 * どのリクエストがどの戦略に流れるかを検証する。
 */

const ORIGIN = "https://folio.example";
const SW_SOURCE = readFileSync("public/sw.js", "utf8");

class FakeCache {
  store = new Map<string, Response>();
  async match(req: Request | string) {
    return this.store.get(typeof req === "string" ? req : req.url);
  }
  async put(req: Request | string, res: Response) {
    this.store.set(typeof req === "string" ? req : req.url, res);
  }
  async add(url: string) {
    this.store.set(new URL(url, ORIGIN).toString(), new Response("offline page"));
  }
  async keys() {
    return [...this.store.keys()].map((u) => new Request(u));
  }
  async delete(req: Request | string) {
    return this.store.delete(typeof req === "string" ? req : req.url);
  }
}

function makeEnv(fetchImpl: (r: Request) => Promise<Response>) {
  const cacheStorage = new Map<string, FakeCache>();
  const handlers: Record<string, ((e: never) => void)[]> = {};
  const caches = {
    async open(name: string) {
      if (!cacheStorage.has(name)) cacheStorage.set(name, new FakeCache());
      return cacheStorage.get(name)!;
    },
    async keys() { return [...cacheStorage.keys()]; },
    async delete(name: string) { return cacheStorage.delete(name); },
    async match(url: string) {
      for (const c of cacheStorage.values()) {
        const hit = await c.match(new URL(url, ORIGIN).toString());
        if (hit) return hit;
      }
      return undefined;
    },
  };
  const self = {
    location: { origin: ORIGIN },
    addEventListener(type: string, fn: (e: never) => void) {
      (handlers[type] ??= []).push(fn);
    },
    skipWaiting: vi.fn(),
    clients: { claim: vi.fn() },
  };
  const ctx: Record<string, unknown> = {
    self, caches, fetch: fetchImpl, Request, Response, URL, Promise, console,
  };
  ctx.globalThis = ctx;
  vm.createContext(ctx);
  vm.runInContext(SW_SOURCE, ctx);
  return { handlers, caches, cacheStorage, self };
}

/** fetch イベントを1件流し、respondWith に渡された結果を返す（未処理なら null） */
async function dispatchFetch(
  env: ReturnType<typeof makeEnv>,
  url: string,
  init: { method?: string; mode?: string; destination?: string } = {}
) {
  // 配列で受ける。let に代入すると TS がコールバック内の代入を追えず
  // null に絞り込んでしまうため
  const responded: Promise<Response>[] = [];
  const waits: Promise<unknown>[] = [];
  // mode / destination はプロトタイプ上の getter なので、
  // 自前のプロパティで覆って差し替える
  const request = new Request(url, { method: init.method ?? "GET" });
  Object.defineProperties(request, {
    mode: { value: init.mode ?? "no-cors", configurable: true },
    destination: { value: init.destination ?? "", configurable: true },
  });
  const event = {
    request,
    respondWith: (p: Promise<Response>) => { responded.push(p); },
    waitUntil: (p: Promise<unknown>) => { waits.push(p); },
  };
  for (const h of env.handlers.fetch ?? []) (h as (e: unknown) => void)(event);
  const result = responded.length > 0 ? await responded[0] : null;
  await Promise.allSettled(waits);
  return result;
}

/**
 * ブラウザでは同一オリジンの応答は type === "basic" になる。
 * 合成した Response は "default" なので、実挙動に合わせて被せる。
 */
const netOk = (body = "from network", type = "basic") => async () => {
  const res = new Response(body, { status: 200 });
  Object.defineProperty(res, "type", { value: type, configurable: true });
  return res;
};
const netFail = () => async () => { throw new TypeError("offline"); };

describe("Service Worker のルーティング", () => {
  let env: ReturnType<typeof makeEnv>;
  beforeEach(() => { env = makeEnv(netOk()); });

  it("GET 以外は一切介入しない", async () => {
    expect(await dispatchFetch(env, `${ORIGIN}/dashboard`, { method: "POST", mode: "navigate" })).toBeNull();
  });

  it("API は常にネットワーク（古い結果を見せない）", async () => {
    expect(await dispatchFetch(env, `${ORIGIN}/api/quotes`)).toBeNull();
  });

  it("認証コールバックは介入しない", async () => {
    expect(await dispatchFetch(env, `${ORIGIN}/auth/callback?code=x`, { mode: "navigate" })).toBeNull();
  });

  it("ログイン画面は端末に残さない", async () => {
    expect(await dispatchFetch(env, `${ORIGIN}/login`, { mode: "navigate" })).toBeNull();
  });

  it("関係のない別オリジンには触らない", async () => {
    expect(await dispatchFetch(env, "https://example.com/x.js")).toBeNull();
  });
});

describe("画面のHTML（network-first）", () => {
  it("オンラインではネットワークの内容を返す", async () => {
    const env = makeEnv(netOk("fresh"));
    const res = await dispatchFetch(env, `${ORIGIN}/dashboard`, { mode: "navigate" });
    expect(await res!.text()).toBe("fresh");
  });

  it("成功した画面は控えを取る", async () => {
    const env = makeEnv(netOk("fresh"));
    await dispatchFetch(env, `${ORIGIN}/dashboard`, { mode: "navigate" });
    const pages = [...env.cacheStorage.entries()].find(([k]) => k.includes("pages"))![1];
    expect(await pages.match(`${ORIGIN}/dashboard`)).toBeTruthy();
  });

  it("オフラインでは控えを出す", async () => {
    const env = makeEnv(netOk("saved"));
    await dispatchFetch(env, `${ORIGIN}/books`, { mode: "navigate" });

    const offlineEnv = { ...env, handlers: env.handlers };
    // 2回目はネットワークを落とす
    const ctxFetchFail = makeEnv(netFail());
    // 同じキャッシュを引き継ぐ
    for (const [k, v] of env.cacheStorage) ctxFetchFail.cacheStorage.set(k, v);
    const res = await dispatchFetch(ctxFetchFail, `${ORIGIN}/books`, { mode: "navigate" });
    expect(await res!.text()).toBe("saved");
    expect(offlineEnv).toBeTruthy();
  });

  it("控えが無いページはオフライン画面を出す", async () => {
    const env = makeEnv(netFail());
    // install でオフライン画面が入る
    for (const h of env.handlers.install ?? []) (h as (e: unknown) => void)({ waitUntil: (p: Promise<unknown>) => p });
    await new Promise((r) => setTimeout(r, 0));
    const res = await dispatchFetch(env, `${ORIGIN}/stats`, { mode: "navigate" });
    expect(await res!.text()).toBe("offline page");
  });
});

describe("静的アセット（cache-first）", () => {
  it("/_next/static は2回目以降キャッシュから返す", async () => {
    let calls = 0;
    const env = makeEnv(async () => { calls++; return new Response("chunk"); });
    const url = `${ORIGIN}/_next/static/chunks/abc.js`;
    await dispatchFetch(env, url);
    await dispatchFetch(env, url);
    expect(calls).toBe(1);
  });

  it("同一オリジンの画像もキャッシュする", async () => {
    let calls = 0;
    const env = makeEnv(async () => { calls++; return new Response("png"); });
    const url = `${ORIGIN}/icons/icon-192.png`;
    await dispatchFetch(env, url, { destination: "image" });
    await dispatchFetch(env, url, { destination: "image" });
    expect(calls).toBe(1);
  });
});

describe("Supabase の写真", () => {
  const PHOTO = "https://abc.supabase.co/storage/v1/object/sign/book-photos/u/b/p.jpg";

  it("署名トークンが変わっても同じ写真はキャッシュに当たる", async () => {
    let calls = 0;
    const env = makeEnv(async () => { calls++; return new Response("jpeg"); });
    await dispatchFetch(env, `${PHOTO}?token=AAA`);
    await dispatchFetch(env, `${PHOTO}?token=BBB-ちがうトークン`);
    expect(calls).toBe(1); // 2回目はキャッシュ
  });

  it("キャッシュのキーからトークンが除かれている", async () => {
    const env = makeEnv(netOk("jpeg"));
    await dispatchFetch(env, `${PHOTO}?token=SECRET`);
    const photos = [...env.cacheStorage.entries()].find(([k]) => k.includes("photos"))![1];
    const keys = (await photos.keys()).map((k) => k.url);
    expect(keys).toEqual([PHOTO]);
    expect(keys.join()).not.toContain("SECRET");
  });

  it("オフラインでも保存済みの写真を出す", async () => {
    const env = makeEnv(netOk("jpeg"));
    await dispatchFetch(env, `${PHOTO}?token=AAA`);
    const offline = makeEnv(netFail());
    for (const [k, v] of env.cacheStorage) offline.cacheStorage.set(k, v);
    const res = await dispatchFetch(offline, `${PHOTO}?token=CCC`);
    expect(await res!.text()).toBe("jpeg");
  });

  it("Supabase 以外の別オリジン画像には触らない", async () => {
    const env = makeEnv(netOk());
    expect(await dispatchFetch(env, "https://books.google.com/cover.jpg", { destination: "image" })).toBeNull();
  });
});

describe("ログアウト時のキャッシュ削除", () => {
  it("CLEAR_CACHES ですべて消える", async () => {
    const env = makeEnv(netOk("x"));
    await dispatchFetch(env, `${ORIGIN}/dashboard`, { mode: "navigate" });
    expect(await env.caches.keys()).not.toHaveLength(0);

    const waits: Promise<unknown>[] = [];
    for (const h of env.handlers.message ?? []) {
      (h as (e: unknown) => void)({
        data: { type: "CLEAR_CACHES" },
        waitUntil: (p: Promise<unknown>) => waits.push(p),
      });
    }
    await Promise.all(waits);
    expect(await env.caches.keys()).toHaveLength(0);
  });
});
