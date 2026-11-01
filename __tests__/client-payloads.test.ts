import { describe, it, expect } from "vitest";
import {
  bookCreateSchema, bookUpdateSchema, quoteCreateSchema, quoteUpdateSchema,
  tagCreateSchema, quoteTagSchema, photoUpdateSchema,
  aiChatSchema, aiBookSchema, aiOcrSchema,
} from "@/lib/validation";

/**
 * 検証を厳しくしすぎてアプリが壊れていないかを見張るテスト。
 * 各コンポーネントが実際に送っている body の形をそのまま流す。
 * クライアント側の送信内容を変えたら、ここも併せて更新すること。
 */

const UUID = "123e4567-e89b-42d3-a456-426614174000";
const ok = (schema: { safeParse: (v: unknown) => { success: boolean; error?: unknown } }, v: unknown) => {
  const r = schema.safeParse(v);
  if (!r.success) expect.fail(JSON.stringify(r.error, null, 2));
};

describe("BookForm → POST /api/books", () => {
  it("フォーム初期値のまま（空文字だらけ）でもタイトルさえあれば通る", () => {
    ok(bookCreateSchema, {
      title: "本", author: "", isbn: "", coverUrl: "", publisher: "",
      publishedDate: "", genre: "", description: "", status: "want",
      rating: 0, memo: "", pageCount: null, startedAt: null, finishedAt: null,
    });
  });

  it("Google Books から埋めた形でも通る", () => {
    ok(bookCreateSchema, {
      title: "吾輩は猫である", author: "夏目漱石", isbn: "9784003101018",
      coverUrl: "https://books.google.com/x.jpg", publisher: "岩波書店",
      publishedDate: "1905", genre: "Fiction", description: "説明",
      status: "reading", rating: 0, memo: "", pageCount: 480,
      startedAt: "2026-01-01", finishedAt: null,
    });
  });
});

describe("BookDetail / ReadingBooksWidget → PATCH /api/books/[id]", () => {
  it.each([
    ["読書ページ更新", { currentPage: 120 }],
    ["総ページ更新", { pageCount: 480 }],
    ["評価", { rating: 4 }],
    ["評価解除", { rating: null }],
    ["メモ", { memo: "面白かった" }],
    ["メモ削除", { memo: null }],
    ["ステータス", { status: "done" }],
    ["読前メモ", { preMemo: "期待" }],
    ["読後メモ", { postMemo: null }],
  ])("%s", (_label, payload) => {
    ok(bookUpdateSchema, payload);
  });
});

describe("QuotesTab → /api/quotes", () => {
  it("新規作成", () => {
    ok(quoteCreateSchema, {
      bookId: UUID, text: "引用文", pageNumber: 42, chapter: null, memo: null,
    });
  });

  it("ページ番号が空欄のとき null で送られる", () => {
    ok(quoteCreateSchema, { bookId: UUID, text: "引用文", pageNumber: null, chapter: null, memo: null });
  });

  it("編集", () => {
    ok(quoteUpdateSchema, { text: "直した", pageNumber: 10, chapter: "第1章", memo: "note" });
  });

  it("お気に入り切り替え", () => {
    ok(quoteUpdateSchema, { isFavorite: true });
  });
});

describe("タグ", () => {
  it("UI のカラーパレットは全色が通る", () => {
    for (const color of ["#6366f1", "#8b5cf6", "#3b82f6", "#06b6d4", "#10b981", "#f59e0b", "#ef4444", "#ec4899"]) {
      ok(tagCreateSchema, { name: "タグ", color });
    }
  });

  it("引用へのタグ付与", () => {
    ok(quoteTagSchema, { tagId: UUID });
  });
});

describe("写真", () => {
  it("キャプション保存", () => {
    ok(photoUpdateSchema, { caption: "メモ" });
    ok(photoUpdateSchema, { caption: null });
  });
});

describe("AI", () => {
  it("チャット送信", () => {
    for (const provider of ["gemini", "claude"]) {
      ok(aiChatSchema, { bookId: UUID, message: "この本について教えて", provider });
    }
  });

  it("要約 / 読書記録", () => {
    ok(aiBookSchema, { bookId: UUID, provider: "claude" });
  });

  it("OCR（PhotosTab は photoId あり、QuotesTab は無し）", () => {
    ok(aiOcrSchema, { photoId: UUID, imageBase64: "AAAA", mimeType: "image/jpeg", provider: "gemini" });
    ok(aiOcrSchema, { imageBase64: "AAAA", mimeType: "image/png", provider: "claude" });
  });
});
