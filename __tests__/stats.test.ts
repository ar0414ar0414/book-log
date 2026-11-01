import { describe, it, expect } from "vitest";
import { computeStats, availableYears, doneDate } from "@/lib/stats";
import type { BookListItem } from "@/types";

function book(p: Partial<BookListItem> = {}): BookListItem {
  return {
    id: Math.random().toString(36).slice(2),
    title: "本",
    author: null,
    coverUrl: null,
    genre: null,
    status: "done",
    rating: null,
    startedAt: null,
    finishedAt: null,
    currentPage: null,
    pageCount: null,
    createdAt: new Date("2026-01-01"),
    updatedAt: new Date("2026-01-01"),
    ...p,
  } as BookListItem;
}

const NOW = new Date("2026-07-15T00:00:00Z"); // 7月 = 経過7ヶ月

describe("doneDate", () => {
  it("finishedAt があればそれを使う", () => {
    const b = book({ finishedAt: new Date("2026-05-01"), updatedAt: new Date("2026-06-01") });
    expect(doneDate(b).getFullYear()).toBe(2026);
    expect(doneDate(b).getMonth()).toBe(4);
  });

  it("finishedAt が無ければ updatedAt で代用する", () => {
    const b = book({ finishedAt: null, updatedAt: new Date("2026-06-20") });
    expect(doneDate(b).getMonth()).toBe(5);
  });
});

describe("availableYears", () => {
  it("今年と読了年を降順で返す", () => {
    const books = [
      book({ finishedAt: new Date("2024-02-01") }),
      book({ finishedAt: new Date("2025-02-01") }),
    ];
    expect(availableYears(books, NOW)).toEqual([2026, 2025, 2024]);
  });

  it("本が無くても今年だけは含む", () => {
    expect(availableYears([], NOW)).toEqual([2026]);
  });

  it("読了していない本の年は含めない", () => {
    const books = [book({ status: "reading", updatedAt: new Date("2020-01-01") })];
    expect(availableYears(books, NOW)).toEqual([2026]);
  });
});

