"use client";

import { useState, useEffect, useLayoutEffect, useRef, useMemo } from "react";
import Link from "next/link";
import {
  BookOpen, Star, Search, LayoutGrid, List, Plus, ArrowUpDown, X, Check,
} from "lucide-react";
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
  const [searchOpen, setSearchOpen] = useState(false);
  const [sortKey, setSortKey] = useState<SortKey>("createdAt_desc");
  const [sortOpen, setSortOpen] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const searchInputRef = useRef<HTMLInputElement>(null);
  const sortRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const saved = localStorage.getItem("folio_view_mode") as ViewMode | null;
    if (saved === "grid" || saved === "list") setViewMode(saved);
  }, []);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (sortRef.current && !sortRef.current.contains(e.target as Node)) {
        setSortOpen(false);
      }
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  function openSearch() {
    setSearchOpen(true);
    setSortOpen(false);
    setTimeout(() => searchInputRef.current?.focus(), 50);
  }

  function closeSearch() {
    setSearchOpen(false);
    setQuery("");
  }

  function toggleView(mode: ViewMode) {
    setViewMode(mode);
    localStorage.setItem("folio_view_mode", mode);
  }

  const currentSort = SORT_OPTIONS.find((o) => o.value === sortKey)!;

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
    <div className="space-y-4">
      {/* ── コントロールバー ── */}
      <div className="flex items-center justify-end gap-2">
        {searchOpen ? (
          <>
            <div className="flex-1 flex items-center gap-2 bg-white dark:bg-slate-800 border border-indigo-300 dark:border-indigo-600 rounded-full px-3.5 py-2 shadow-sm">
              <Search className="w-4 h-4 text-indigo-400 flex-shrink-0" />
              <input
                ref={searchInputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="タイトル・著者..."
                className="flex-1 text-sm bg-transparent focus:outline-none text-slate-700 dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-slate-500"
              />
              {query && (
                <button
                  onClick={() => setQuery("")}
                  className="text-slate-300 dark:text-slate-600 hover:text-slate-500 dark:hover:text-slate-400 transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
            <button
              onClick={closeSearch}
              className="text-sm text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors whitespace-nowrap px-1"
            >
              キャンセル
            </button>
          </>
        ) : (
          <>
            <button
              onClick={openSearch}
              className="w-9 h-9 flex items-center justify-center rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 text-slate-500 dark:text-slate-400 hover:border-indigo-300 dark:hover:border-indigo-600 hover:text-indigo-500 dark:hover:text-indigo-400 transition-colors shadow-sm flex-shrink-0"
            >
              <Search className="w-4 h-4" />
            </button>

            <div ref={sortRef} className="relative flex-shrink-0">
              <button
                onClick={() => setSortOpen((v) => !v)}
                aria-label="並び替え"
                className={cn(
                  "w-9 h-9 flex items-center justify-center rounded-full border transition-colors shadow-sm",
                  sortOpen
                    ? "bg-indigo-600 dark:bg-indigo-500 border-indigo-600 dark:border-indigo-500 text-white"
                    : sortKey !== "createdAt_desc"
                      ? "bg-indigo-50 dark:bg-indigo-900/50 border-indigo-300 dark:border-indigo-600 text-indigo-600 dark:text-indigo-400"
                      : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-600 text-slate-500 dark:text-slate-400 hover:border-indigo-300 dark:hover:border-indigo-600 hover:text-indigo-500 dark:hover:text-indigo-400"
                )}
              >
                <ArrowUpDown className="w-4 h-4" />
              </button>

              {sortOpen && (
                <div className="absolute top-full right-0 mt-1.5 w-52 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl shadow-xl z-20 py-1.5 overflow-hidden">
                  {SORT_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => { setSortKey(opt.value); setSortOpen(false); }}
                      className={cn(
                        "w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors text-left",
                        opt.value === sortKey
                          ? "text-indigo-600 dark:text-indigo-400 font-medium bg-indigo-50 dark:bg-indigo-900/50"
                          : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700"
                      )}
                    >
                      <Check
                        className={cn(
                          "w-3.5 h-3.5 flex-shrink-0",
                          opt.value === sortKey ? "opacity-100 text-indigo-600 dark:text-indigo-400" : "opacity-0"
                        )}
                      />
                      {opt.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="flex bg-slate-100 dark:bg-slate-700 rounded-full p-0.5 shadow-inner flex-shrink-0">
              <button
                onClick={() => toggleView("grid")}
                aria-label="グリッド表示"
                className={cn(
                  "w-8 h-8 flex items-center justify-center rounded-full transition-all duration-200",
                  viewMode === "grid"
                    ? "bg-white dark:bg-slate-600 text-indigo-600 dark:text-indigo-400 shadow-sm"
                    : "text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300"
                )}
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                onClick={() => toggleView("list")}
                aria-label="リスト表示"
                className={cn(
                  "w-8 h-8 flex items-center justify-center rounded-full transition-all duration-200",
                  viewMode === "list"
                    ? "bg-white dark:bg-slate-600 text-indigo-600 dark:text-indigo-400 shadow-sm"
                    : "text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300"
                )}
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </>
        )}
      </div>

      {query && (
        <p className="text-xs text-slate-400 dark:text-slate-500">
          {filtered.length} 件ヒット
        </p>
      )}

      {filtered.length === 0 ? (
        <div className="text-center py-16">
          <BookOpen className="w-12 h-12 text-slate-200 dark:text-slate-700 mx-auto mb-3" />
          <p className="text-slate-500 dark:text-slate-400">
            {query ? "該当する本が見つかりません" : "本がありません"}
          </p>
          {!query && (
            <Link
              href="/books/new"
              className="inline-flex items-center gap-2 mt-4 text-indigo-600 dark:text-indigo-400 hover:underline text-sm"
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
          className="bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700 overflow-hidden hover:border-indigo-200 dark:hover:border-indigo-700 hover:shadow-md transition-all flex flex-col active:scale-95 active:opacity-70"
        >
          <div className="aspect-[2/3] bg-indigo-50 dark:bg-indigo-950 relative">
            {book.coverUrl ? (
              <img src={book.coverUrl} alt={book.title} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <BookOpen className="w-10 h-10 text-indigo-200 dark:text-indigo-700" />
              </div>
            )}
            <span className={cn(
              "absolute top-2 left-2 text-xs px-2 py-0.5 rounded-full font-medium",
              STATUS_COLORS[book.status as BookStatus]
            )}>
              {STATUS_LABELS[book.status]}
            </span>
            {book.status === "reading" && book.pageCount && book.currentPage && (
              <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-black/10">
                <div
                  className="h-full bg-indigo-500 transition-all"
                  style={{ width: `${Math.min((book.currentPage / book.pageCount) * 100, 100)}%` }}
                />
              </div>
            )}
          </div>
          <div className="p-3 flex-1 flex flex-col gap-1">
            <p className="font-medium text-slate-900 dark:text-slate-100 text-sm leading-tight line-clamp-2">{book.title}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{book.author ?? "著者不明"}</p>
            <div className="flex items-center justify-between mt-auto">
              {book.rating != null ? (
                <div className="flex items-center gap-0.5 text-amber-500">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className={cn("w-3 h-3", i < book.rating! ? "fill-current" : "text-slate-200 dark:text-slate-700")} />
                  ))}
                </div>
              ) : <span />}
              {book.pageCount && (
                <span className="text-xs text-slate-400 dark:text-slate-500">{book.pageCount}p</span>
              )}
            </div>
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
          className="flex items-center gap-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700 p-3 hover:border-indigo-200 dark:hover:border-indigo-700 hover:shadow-sm transition-all active:scale-95 active:opacity-70"
        >
          <div className="w-10 h-14 bg-indigo-50 dark:bg-indigo-950 rounded-md overflow-hidden flex-shrink-0">
            {book.coverUrl ? (
              <img src={book.coverUrl} alt={book.title} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <BookOpen className="w-5 h-5 text-indigo-200 dark:text-indigo-700" />
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0 space-y-0.5">
            <p className="font-medium text-slate-900 dark:text-slate-100 text-sm leading-tight truncate">{book.title}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{book.author ?? "著者不明"}</p>
            {book.rating != null && (
              <div className="flex items-center gap-0.5">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className={cn("w-3 h-3 text-amber-500", i < book.rating! ? "fill-current" : "text-slate-200 dark:text-slate-700")} />
                ))}
              </div>
            )}
          </div>
          <span className={cn(
            "text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0",
            STATUS_COLORS[book.status as BookStatus]
          )}>
            {STATUS_LABELS[book.status]}
          </span>
        </Link>
      ))}
    </div>
  );
}
