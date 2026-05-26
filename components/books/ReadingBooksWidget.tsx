"use client";

import { useState } from "react";
import Link from "next/link";
import { BookOpen, Pencil, Check, X } from "lucide-react";

type ReadingBook = {
  id: string;
  title: string;
  author: string | null;
  coverUrl: string | null;
  currentPage: number | null;
  pageCount: number | null;
};

function ReadingBookCard({ book }: { book: ReadingBook }) {
  const [currentPage, setCurrentPage] = useState(book.currentPage ?? 0);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [draft, setDraft] = useState("");
  const [saving, setSaving] = useState(false);

  const percent = book.pageCount
    ? Math.min(Math.round((currentPage / book.pageCount) * 100), 100)
    : null;

  async function savePage(newPage: number) {
    const clamped = book.pageCount ? Math.min(newPage, book.pageCount) : newPage;
    const prev = currentPage;
    setCurrentPage(clamped);
    setSaving(true);
    try {
      await fetch(`/api/books/${book.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPage: clamped }),
      });
    } catch {
      setCurrentPage(prev);
    } finally {
      setSaving(false);
    }
  }

  function handleAdd(n: number) {
    savePage(currentPage + n);
  }

  function handleDirectSubmit(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault();
    const val = parseInt(draft);
    if (!isNaN(val) && val > 0) {
      savePage(val);
      setDraft("");
      setSheetOpen(false);
    }
  }

  function openSheet(e: React.MouseEvent) {
    e.preventDefault();
    setDraft("");
    setSheetOpen(true);
  }

  return (
    <>
      <div className="bg-gradient-to-r from-indigo-50 dark:from-indigo-950/50 to-white dark:to-slate-800 rounded-xl border border-indigo-100 dark:border-indigo-800 hover:border-indigo-300 dark:hover:border-indigo-600 transition-all overflow-hidden">
        {/* タップで詳細へ */}
        <Link href={`/books/${book.id}`} className="flex items-center gap-4 p-3 pb-2">
          <div className="w-12 h-17 flex-shrink-0 rounded-lg overflow-hidden shadow-sm">
            {book.coverUrl ? (
              <img src={book.coverUrl} alt={book.title} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center">
                <BookOpen className="w-5 h-5 text-indigo-300 dark:text-indigo-500" />
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-slate-900 dark:text-slate-100 truncate">{book.title}</p>
            <p className="text-sm text-slate-500 dark:text-slate-400 truncate mt-0.5">{book.author ?? "著者不明"}</p>
            {book.pageCount ? (
              <div className="flex items-center gap-2 mt-1.5">
                <div className="flex-1 bg-slate-200 dark:bg-slate-700 rounded-full h-1.5 overflow-hidden">
                  <div
                    className="h-full bg-indigo-500 rounded-full transition-all duration-500"
                    style={{ width: `${percent}%` }}
                  />
                </div>
                <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 tabular-nums flex-shrink-0">
                  {percent}%
                </span>
              </div>
            ) : null}
          </div>
          <div className="flex-shrink-0 w-1.5 self-stretch rounded-full bg-indigo-400 dark:bg-indigo-500" />
        </Link>

        {/* ページ更新ボタン */}
        <div className="px-3 pb-2.5 flex items-center justify-between">
          <span className="text-xs text-slate-400 dark:text-slate-500 tabular-nums">
            p.{currentPage}{book.pageCount ? ` / ${book.pageCount}` : ""}
          </span>
          <button
            onClick={openSheet}
            disabled={saving}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/50 border border-indigo-100 dark:border-indigo-800 rounded-lg active:scale-95 transition-all disabled:opacity-50"
          >
            <Pencil className="w-3 h-3" />
            ページ更新
          </button>
        </div>
      </div>

      {/* ボトムシート */}
      {sheetOpen && (
        <>
          {/* 背景オーバーレイ */}
          <div
            className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
            onClick={() => setSheetOpen(false)}
          />

          {/* シート本体 */}
          <div className="fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-slate-800 rounded-t-2xl shadow-2xl max-w-lg mx-auto">
            {/* ドラッグハンドル */}
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 rounded-full bg-slate-200 dark:bg-slate-600" />
            </div>

            {/* ヘッダー */}
            <div className="flex items-start justify-between px-5 pt-2 pb-4">
              <div>
                <p className="font-semibold text-slate-900 dark:text-slate-100 truncate max-w-[240px]">
                  {book.title}
                </p>
                <p className="text-sm text-indigo-600 dark:text-indigo-400 font-mono mt-0.5">
                  p.{currentPage}{book.pageCount ? ` / ${book.pageCount}` : ""}
                  {book.pageCount && (
                    <span className="text-slate-400 dark:text-slate-500 font-sans ml-2">
                      ({percent}%)
                    </span>
                  )}
                </p>
              </div>
              <button
                onClick={() => setSheetOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* クイック追加ボタン（2×2） */}
            <div className="grid grid-cols-2 gap-3 px-5 pb-4">
              {([10, 25, 50, 100] as const).map((n) => (
                <button
                  key={n}
                  onClick={() => handleAdd(n)}
                  disabled={saving}
                  className="py-4 rounded-2xl bg-indigo-50 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 text-xl font-bold border border-indigo-100 dark:border-indigo-800 active:scale-95 active:bg-indigo-100 dark:active:bg-indigo-900 transition-all disabled:opacity-50"
                >
                  +{n}
                </button>
              ))}
            </div>

            {/* 直接入力 */}
            <div className="px-5 pb-4">
              <form onSubmit={handleDirectSubmit} className="flex gap-2">
                <input
                  type="number"
                  min={1}
                  max={book.pageCount ?? undefined}
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  placeholder={book.pageCount ? `ページ数を入力（1〜${book.pageCount}）` : "ページ数を入力"}
                  className="flex-1 border border-slate-200 dark:border-slate-600 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-indigo-400 dark:focus:border-indigo-500 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500"
                />
                <button
                  type="submit"
                  disabled={!draft || saving}
                  className="px-4 py-3 bg-indigo-600 dark:bg-indigo-500 text-white rounded-xl font-medium hover:bg-indigo-700 dark:hover:bg-indigo-600 disabled:opacity-40 transition-colors flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  確定
                </button>
              </form>
            </div>

            <div className="pb-safe-bottom" />
          </div>
        </>
      )}
    </>
  );
}

export default function ReadingBooksWidget({ books }: { books: ReadingBook[] }) {
  if (books.length === 0) return null;
  return (
    <section>
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          今読んでいる本
        </h2>
        <span className="text-xs text-slate-400 dark:text-slate-500">{books.length}冊</span>
      </div>
      <div className="space-y-2">
        {books.map((book) => (
          <ReadingBookCard key={book.id} book={book} />
        ))}
      </div>
    </section>
  );
}
