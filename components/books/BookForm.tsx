"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search, BookOpen, Star, X, ScanBarcode } from "lucide-react";
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

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Google Books search */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-slate-700">書籍を検索して自動入力</label>
        <div className="flex gap-2">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleSearch())}
            placeholder="タイトル・著者名で検索..."
            className="flex-1 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-indigo-400"
          />
          <button
            type="button"
            onClick={handleSearch}
            disabled={searching}
            className="px-4 py-2.5 bg-slate-100 rounded-xl hover:bg-slate-200 transition-colors"
          >
            <Search className="w-4 h-4 text-slate-600" />
          </button>
        </div>

        {/* バーコードスキャン（モバイルのみ） */}
        <button
          type="button"
          onClick={() => setScannerOpen(true)}
          disabled={searching}
          className="sm:hidden w-full flex items-center justify-center gap-2 py-2.5 border border-indigo-200 text-indigo-600 bg-indigo-50 rounded-xl text-sm font-medium hover:bg-indigo-100 transition-colors"
        >
          <ScanBarcode className="w-4 h-4" />
          バーコードでスキャン
        </button>

        {results.length > 0 && (
          <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-sm">
            {results.map((book, i) => (
              <button
                key={i}
                type="button"
                onClick={() => selectBook(book)}
                className="w-full flex items-center gap-3 p-3 hover:bg-indigo-50 transition-colors border-b border-slate-100 last:border-0 text-left"
              >
                {book.coverUrl ? (
                  <img src={book.coverUrl} alt={book.title} className="w-10 h-14 object-cover rounded" />
                ) : (
                  <div className="w-10 h-14 bg-indigo-50 rounded flex items-center justify-center flex-shrink-0">
                    <BookOpen className="w-5 h-5 text-indigo-300" />
                  </div>
                )}
                <div className="min-w-0">
                  <p className="font-medium text-slate-900 text-sm truncate">{book.title}</p>
                  <p className="text-xs text-slate-500 truncate">{book.author}</p>
                  <p className="text-xs text-slate-400">{book.publishedDate}</p>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="border-t border-slate-100" />

      {/* cover preview */}
      {form.coverUrl && (
        <div className="flex items-start gap-4">
          <img src={form.coverUrl} alt={form.title} className="w-16 h-22 object-cover rounded-lg shadow" />
          <button
            type="button"
            onClick={() => setForm((f) => ({ ...f, coverUrl: "" }))}
            className="text-xs text-slate-400 hover:text-slate-600"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      <div className="space-y-4">
        <div>
          <label className="text-sm font-medium text-slate-700">タイトル *</label>
          <input
            required
            value={form.title}
            onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
            className="mt-1 w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-indigo-400"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-sm font-medium text-slate-700">著者</label>
            <input
              value={form.author}
              onChange={(e) => setForm((f) => ({ ...f, author: e.target.value }))}
              className="mt-1 w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-indigo-400"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700">ページ数</label>
            <input
              type="number"
              min={1}
              value={form.pageCount}
              onChange={(e) => setForm((f) => ({ ...f, pageCount: e.target.value }))}
              placeholder="例: 320"
              className="mt-1 w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-indigo-400"
            />
          </div>
        </div>

        <div>
          <label className="text-sm font-medium text-slate-700">ステータス</label>
          <div className="mt-1 flex gap-2">
            {STATUS_OPTIONS.map(({ value, label }) => (
              <button
                key={value}
                type="button"
                onClick={() => setForm((f) => ({ ...f, status: value }))}
                className={cn(
                  "flex-1 py-2 rounded-xl text-sm font-medium border transition-colors",
                  form.status === value
                    ? "bg-indigo-600 text-white border-indigo-600"
                    : "bg-white text-slate-600 border-slate-200 hover:border-indigo-300"
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
              <label className="text-sm font-medium text-slate-700">読み始め</label>
              <input
                type="date"
                value={form.startedAt}
                onChange={(e) => setForm((f) => ({ ...f, startedAt: e.target.value }))}
                className="mt-1 w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-indigo-400"
              />
            </div>
            {form.status === "done" && (
              <div>
                <label className="text-sm font-medium text-slate-700">読了日</label>
                <input
                  type="date"
                  value={form.finishedAt}
                  onChange={(e) => setForm((f) => ({ ...f, finishedAt: e.target.value }))}
                  className="mt-1 w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-indigo-400"
                />
              </div>
            )}
          </div>
        )}

        <div>
          <label className="text-sm font-medium text-slate-700">評価</label>
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
                    n <= form.rating ? "fill-amber-400 text-amber-400" : "text-slate-200"
                  )}
                />
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="text-sm font-medium text-slate-700">メモ</label>
          <textarea
            value={form.memo}
            onChange={(e) => setForm((f) => ({ ...f, memo: e.target.value }))}
            rows={3}
            placeholder="感想・メモを自由に..."
            className="mt-1 w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-indigo-400 resize-none"
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={saving || !form.title}
        className="w-full bg-indigo-600 text-white py-3 rounded-xl font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50"
      >
        {saving ? "保存中..." : "登録する"}
      </button>

      {searching && (
        <p className="text-center text-sm text-slate-400 animate-pulse">書籍情報を検索中...</p>
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
