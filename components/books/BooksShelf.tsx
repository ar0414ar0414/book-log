"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { BookOpen, Star, Search, LayoutGrid, List, Plus } from "lucide-react";
import { cn, STATUS_LABELS, STATUS_COLORS } from "@/lib/utils";
import type { Book, BookStatus } from "@/types";

type SortKey = "createdAt_desc" | "createdAt_asc" | "title_asc" | "rating_desc" | "finishedAt_desc";
type ViewMode = "grid" | "list";

const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: "createdAt_desc", label: "追加日（新しい順）" },
  { value: "createdAt_asc", label: "追加日（古い順）" },
  { value: "title_asc", label: "タイトル（五十音）" },
  { value: "rating_desc", label: "評価（高い順）" },
  { value: "finishedAt_desc", label: "読了日（新しい順）" },
];

function sortBooks(books: Book[], key: SortKey): Book[] {
  return [...books].sort((a, b) => {
    switch (key) {
      case "createdAt_desc":
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      case "createdAt_asc":
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      case "title_asc":
        return a.title.localeCompare(b.title, "ja");
      case "rating_desc":
        return (b.rating ?? 0) - (a.rating ?? 0);
      case "finishedAt_desc": {
        const ta = a.finishedAt ? new Date(a.finishedAt).getTime() : 0;
        const tb = b.finishedAt ? new Date(b.finishedAt).getTime() : 0;
        return tb - ta;
      }
    }
  });
}

export default function BooksShelf({
  books,
  statusFilter,
}: {
  books: Book[];
  statusFilter?: string;
}) {
  const [query, setQuery] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("createdAt_desc");
  const [viewMode, setViewMode] = useState<ViewMode>("grid");

  useEffect(() => {
    const saved = localStorage.getItem("folio_view_mode") as ViewMode | null;
    if (saved === "grid" || saved === "list") setViewMode(saved);
  }, []);

  function toggleView(mode: ViewMode) {
    setViewMode(mode);
    localStorage.setItem("folio_view_mode", mode);
  }

  const filtered = useMemo(() => {
    let result = statusFilter
      ? books.filter((b) => b.status === statusFilter)
      : books;
    if (query.trim()) {
      const q = query.trim().toLowerCase();
      result = result.filter(
        (b) =>
          b.title.toLowerCase().includes(q) ||
          (b.author ?? "").toLowerCase().includes(q)
      );
    }
    return sortBooks(result, sortKey);
  }, [books, statusFilter, query, sortKey]);

  return (
    <div className="space-y-3">
      {/* 検索 */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="タイトル・著者で検索..."
          className="w-full pl-9 pr-4 py-2 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-400 transition-colors"
        />
      </div>

      {/* 並べ替え + 表示切り替え */}
      <div className="flex items-center gap-2">
        <select
          value={sortKey}
          onChange={(e) => setSortKey(e.target.value as SortKey)}
          className="flex-1 text-sm bg-white border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:border-indigo-400 transition-colors text-slate-700"
        >
          {SORT_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <div className="flex border border-slate-200 rounded-xl overflow-hidden">
          <button
            onClick={() => toggleView("grid")}
            aria-label="グリッド表示"
            className={cn(
              "p-2 transition-colors",
              viewMode === "grid"
                ? "bg-indigo-600 text-white"
                : "bg-white text-slate-500 hover:bg-slate-50"
            )}
          >
            <LayoutGrid className="w-4 h-4" />
          </button>
          <button
            onClick={() => toggleView("list")}
            aria-label="リスト表示"
            className={cn(
              "p-2 transition-colors",
              viewMode === "list"
                ? "bg-indigo-600 text-white"
                : "bg-white text-slate-500 hover:bg-slate-50"
            )}
          >
            <List className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 件数 */}
      {query && (
        <p className="text-xs text-slate-400">{filtered.length} 件ヒット</p>
      )}

      {/* 空状態 */}
      {filtered.length === 0 ? (
        <div className="text-center py-16">
          <BookOpen className="w-12 h-12 text-slate-200 mx-auto mb-3" />
          <p className="text-slate-500">
            {query ? "該当する本が見つかりません" : "本がありません"}
          </p>
          {!query && (
            <Link
              href="/books/new"
              className="inline-flex items-center gap-2 mt-4 text-indigo-600 hover:underline text-sm"
            >
              <Plus className="w-4 h-4" />
              本を追加する
            </Link>
          )}
        </div>
      ) : viewMode === "grid" ? (
        <GridView books={filtered} />
      ) : (
        <ListView books={filtered} />
      )}
    </div>
  );
}

function GridView({ books }: { books: Book[] }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
      {books.map((book) => (
        <Link
          key={book.id}
          href={`/books/${book.id}`}
          className="bg-white rounded-xl border border-slate-100 overflow-hidden hover:border-indigo-200 transition-colors flex flex-col"
        >
          <div className="aspect-[2/3] bg-indigo-50 relative">
            {book.coverUrl ? (
              <img
                src={book.coverUrl}
                alt={book.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <BookOpen className="w-10 h-10 text-indigo-200" />
              </div>
            )}
            <span
              className={cn(
                "absolute top-2 left-2 text-xs px-2 py-0.5 rounded-full font-medium",
                STATUS_COLORS[book.status as BookStatus]
              )}
            >
              {STATUS_LABELS[book.status]}
            </span>
          </div>
          <div className="p-3 flex-1 flex flex-col gap-1">
            <p className="font-medium text-slate-900 text-sm leading-tight line-clamp-2">
              {book.title}
            </p>
            <p className="text-xs text-slate-500 truncate">
              {book.author ?? "著者不明"}
            </p>
            {book.rating != null && (
              <div className="flex items-center gap-0.5 text-amber-500 mt-auto">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    className={cn(
                      "w-3 h-3",
                      i < book.rating! ? "fill-current" : "text-slate-200"
                    )}
                  />
                ))}
              </div>
            )}
          </div>
        </Link>
      ))}
    </div>
  );
}

function ListView({ books }: { books: Book[] }) {
  return (
    <div className="space-y-2">
      {books.map((book) => (
        <Link
          key={book.id}
          href={`/books/${book.id}`}
          className="flex items-center gap-3 bg-white rounded-xl border border-slate-100 p-3 hover:border-indigo-200 transition-colors"
        >
          <div className="w-10 h-14 bg-indigo-50 rounded-md overflow-hidden flex-shrink-0">
            {book.coverUrl ? (
              <img
                src={book.coverUrl}
                alt={book.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <BookOpen className="w-5 h-5 text-indigo-200" />
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0 space-y-0.5">
            <p className="font-medium text-slate-900 text-sm leading-tight truncate">
              {book.title}
            </p>
            <p className="text-xs text-slate-500 truncate">
              {book.author ?? "著者不明"}
            </p>
            {book.rating != null && (
              <div className="flex items-center gap-0.5">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    className={cn(
                      "w-3 h-3 text-amber-500",
                      i < book.rating! ? "fill-current" : "text-slate-200"
                    )}
                  />
                ))}
              </div>
            )}
          </div>
          <span
            className={cn(
              "text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0",
              STATUS_COLORS[book.status as BookStatus]
            )}
          >
            {STATUS_LABELS[book.status]}
          </span>
        </Link>
      ))}
    </div>
  );
}
