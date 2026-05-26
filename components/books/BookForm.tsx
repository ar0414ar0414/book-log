"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search, BookOpen, Star, X, ScanBarcode } from "lucide-react";
import AutoResizeTextarea from "@/components/ui/AutoResizeTextarea";
import { cn } from "@/lib/utils";
import type { GoogleBookInfo } from "@/lib/google-books/search";
import dynamic from "next/dynamic";

const BarcodeScanner = dynamic(
  () => import("@/components/books/BarcodeScanner"),
  { ssr: false }
);

const STATUS_OPTIONS = [
  { value: "want", label: "積読" },
  { value: "reading", label: "読中" },
  { value: "done", label: "読了" },
];

const inputCls = "mt-1 w-full border border-slate-200 dark:border-slate-600 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-indigo-400 dark:focus:border-indigo-500 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500";

export default function BookForm() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<GoogleBookInfo[]>([]);
  const [searching, setSearching] = useState(false);
  const [saving, setSaving] = useState(false);
  const [scannerOpen, setScannerOpen] = useState(false);
  const [form, setForm] = useState({
    title: "",
    author: "",
    isbn: "",
    coverUrl: "",
    publisher: "",
    publishedDate: "",
    genre: "",
    description: "",
    pageCount: "",
    status: "want",
    rating: 0,
    memo: "",
    startedAt: "",
    finishedAt: "",
  });

  async function handleSearch() {
    if (!query.trim()) return;
    setSearching(true);
    try {
      const res = await fetch(`/api/books/search?q=${encodeURIComponent(query)}`);
      const data = await res.json();
      setResults(data);
    } finally {
      setSearching(false);
    }
  }

  async function handleBarcodeDetected(isbn: string) {
    setScannerOpen(false);
    setSearching(true);
    try {
      const res = await fetch(`/api/books/search?q=${encodeURIComponent(`isbn:${isbn}`)}`);
      const data: GoogleBookInfo[] = await res.json();
      if (data.length > 0) {
        selectBook(data[0]);
      } else {
        setResults([]);
        alert("書籍情報が見つかりませんでした");
      }
    } finally {
      setSearching(false);
    }
  }

  function selectBook(book: GoogleBookInfo) {
    setForm((f) => ({
      ...f,
      title: book.title,
      author: book.author,
      isbn: book.isbn,
      coverUrl: book.coverUrl,
      publisher: book.publisher,
      publishedDate: book.publishedDate,
      genre: book.genre,
      description: book.description,
      pageCount: book.pageCount?.toString() ?? "",
    }));
    setResults([]);
    setQuery("");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/books", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          pageCount: form.pageCount ? parseInt(form.pageCount) : null,
          startedAt: form.startedAt || null,
          finishedAt: form.finishedAt || null,
        }),
      });
      if (res.ok) {
        const book = await res.json();
        router.push(`/books/${book.id}`);
      }
    } finally {
      setSaving(false);
    }
  }

  const bookSelected = !!form.title;

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* 本の取得 — スキャン優先 */}
      {!bookSelected && (
        <div className="space-y-3">
          {/* バーコードスキャン（主役） */}
          <button
            type="button"
            onClick={() => setScannerOpen(true)}
            disabled={searching}
            className="w-full flex items-center justify-center gap-3 py-4 bg-indigo-600 dark:bg-indigo-500 text-white rounded-2xl text-base font-semibold hover:bg-indigo-700 dark:hover:bg-indigo-600 active:scale-95 transition-all shadow-md shadow-indigo-200 dark:shadow-none disabled:opacity-50"
          >
            <ScanBarcode className="w-5 h-5" />
            バーコードをスキャン
          </button>

          {/* または区切り */}
          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-slate-200 dark:bg-slate-700" />
            <span className="text-xs text-slate-400 dark:text-slate-500 font-medium">または</span>
            <div className="flex-1 h-px bg-slate-200 dark:bg-slate-700" />
          </div>

          {/* テキスト検索（サブ） */}
          <div className="space-y-2">
            <div className="flex gap-2">
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleSearch())}
                placeholder="タイトル・著者名で検索..."
                className={cn(inputCls, "mt-0")}
              />
              <button
                type="button"
                onClick={handleSearch}
                disabled={searching}
                className="px-4 py-2.5 bg-slate-100 dark:bg-slate-700 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors flex-shrink-0"
              >
                <Search className="w-4 h-4 text-slate-600 dark:text-slate-400" />
              </button>
            </div>

            {results.length > 0 && (
              <div className="border border-slate-200 dark:border-slate-600 rounded-xl overflow-hidden bg-white dark:bg-slate-800 shadow-sm">
                {results.map((book, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => selectBook(book)}
                    className="w-full flex items-center gap-3 p-3 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 transition-colors border-b border-slate-100 dark:border-slate-700 last:border-0 text-left"
                  >
                    {book.coverUrl ? (
                      <img src={book.coverUrl} alt={book.title} className="w-10 h-14 object-cover rounded" />
                    ) : (
                      <div className="w-10 h-14 bg-indigo-50 dark:bg-indigo-950 rounded flex items-center justify-center flex-shrink-0">
                        <BookOpen className="w-5 h-5 text-indigo-300 dark:text-indigo-600" />
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="font-medium text-slate-900 dark:text-slate-100 text-sm truncate">{book.title}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{book.author}</p>
                      <p className="text-xs text-slate-400 dark:text-slate-500">{book.publishedDate}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {bookSelected && (
        <div className="flex items-center gap-3">
          <div className="flex-1 h-px bg-slate-100 dark:bg-slate-700" />
          <button
            type="button"
            onClick={() => { setForm((f) => ({ ...f, title: "", author: "", isbn: "", coverUrl: "", publisher: "", publishedDate: "", genre: "", description: "", pageCount: "" })); setResults([]); setQuery(""); }}
            className="text-xs text-slate-400 dark:text-slate-500 hover:text-indigo-500 dark:hover:text-indigo-400 transition-colors flex items-center gap-1"
          >
            <X className="w-3 h-3" />
            別の本を選び直す
          </button>
          <div className="flex-1 h-px bg-slate-100 dark:bg-slate-700" />
        </div>
      )}

      {form.coverUrl && (
        <div className="flex items-start gap-4">
          <img src={form.coverUrl} alt={form.title} className="w-16 h-22 object-cover rounded-lg shadow" />
          <button
            type="button"
            onClick={() => setForm((f) => ({ ...f, coverUrl: "" }))}
            className="text-xs text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      <div className="space-y-4">
        <div>
          <label className="text-sm font-medium text-slate-700 dark:text-slate-300">タイトル *</label>
          <input
            required
            value={form.title}
            onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
            className={inputCls}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">著者</label>
            <input
              value={form.author}
              onChange={(e) => setForm((f) => ({ ...f, author: e.target.value }))}
              className={inputCls}
            />
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">ページ数</label>
            <input
              type="number"
              min={1}
              value={form.pageCount}
              onChange={(e) => setForm((f) => ({ ...f, pageCount: e.target.value }))}
              placeholder="例: 320"
              className={inputCls}
            />
          </div>
        </div>

        <div>
          <label className="text-sm font-medium text-slate-700 dark:text-slate-300">ステータス</label>
          <div className="mt-1 flex gap-2">
            {STATUS_OPTIONS.map(({ value, label }) => (
              <button
                key={value}
                type="button"
                onClick={() => setForm((f) => ({ ...f, status: value }))}
                className={cn(
                  "flex-1 py-2 rounded-xl text-sm font-medium border transition-colors",
                  form.status === value
                    ? "bg-indigo-600 dark:bg-indigo-500 text-white border-indigo-600 dark:border-indigo-500"
                    : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-600 hover:border-indigo-300 dark:hover:border-indigo-600"
                )}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {(form.status === "reading" || form.status === "done") && (
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">読み始め</label>
              <input
                type="date"
                value={form.startedAt}
                onChange={(e) => setForm((f) => ({ ...f, startedAt: e.target.value }))}
                className={inputCls}
              />
            </div>
            {form.status === "done" && (
              <div>
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">読了日</label>
                <input
                  type="date"
                  value={form.finishedAt}
                  onChange={(e) => setForm((f) => ({ ...f, finishedAt: e.target.value }))}
                  className={inputCls}
                />
              </div>
            )}
          </div>
        )}

        <div>
          <label className="text-sm font-medium text-slate-700 dark:text-slate-300">評価</label>
          <div className="mt-1 flex gap-1">
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setForm((f) => ({ ...f, rating: n === f.rating ? 0 : n }))}
                className="p-1"
              >
                <Star
                  className={cn(
                    "w-6 h-6 transition-colors",
                    n <= form.rating ? "fill-amber-400 text-amber-400" : "text-slate-200 dark:text-slate-700"
                  )}
                />
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="text-sm font-medium text-slate-700 dark:text-slate-300">メモ</label>
          <AutoResizeTextarea
            value={form.memo}
            onChange={(e) => setForm((f) => ({ ...f, memo: e.target.value }))}
            rows={3}
            placeholder="感想・メモを自由に..."
            className={inputCls}
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={saving || !form.title}
        className="w-full bg-indigo-600 dark:bg-indigo-500 text-white py-3 rounded-xl font-medium hover:bg-indigo-700 dark:hover:bg-indigo-600 transition-colors disabled:opacity-50"
      >
        {saving ? "保存中..." : "登録する"}
      </button>

      {searching && (
        <p className="text-center text-sm text-slate-400 dark:text-slate-500 animate-pulse">書籍情報を検索中...</p>
      )}

      {scannerOpen && (
        <BarcodeScanner
          onDetected={handleBarcodeDetected}
          onClose={() => setScannerOpen(false)}
        />
      )}
    </form>
  );
}
