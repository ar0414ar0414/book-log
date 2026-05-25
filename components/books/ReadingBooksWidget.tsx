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
  const [editing, setEditing] = useState(false);
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

  function handleEditSubmit(e: React.FormEvent) {
    e.preventDefault();
    const val = parseInt(draft);
    if (!isNaN(val) && val > 0) savePage(val);
    setEditing(false);
  }

  return (
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

      {/* インライン進捗更新 */}
      <div className="px-3 pb-2.5">
        {editing ? (
          <form onSubmit={handleEditSubmit} className="flex items-center gap-1.5">
            <input
              type="number"
              min={1}
              max={book.pageCount ?? undefined}
              autoFocus
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Escape") setEditing(false); }}
              placeholder={book.pageCount ? `1〜${book.pageCount}` : "ページ数"}
              className="flex-1 border border-indigo-300 dark:border-indigo-600 rounded-lg px-2.5 py-1 text-xs focus:outline-none bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
            />
            <button
              type="submit"
              className="p-1.5 bg-indigo-600 dark:bg-indigo-500 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
              <Check className="w-3 h-3" />
            </button>
            <button
              type="button"
              onClick={() => setEditing(false)}
              className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
            >
              <X className="w-3 h-3" />
            </button>
          </form>
        ) : (
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-slate-400 dark:text-slate-500 tabular-nums mr-auto">
              p.{currentPage}{book.pageCount ? ` / ${book.pageCount}` : ""}
            </span>
            {([10, 25, 50] as const).map((n) => (
              <button
                key={n}
                onClick={() => handleAdd(n)}
                disabled={saving}
                className="px-2 py-1 text-xs font-medium bg-indigo-50 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 rounded-lg hover:bg-indigo-100 dark:hover:bg-indigo-900 active:scale-95 transition-all disabled:opacity-50"
              >
                +{n}
              </button>
            ))}
            <button
              onClick={() => { setDraft(currentPage.toString()); setEditing(true); }}
              className="p-1.5 text-slate-400 dark:text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-900/50 transition-colors"
            >
              <Pencil className="w-3 h-3" />
            </button>
          </div>
        )}
      </div>
    </div>
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
