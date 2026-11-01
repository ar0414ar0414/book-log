"use client";

import { useMemo, useState } from "react";
import { BookOpen, Star, FileText, TrendingUp, User, Clock, Zap } from "lucide-react";
import type { BookListItem } from "@/types";
import { computeStats, availableYears as computeAvailableYears } from "@/lib/stats";

const MONTH_LABELS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12"];
const COLORS = ["#4f46e5", "#7c3aed", "#2563eb", "#0891b2", "#059669", "#d97706"];

export default function StatsView({ books }: { books: BookListItem[] }) {
  const currentYear = new Date().getFullYear();

  const availableYears = useMemo(() => computeAvailableYears(books), [books]);

  const [year, setYear] = useState(currentYear);

  const stats = useMemo(() => computeStats(books, year), [books, year]);

  const maxMonthly = Math.max(...stats.monthly, 1);
  const maxGenre = stats.genreSorted[0]?.[1] ?? 1;
  const maxRating = Math.max(...stats.ratingDist.map((r) => r.count), 1);

  return (
    <div className="space-y-5">
      {/* 年セレクタ */}
      <div className="flex items-center gap-2">
        <span className="text-sm text-slate-500 dark:text-slate-400">表示年：</span>
        <div className="flex gap-1.5">
          {availableYears.map((y) => (
            <button
              key={y}
              onClick={() => setYear(y)}
              className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                y === year
                  ? "bg-indigo-600 dark:bg-indigo-500 text-white"
                  : "bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-400 hover:border-indigo-300 dark:hover:border-indigo-600"
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
          icon={<BookOpen className="w-4 h-4 text-indigo-500 dark:text-indigo-400" />}
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

      {/* ペース・読了日数カード */}
      {(stats.avgDays !== null || stats.monthlyPace > 0) && (
        <div className="grid grid-cols-2 gap-3">
          <SummaryCard
            icon={<Clock className="w-4 h-4 text-purple-500 dark:text-purple-400" />}
            label="平均読了日数"
            value={stats.avgDays ?? "—"}
            unit={stats.avgDays ? "日" : ""}
            sub={stats.avgDays ? `${stats.booksWithDurationCount}冊から算出` : undefined}
          />
          <SummaryCard
            icon={<Zap className="w-4 h-4 text-orange-500 dark:text-orange-400" />}
            label="月平均ペース"
            value={stats.monthlyPace > 0 ? stats.monthlyPace : "—"}
            unit={stats.monthlyPace > 0 ? "冊/月" : ""}
            sub={stats.projectedAnnual ? `年間 ${stats.projectedAnnual} 冊ペース` : undefined}
          />
        </div>
      )}

      {/* 月別読了数 */}
      <section className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 p-4">
        <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-4 flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-indigo-500 dark:text-indigo-400" />
          月別読了数
        </h2>
        {stats.doneThisYear.length === 0 ? (
          <p className="text-xs text-slate-400 dark:text-slate-500 text-center py-6">{year}年の読了データがありません</p>
        ) : (
          <div className="flex items-end gap-1.5">
            {stats.monthly.map((count, i) => {
              const isCurrentMonth =
                year === new Date().getFullYear() && i === new Date().getMonth();
              const BAR_MAX_H = 80;
              const barH = count > 0 ? Math.max((count / maxMonthly) * BAR_MAX_H, 8) : 3;
              return (
                <div key={i} className="flex-1 flex flex-col items-center gap-1">
                  <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400" style={{ minHeight: 16 }}>
                    {count > 0 ? count : ""}
                  </span>
                  <div
                    className="w-full rounded-t-md transition-all"
                    style={{
                      height: barH,
                      backgroundColor: count > 0
                        ? isCurrentMonth ? "#4f46e5" : "#a5b4fc"
                        : "#334155",
                    }}
                  />
                  <span className={`text-xs ${isCurrentMonth ? "text-indigo-600 dark:text-indigo-400 font-semibold" : "text-slate-400 dark:text-slate-500"}`}>
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
        <section className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 p-4">
          <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-4 flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-indigo-500 dark:text-indigo-400" />
            ジャンル（{year}年読了）
          </h2>
          <div className="space-y-2.5">
            {stats.genreSorted.map(([genre, count], i) => (
              <div key={genre} className="flex items-center gap-3">
                <span className="text-xs text-slate-600 dark:text-slate-400 w-20 truncate flex-shrink-0">{genre}</span>
                <div className="flex-1 bg-slate-100 dark:bg-slate-700 rounded-full h-2 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${(count / maxGenre) * 100}%`,
                      backgroundColor: COLORS[i % COLORS.length],
                    }}
                  />
                </div>
                <span className="text-xs font-medium text-slate-500 dark:text-slate-400 w-8 text-right flex-shrink-0">
                  {count}冊
                </span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 著者別冊数 */}
      {stats.authorSorted.length > 0 && (
        <section className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 p-4">
          <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-4 flex items-center gap-2">
            <User className="w-4 h-4 text-indigo-500 dark:text-indigo-400" />
            著者別（{year}年読了）
          </h2>
          <div className="space-y-2.5">
            {stats.authorSorted.map(({ name, count, avgRating }, i) => {
              const maxCount = stats.authorSorted[0].count;
              return (
                <div key={name} className="flex items-center gap-3">
                  <span className="text-xs text-slate-600 dark:text-slate-400 w-24 truncate flex-shrink-0">{name}</span>
                  <div className="flex-1 bg-slate-100 dark:bg-slate-700 rounded-full h-2 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${(count / maxCount) * 100}%`,
                        backgroundColor: COLORS[i % COLORS.length],
                      }}
                    />
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="text-xs font-medium text-slate-500 dark:text-slate-400 w-8 text-right">{count}冊</span>
                    {avgRating != null && (
                      <span className="text-xs text-amber-500 flex items-center gap-0.5 w-10">
                        <Star className="w-3 h-3 fill-amber-400" />
                        {avgRating.toFixed(1)}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* 評価分布 */}
      {books.some((b) => b.rating != null) && (
        <section className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 p-4">
          <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-4 flex items-center gap-2">
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
                      className={`w-3 h-3 ${i < r ? "fill-amber-400 text-amber-400" : "text-slate-200 dark:text-slate-700"}`}
                    />
                  ))}
                </div>
                <div className="flex-1 bg-slate-100 dark:bg-slate-700 rounded-full h-2 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-amber-400 transition-all"
                    style={{ width: `${(count / maxRating) * 100}%` }}
                  />
                </div>
                <span className="text-xs font-medium text-slate-500 dark:text-slate-400 w-8 text-right flex-shrink-0">
                  {count}冊
                </span>
              </div>
            ))}
          </div>
        </section>
      )}

      {books.length === 0 && (
        <div className="text-center py-16">
          <TrendingUp className="w-12 h-12 text-slate-200 dark:text-slate-700 mx-auto mb-3" />
          <p className="text-slate-500 dark:text-slate-400">本を登録すると統計が表示されます</p>
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
  sub,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  unit: string;
  sub?: string;
}) {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl p-3 border border-slate-100 dark:border-slate-700 flex flex-col gap-1.5">
      <div className="flex items-center gap-1.5">
        {icon}
        <span className="text-xs text-slate-500 dark:text-slate-400">{label}</span>
      </div>
      <div className="flex items-baseline gap-0.5">
        <span className="text-xl font-bold text-slate-900 dark:text-slate-100">{value}</span>
        {unit && <span className="text-xs text-slate-400 dark:text-slate-500">{unit}</span>}
      </div>
      {sub && <p className="text-xs text-slate-400 dark:text-slate-500">{sub}</p>}
    </div>
  );
}
