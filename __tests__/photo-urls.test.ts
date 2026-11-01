import { describe, it, expect, vi } from "vitest";
import { withSignedUrls, PHOTO_BUCKET, PHOTO_URL_TTL_SECONDS } from "@/lib/supabase/photo-urls";

type Row = { id: string; storagePath: string };

function fakeSupabase(impl: (paths: string[], expiresIn: number) => unknown) {
  const createSignedUrls = vi.fn(async (paths: string[], expiresIn: number) => impl(paths, expiresIn));
  const from = vi.fn(() => ({ createSignedUrls }));
  // 本物のクライアントは storage 以外も持つが、この関数が触るのは storage.from だけ
  return { client: { storage: { from } } as never, from, createSignedUrls };
}

const rows: Row[] = [
  { id: "1", storagePath: "u/b/a.jpg" },
  { id: "2", storagePath: "u/b/c.jpg" },
];

describe("withSignedUrls", () => {
  it("storagePath に対応する署名付き URL を各行に付ける", async () => {
    const sb = fakeSupabase((paths) => ({
      data: paths.map((p) => ({ path: p, signedUrl: `https://signed/${p}` })),
      error: null,
    }));
    const out = await withSignedUrls(sb.client, rows);
    expect(out).toEqual([
      { id: "1", storagePath: "u/b/a.jpg", url: "https://signed/u/b/a.jpg" },
      { id: "2", storagePath: "u/b/c.jpg", url: "https://signed/u/b/c.jpg" },
    ]);
  });

  it("返却順が入れ替わっても path で突き合わせる", async () => {
    const sb = fakeSupabase((paths) => ({
      data: [...paths].reverse().map((p) => ({ path: p, signedUrl: `https://signed/${p}` })),
      error: null,
    }));
    const out = await withSignedUrls(sb.client, rows);
    expect(out[0].url).toBe("https://signed/u/b/a.jpg");
    expect(out[1].url).toBe("https://signed/u/b/c.jpg");
  });

  it("署名できなかった行は url が空文字になる（行は落とさない）", async () => {
    const sb = fakeSupabase((paths) => ({
      data: [{ path: paths[0], signedUrl: `https://signed/${paths[0]}` }, { path: paths[1], signedUrl: null }],
      error: null,
    }));
    const out = await withSignedUrls(sb.client, rows);
    expect(out).toHaveLength(2);
    expect(out[1].url).toBe("");
  });

  it("空配列のときは API を呼ばない", async () => {
    const sb = fakeSupabase(() => ({ data: [], error: null }));
    expect(await withSignedUrls(sb.client, [])).toEqual([]);
    expect(sb.from).not.toHaveBeenCalled();
  });

  it("正しいバケットと既定の有効期限で呼ぶ", async () => {
    const sb = fakeSupabase((paths) => ({
      data: paths.map((p) => ({ path: p, signedUrl: "x" })),
      error: null,
    }));
    await withSignedUrls(sb.client, rows);
    expect(sb.from).toHaveBeenCalledWith(PHOTO_BUCKET);
    expect(sb.createSignedUrls).toHaveBeenCalledWith(
      ["u/b/a.jpg", "u/b/c.jpg"],
      PHOTO_URL_TTL_SECONDS
    );
  });

  it("有効期限を指定できる", async () => {
    const sb = fakeSupabase((paths) => ({
      data: paths.map((p) => ({ path: p, signedUrl: "x" })),
      error: null,
    }));
    await withSignedUrls(sb.client, rows, 60);
    expect(sb.createSignedUrls).toHaveBeenCalledWith(expect.anything(), 60);
  });

  it("エラーは握りつぶさず投げる", async () => {
    const sb = fakeSupabase(() => ({ data: null, error: new Error("storage down") }));
    await expect(withSignedUrls(sb.client, rows)).rejects.toThrow("storage down");
  });

  it("公開URLを保持しない（署名のみを返す）", async () => {
    const sb = fakeSupabase((paths) => ({
      data: paths.map((p) => ({ path: p, signedUrl: `https://x/object/sign/${p}?token=t` })),
      error: null,
    }));
    const out = await withSignedUrls(sb.client, rows);
    expect(out.every((r) => r.url.includes("/object/sign/"))).toBe(true);
    expect(out.some((r) => r.url.includes("/object/public/"))).toBe(false);
  });
});
