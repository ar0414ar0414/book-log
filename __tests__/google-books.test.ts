import { describe, it, expect, vi, afterEach } from "vitest";
import { searchGoogleBooks } from "@/lib/google-books/search";

function mockFetch(body: unknown, ok = true) {
  const fn = vi.fn(async (url: string) => {
    void url;
    return { ok, json: async () => body } as unknown as Response;
  });
  vi.stubGlobal("fetch", fn);
  return fn;
}

afterEach(() => vi.unstubAllGlobals());

const item = (volumeInfo: Record<string, unknown>) => ({ volumeInfo });

describe("searchGoogleBooks", () => {
  it("volumeInfo を GoogleBookInfo に変換する", async () => {
    mockFetch({
      items: [
        item({
          title: "吾輩は猫である",
          authors: ["夏目漱石", "X"],
          publisher: "岩波書店",
          publishedDate: "1905",
          description: "説明",
          industryIdentifiers: [{ type: "ISBN_13", identifier: "9784003101018" }],
          imageLinks: { thumbnail: "http://books.google.com/x.jpg" },
          pageCount: 480,
          categories: ["Fiction", "Other"],
        }),
      ],
    });
    const [b] = await searchGoogleBooks("猫");
    expect(b).toEqual({
      title: "吾輩は猫である",
      author: "夏目漱石, X",
      publisher: "岩波書店",
      publishedDate: "1905",
      description: "説明",
      isbn: "9784003101018",
      coverUrl: "https://books.google.com/x.jpg",
      pageCount: 480,
      genre: "Fiction",
    });
  });

  it("表紙URLを https に直す（混在コンテンツで表示できなくなるため）", async () => {
    mockFetch({ items: [item({ imageLinks: { thumbnail: "http://books.google.com/a.jpg" } })] });
    const [b] = await searchGoogleBooks("x");
    expect(b.coverUrl.startsWith("https://")).toBe(true);
  });

  it("ISBN_13 が無ければ ISBN_10 を拾う", async () => {
    mockFetch({
      items: [item({ industryIdentifiers: [{ type: "OTHER", identifier: "zzz" }, { type: "ISBN_10", identifier: "4003101014" }] })],
    });
    expect((await searchGoogleBooks("x"))[0].isbn).toBe("4003101014");
  });

  it("欠けているフィールドは空文字 / null で埋める", async () => {
    mockFetch({ items: [item({})] });
    const [b] = await searchGoogleBooks("x");
    expect(b).toEqual({
      title: "", author: "", publisher: "", publishedDate: "",
      description: "", isbn: "", coverUrl: "", pageCount: null, genre: "",
    });
  });

  it("items が無ければ空配列", async () => {
    mockFetch({ totalItems: 0 });
    expect(await searchGoogleBooks("x")).toEqual([]);
  });

  it("レスポンスが ok でなければ空配列（例外にしない）", async () => {
    mockFetch({}, false);
    expect(await searchGoogleBooks("x")).toEqual([]);
  });

  it("クエリを URL エンコードする", async () => {
    const f = mockFetch({ items: [] });
    await searchGoogleBooks("吾輩は猫 & 犬");
    expect(f.mock.calls[0][0]).toContain(encodeURIComponent("吾輩は猫 & 犬"));
  });
});
