"use client";

import { useMemo, useState } from "react";
import { BookOpen, Star, FileText, TrendingUp } from "lucide-react";
import type { Book } from "@/types";

const MONTH_LABELS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12"];
const COLORS = ["#4f46e5", "#7c3aed", "#2563eb", "#0891b2", "#059669", "#d97706"];

export default function StatsView({ books }: { books: Book[] }) {
  const currentYear = new Date().getFullYear();

  const availableYears = useMemo(() => {
    const years = new Set<number>();
    years.add(currentYear);
    books.forEach((b) => {
      if (b.finishedAt) years.add(new Date(b.finishedAt).getFullYear());
      if (b.createdAt) years.add(new Date(b.createdAt).getFullYear());
    });
    return [...years].sort((a, b) => b - a);
  }, [books, currentYear]);

  const [year, setYear] = useState(currentYear);

  const stats = useMemo(() => {
    const doneThisYear = books.filter((b) => {
      if (b.status !== "done" || !b.finishedAt) return false;
      return new Date(b.finishedAt).getFullYear() === year;
    });

    const totalPages = doneThisYear.reduce((s, b) => s + (b.pageCount ?? 0), 0);
    const ratings = doneThisYear.filter((b) => b.rating != null).map((b) => b.rating!);
    const avgRating = ratings.length ? ratings.reduce((a, b) => a + b, 0) / ratings.length : 0;

    // 月別読了数
    const monthly = Array.from({ length: 12 }, (_, i) =>
      doneThisYear.filter((b) => new Date(b.finishedAt!).getMonth() === i).length
    );

    // ジャンル分布（全ステータス・当年追加分）
    const addedThisYear = books.filter(
      (b) => new Date(b.createdAt).getFullYear() === year
    );
    const genreMap = new Map<string, number>();
    addedThisYear.forEach((b) => {
      const g = b.genre?.trim() || "未分類";
      genreMap.set(g, (genreMap.get(g) ?? 0) + 1);
    });
    const genreSorted = [...genreMap.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6);

    // 評価分布（全期間）
    const ratingDist = [5, 4, 3, 2, 1].map((r) => ({
      r,
      count: books.filter((b) => Math.round(b.rating ?? 0) === r).length,
    }));

    return { doneThisYear, totalPages, avgRating, monthly, genreSorted, ratingDist };
  }, [books, year]);

  const maxMonthly = Math.max(...stats.monthly, 1);
  const maxGenre = stats.genreSorted[0]?.[1] ?? 1;
  const maxRating = Math.max(...stats.ratingDist.map((r) => r.count), 1);

  return (
    <div className="space-y-5">
      {/* 年セレクタ */}
      <div className="flex items-center gap-2">
        <span className="text-sm text-slate-500">表示年：</span>
        <div className="flex gap-1.5">
          {availableYears.map((y) => (
            <button
              key={y}
              onClick={() => setYear(y)}
              className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                y === year
                  ? "bg-indigo-600 text-white"
                  : "bg-white border border-slate-200 text-slate-600 hover:border-indigo-300"
              }`}
            >
              {y}
            </button>
          ))}
        </div>
      </div>

      {/* サマリーカード */}
      <div className="grid grid-cols-3 gap-3">
        <SummaryCard
          icon={<BookOpen className="w-4 h-4 text-indigo-500" />}
          label="読了"
          value={stats.doneThisYear.length}
          unit="冊"
        />
        <SummaryCard
          icon={<Star className="w-4 h-4 text-amber-500" />}
          label="平均評価"
          value={stats.avgRating ? stats.avgRating.toFixed(1) : "—"}
          unit={stats.avgRating ? "点" : ""}
        />
        <SummaryCard
          icon={<FileText className="w-4 h-4 text-emerald-500" />}
          label="総ページ"
          value={stats.totalPages > 0 ? stats.totalPages.toLocaleString() : "—"}
          unit={stats.totalPages > 0 ? "p" : ""}
        />
      </div>

      {/* 月別読了数 */}
      <section className="bg-white rounded-2xl border border-slate-100 p-4">
        <h2 className="text-sm font-semibold text-slate-700 mb-4 flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-indigo-500" />
          月別読了数
        </h2>
        {stats.doneThisYear.length === 0 ? (
          <p className="text-xs text-slate-400 text-center py-6">{year}年の読了データがありません</p>
        ) : (
          <div className="flex items-end gap-1.5 h-28">
            {stats.monthly.map((count, i) => {
              const isCurrentMonth =
                year === new Date().getFullYear() && i === new Date().getMonth();
              const heightPct = (count / maxMonthly) * 100;
              return (
                <div key={i} className="flex-1 flex flex-col items-center gap-1">
                  {count > 0 && (
                    <span className="text-xs font-semibold text-indigo-600">{count}</span>
                  )}
                  <div className="w-full flex-1 flex items-end">
                    <div
                      className="w-full rounded-t-md transition-all"
                      style={{
                        height: count > 0 ? `${Math.max(heightPct, 8)}%` : "4px",
                        backgroundColor: count > 0
                          ? isCurrentMonth ? "#4f46e5" : "#a5b4fc"
                          : "#f1f5f9",
                      }}
                    />
                  </div>
                  <span
                    className={`text-xs ${isCurrentMonth ? "text-indigo-600 font-semibold" : "text-slate-400"}`}
                  >
                    {MONTH_LABELS[i]}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* ジャンル分布 */}
      {stats.genreSorted.length > 0 && (
        <section className="bg-white rounded-2xl border border-slate-100 p-4">
          <h2 className="text-sm font-semibold text-slate-700 mb-4 flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-indigo-500" />
            ジャンル（{year}年追加）
          </h2>
          <div className="space-y-2.5">
            {stats.genreSorted.map(([genre, count], i) => (
              <div key={genre} className="flex items-center gap-3">
                <span className="text-xs text-slate-600 w-20 truncate flex-shrink-0">{genre}</span>
                <div className="flex-1 bg-slate-100 rounded-full h-2 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${(count / maxGenre) * 100}%`,
                      backgroundColor: COLORS[i % COLORS.length],
                    }}
                  />
                </div>
                <span className="text-xs font-medium text-slate-500 w-8 text-right flex-shrink-0">
                  {count}冊
                </span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 評価分布 */}
      {books.some((b) => b.rating != null) && (
        <section className="bg-white rounded-2xl border border-slate-100 p-4">
          <h2 className="text-sm font-semibold text-slate-700 mb-4 flex items-center gap-2">
            <Star className="w-4 h-4 text-amber-500" />
            評価分布（全期間）
          </h2>
          <div className="space-y-2.5">
            {stats.ratingDist.map(({ r, count }) => (
              <div key={r} className="flex items-center gap-3">
                <div className="flex gap-0.5 flex-shrink-0">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className={`w-3 h-3 ${i < r ? "fill-amber-400 text-amber-400" : "text-slate-200"}`}
                    />
                  ))}
                </div>
                <div className="flex-1 bg-slate-100 rounded-full h-2 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-amber-400 transition-all"
                    style={{ width: `${(count / maxRating) * 100}%` }}
                  />
                </div>
                <span className="text-xs font-medium text-slate-500 w-8 text-right flex-shrink-0">
                  {count}冊
                </span>
              </div>
            ))}
          </div>
        </section>
      )}

      {books.length === 0 && (
        <div className="text-center py-16">
          <TrendingUp className="w-12 h-12 text-slate-200 mx-auto mb-3" />
          <p className="text-slate-500">本を登録すると統計が表示されます</p>
        </div>
      )}
    </div>
  );
}

function SummaryCard({
  icon,
  label,
  value,
  unit,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  unit: string;
}) {
  return (
    <div className="bg-white rounded-xl p-3 border border-slate-100 flex flex-col gap-1.5">
      <div className="flex items-center gap-1.5">
        {icon}
        <span className="text-xs text-slate-500">{label}</span>
      </div>
      <div className="flex items-baseline gap-0.5">
        <span className="text-xl font-bold text-slate-900">{value}</span>
        {unit && <span className="text-xs text-slate-400">{unit}</span>}
      </div>
    </div>
  );
}
