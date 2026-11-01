import { describe, it, expect } from "vitest";
import { sortBooks } from "@/components/books/BooksShelf";
import type { BookListItem } from "@/types";

function book(p: Partial<BookListItem>): BookListItem {
  return {
    id: p.title ?? "x", title: "本", author: null, coverUrl: null, genre: null,
    status: "done", rating: null, startedAt: null, finishedAt: null,
    currentPage: null, pageCount: null,
    createdAt: new Date("2026-01-01"), updatedAt: new Date("2026-01-01"),
    ...p,
  } as BookListItem;
}

const titles = (bs: BookListItem[]) => bs.map((b) => b.title);

describe("sortBooks", () => {
  const a = book({ title: "あ", createdAt: new Date("2026-01-01"), rating: 3, finishedAt: new Date("2026-05-01") });
  const b = book({ title: "い", createdAt: new Date("2026-03-01"), rating: 5, finishedAt: null });
  const c = book({ title: "う", createdAt: new Date("2026-02-01"), rating: null, finishedAt: new Date("2026-06-01") });
  const books = [a, b, c];

  it("登録が新しい順", () => {
    expect(titles(sortBooks(books, "createdAt_desc"))).toEqual(["い", "う", "あ"]);
  });

  it("登録が古い順", () => {
    expect(titles(sortBooks(books, "createdAt_asc"))).toEqual(["あ", "う", "い"]);
  });

  it("タイトル順は日本語ロケールで並べる", () => {
    expect(titles(sortBooks(books, "title_asc"))).toEqual(["あ", "い", "う"]);
  });

  it("評価が高い順。未評価は 0 として最後", () => {
    expect(titles(sortBooks(books, "rating_desc"))).toEqual(["い", "あ", "う"]);
  });

  it("読了が新しい順。未読了は最後", () => {
    expect(titles(sortBooks(books, "finishedAt_desc"))).toEqual(["う", "あ", "い"]);
  });

  it("元の配列を破壊しない", () => {
    const before = titles(books);
    sortBooks(books, "title_asc");
    expect(titles(books)).toEqual(before);
  });

  it("空配列でも落ちない", () => {
    expect(sortBooks([], "createdAt_desc")).toEqual([]);
  });
});
