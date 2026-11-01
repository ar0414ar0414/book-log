import type { BookListItem } from "@/types";
import { localizeGenre } from "@/lib/utils";

/**
 * 読書統計の集計。StatsView から切り出した純粋関数。
 * `now` を引数で受け取るのは、現在日時に依存する月平均ペース・年間予測を
 * テスト可能にするため。
 */

export function availableYears(books: BookListItem[], now: Date = new Date()): number[] {
  const years = new Set<number>([now.getFullYear()]);
  books.forEach((b) => {
    if (b.status === "done") {
      const d = b.finishedAt ?? b.updatedAt ?? b.createdAt;
      years.add(new Date(d).getFullYear());
    }
  });
  return [...years].sort((a, b) => b - a);
}

/** 読了日。finishedAt が無い本は updatedAt（それも無ければ createdAt）で代用する */
export function doneDate(b: BookListItem): Date {
  return b.finishedAt ? new Date(b.finishedAt) : new Date(b.updatedAt ?? b.createdAt);
}

export interface BookStats {
  doneThisYear: BookListItem[];
  totalPages: number;
  avgRating: number;
  monthly: number[];
  genreSorted: [string, number][];
  ratingDist: { r: number; count: number }[];
  authorSorted: { name: string; count: number; avgRating: number | null }[];
  avgDays: number | null;
  monthlyPace: number;
  projectedAnnual: number | null;
  booksWithDurationCount: number;
}

export function computeStats(
  books: BookListItem[],
  year: number,
  now: Date = new Date()
): BookStats {
  const doneThisYear = books.filter(
    (b) => b.status === "done" && doneDate(b).getFullYear() === year
  );

  const totalPages = doneThisYear.reduce((s, b) => s + (b.pageCount ?? 0), 0);
  const ratings = doneThisYear.filter((b) => b.rating != null).map((b) => b.rating!);
  const avgRating = ratings.length ? ratings.reduce((a, b) => a + b, 0) / ratings.length : 0;

  const monthly = Array.from({ length: 12 }, (_, i) =>
    doneThisYear.filter((b) => doneDate(b).getMonth() === i).length
  );

  const genreMap = new Map<string, number>();
  doneThisYear.forEach((b) => {
    const g = localizeGenre(b.genre?.trim()) || "未分類";
    genreMap.set(g, (genreMap.get(g) ?? 0) + 1);
  });
  const genreSorted = [...genreMap.entries()].sort((a, b) => b[1] - a[1]).slice(0, 6);

  // 評価分布だけは年で絞らず全期間が対象
  const ratingDist = [5, 4, 3, 2, 1].map((r) => ({
    r,
    count: books.filter((b) => Math.round(b.rating ?? 0) === r).length,
  }));

  const authorMap = new Map<string, { count: number; ratingSum: number; ratingCount: number }>();
  doneThisYear.forEach((b) => {
    const a = b.author?.trim();
    if (!a) return;
    const entry = authorMap.get(a) ?? { count: 0, ratingSum: 0, ratingCount: 0 };
    entry.count += 1;
    if (b.rating != null) {
      entry.ratingSum += b.rating;
      entry.ratingCount += 1;
    }
    authorMap.set(a, entry);
  });
  const authorSorted = [...authorMap.entries()]
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, 8)
    .map(([name, { count, ratingSum, ratingCount }]) => ({
      name,
      count,
      avgRating: ratingCount > 0 ? ratingSum / ratingCount : null,
    }));

  // 平均読了日数（startedAt と finishedAt が両方ある本のみ）
  const booksWithDuration = doneThisYear.filter(
    (b) => b.startedAt != null && b.finishedAt != null
  );
  const avgDays =
    booksWithDuration.length > 0
      ? Math.round(
          booksWithDuration.reduce((sum, b) => {
            const days = Math.max(
              1,
              Math.round(
                (new Date(b.finishedAt!).getTime() - new Date(b.startedAt!).getTime()) / 86400000
              )
            );
            return sum + days;
          }, 0) / booksWithDuration.length
        )
      : null;

  // 月平均ペース・年間予測。今年は経過月数で、過去の年は12ヶ月で割る
  const monthsElapsed = year === now.getFullYear() ? now.getMonth() + 1 : 12;
  const monthlyPace =
    doneThisYear.length > 0 ? Math.round((doneThisYear.length / monthsElapsed) * 10) / 10 : 0;
  const projectedAnnual =
    year === now.getFullYear() && monthlyPace > 0 ? Math.round(monthlyPace * 12) : null;

  return {
    doneThisYear,
    totalPages,
    avgRating,
    monthly,
    genreSorted,
    ratingDist,
    authorSorted,
    avgDays,
    monthlyPace,
    projectedAnnual,
    booksWithDurationCount: booksWithDuration.length,
  };
}