describe("computeStats", () => {
  it("指定年に読了した本だけを集計する", () => {
    const books = [
      book({ finishedAt: new Date("2026-02-01"), pageCount: 100 }),
      book({ finishedAt: new Date("2025-02-01"), pageCount: 999 }),
      book({ status: "reading", pageCount: 500 }),
    ];
    const s = computeStats(books, 2026, NOW);
    expect(s.doneThisYear).toHaveLength(1);
    expect(s.totalPages).toBe(100);
  });

  it("評価の平均は評価済みの本だけで割る", () => {
    const books = [
      book({ finishedAt: new Date("2026-02-01"), rating: 5 }),
      book({ finishedAt: new Date("2026-03-01"), rating: 3 }),
      book({ finishedAt: new Date("2026-04-01"), rating: null }),
    ];
    expect(computeStats(books, 2026, NOW).avgRating).toBe(4);
  });

  it("評価が無ければ平均は 0", () => {
    const s = computeStats([book({ finishedAt: new Date("2026-02-01") })], 2026, NOW);
    expect(s.avgRating).toBe(0);
  });

  it("月別は12要素で、読了月に積まれる", () => {
    const books = [
      book({ finishedAt: new Date("2026-02-10") }),
      book({ finishedAt: new Date("2026-02-20") }),
      book({ finishedAt: new Date("2026-05-01") }),
    ];
    const s = computeStats(books, 2026, NOW);
    expect(s.monthly).toHaveLength(12);
    expect(s.monthly[1]).toBe(2);
    expect(s.monthly[4]).toBe(1);
    expect(s.monthly.reduce((a, b) => a + b, 0)).toBe(3);
  });

  it("ジャンルは日本語化され、未設定は未分類にまとまる", () => {
    const books = [
      book({ finishedAt: new Date("2026-02-01"), genre: "Science" }),
      book({ finishedAt: new Date("2026-03-01"), genre: "Science" }),
      book({ finishedAt: new Date("2026-04-01"), genre: null }),
    ];
    const s = computeStats(books, 2026, NOW);
    expect(s.genreSorted[0]).toEqual(["科学", 2]);
    expect(s.genreSorted).toContainEqual(["未分類", 1]);
  });

  it("ジャンルは上位6件まで", () => {
    const genres = ["Science", "History", "Art", "Music", "Travel", "Law", "Poetry", "Drama"];
    const books = genres.map((g, i) =>
      book({ finishedAt: new Date(`2026-0${(i % 9) + 1}-01`), genre: g })
    );
    expect(computeStats(books, 2026, NOW).genreSorted.length).toBeLessThanOrEqual(6);
  });

  it("評価分布は年で絞らず全期間を数える", () => {
    const books = [
      book({ finishedAt: new Date("2026-02-01"), rating: 5 }),
      book({ finishedAt: new Date("2020-02-01"), rating: 5 }),
    ];
    const s = computeStats(books, 2026, NOW);
    expect(s.ratingDist.find((r) => r.r === 5)!.count).toBe(2);
  });

  it("著者別は冊数の多い順、著者なしは除外", () => {
    const books = [
      book({ finishedAt: new Date("2026-02-01"), author: "A", rating: 4 }),
      book({ finishedAt: new Date("2026-03-01"), author: "A", rating: 2 }),
      book({ finishedAt: new Date("2026-04-01"), author: "B" }),
      book({ finishedAt: new Date("2026-05-01"), author: "  " }),
    ];
    const s = computeStats(books, 2026, NOW);
    expect(s.authorSorted[0]).toEqual({ name: "A", count: 2, avgRating: 3 });
    expect(s.authorSorted.find((a) => a.name === "B")!.avgRating).toBeNull();
    expect(s.authorSorted).toHaveLength(2);
  });

  it("平均読了日数は開始・終了が揃った本だけで出す", () => {
    const books = [
      book({ startedAt: new Date("2026-02-01"), finishedAt: new Date("2026-02-11") }), // 10日
      book({ startedAt: new Date("2026-03-01"), finishedAt: new Date("2026-03-05") }), // 4日
      book({ startedAt: null, finishedAt: new Date("2026-04-01") }),
    ];
    const s = computeStats(books, 2026, NOW);
    expect(s.booksWithDurationCount).toBe(2);
    expect(s.avgDays).toBe(7);
  });

  it("同日に読み終えた本は0日ではなく1日として数える", () => {
    const books = [
      book({ startedAt: new Date("2026-02-01T09:00:00"), finishedAt: new Date("2026-02-01T18:00:00") }),
    ];
    expect(computeStats(books, 2026, NOW).avgDays).toBe(1);
  });

  it("対象が無ければ平均読了日数は null", () => {
    expect(computeStats([], 2026, NOW).avgDays).toBeNull();
  });

  it("今年は経過月数で割る", () => {
    const books = Array.from({ length: 14 }, (_, i) =>
      book({ finishedAt: new Date(`2026-0${(i % 7) + 1}-01`) })
    );
    const s = computeStats(books, 2026, NOW); // 7月 → 経過7ヶ月
    expect(s.monthlyPace).toBe(2);
    expect(s.projectedAnnual).toBe(24);
  });

  it("過去の年は12ヶ月で割り、年間予測は出さない", () => {
    const books = Array.from({ length: 12 }, (_, i) =>
      book({ finishedAt: new Date(`2025-${String((i % 12) + 1).padStart(2, "0")}-01`) })
    );
    const s = computeStats(books, 2025, NOW);
    expect(s.monthlyPace).toBe(1);
    expect(s.projectedAnnual).toBeNull();
  });

  it("読了0冊ならペース0・予測なし", () => {
    const s = computeStats([], 2026, NOW);
    expect(s.monthlyPace).toBe(0);
    expect(s.projectedAnnual).toBeNull();
  });
});
