"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Quote, Star, BookOpen, Search, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface QuoteItem {
  quote: {
    id: string; text: string; pageNumber: number | null; chapter: string | null;
    memo: string | null; isFavorite: boolean; createdAt: Date;
  };
  book: { id: string; title: string; coverUrl: string | null };
  tags: { id: string; name: string; color: string }[];
}

export default function QuotesView({ items }: { items: QuoteItem[] }) {
  const [favOnly, setFavOnly] = useState(false);
  const [selectedBook, setSelectedBook] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);

  const books = useMemo(() => {
    const map = new Map<string, { id: string; title: string; coverUrl: string | null }>();
    items.forEach(({ book }) => map.set(book.id, book));
    return [...map.values()].sort((a, b) => a.title.localeCompare(b.title, "ja"));
  }, [items]);

  const filtered = useMemo(() => {
    let result = [...items].reverse();
    if (favOnly) result = result.filter((i) => i.quote.isFavorite);
    if (selectedBook) result = result.filter((i) => i.book.id === selectedBook);
    if (query.trim()) {
      const q = query.trim().toLowerCase();
      result = result.filter(
        (i) =>
          i.quote.text.toLowerCase().includes(q) ||
          (i.quote.memo ?? "").toLowerCase().includes(q)
      );
    }
    return result;
  }, [items, favOnly, selectedBook, query]);

  const hasFilter = favOnly || selectedBook !== null || query.trim() !== "";

  return (
    <div className="pb-nav-safe sm:pb-6 space-y-4">
      {/* ヘッダー */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-slate-900">引用一覧</h1>
        <span className="text-sm text-slate-500">{items.length}件</span>
      </div>

      {/* コントロールバー */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          {/* 検索 */}
          {searchOpen ? (
            <>
              <div className="flex-1 flex items-center gap-2 bg-white border border-indigo-300 rounded-full px-3.5 py-2 shadow-sm">
                <Search className="w-4 h-4 text-indigo-400 flex-shrink-0" />
                <input
                  autoFocus
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="引用・メモを検索..."
                  className="flex-1 text-sm bg-transparent focus:outline-none text-slate-700 placeholder:text-slate-400"
                />
                {query && (
                  <button onClick={() => setQuery("")} className="text-slate-300 hover:text-slate-500 transition-colors">
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
              <button
                onClick={() => { setSearchOpen(false); setQuery(""); }}
                className="text-sm text-slate-500 hover:text-slate-700 whitespace-nowrap px-1"
              >
                キャンセル
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => setSearchOpen(true)}
                className="w-9 h-9 flex items-center justify-center rounded-full bg-white border border-slate-200 text-slate-500 hover:border-indigo-300 hover:text-indigo-500 transition-colors shadow-sm flex-shrink-0"
              >
                <Search className="w-4 h-4" />
              </button>

              {/* お気に入りトグル */}
              <button
                onClick={() => setFavOnly((v) => !v)}
                className={cn(
                  "flex items-center gap-1.5 px-3.5 py-2 rounded-full text-sm font-medium border transition-colors shadow-sm",
                  favOnly
                    ? "bg-amber-500 border-amber-500 text-white"
                    : "bg-white border-slate-200 text-slate-500 hover:border-amber-300 hover:text-amber-500"
                )}
              >
                <Star className={cn("w-3.5 h-3.5", favOnly && "fill-white")} />
                お気に入り
              </button>

              {/* リセット */}
              {hasFilter && (
                <button
                  onClick={() => { setFavOnly(false); setSelectedBook(null); setQuery(""); }}
                  className="ml-auto flex items-center gap-1 text-xs text-slate-400 hover:text-slate-600 transition-colors"
                >
                  <X className="w-3 h-3" />
                  解除
                </button>
              )}
            </>
          )}
        </div>

        {/* 本フィルター */}
        {!searchOpen && books.length > 1 && (
          <div className="flex gap-1.5 overflow-x-auto pb-0.5 scrollbar-hide">
            {books.map((book) => (
              <button
                key={book.id}
                onClick={() => setSelectedBook((v) => v === book.id ? null : book.id)}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border whitespace-nowrap transition-colors flex-shrink-0",
                  selectedBook === book.id
                    ? "bg-indigo-600 border-indigo-600 text-white"
                    : "bg-white border-slate-200 text-slate-600 hover:border-indigo-300"
                )}
              >
                {book.coverUrl ? (
                  <img src={book.coverUrl} alt="" className="w-4 h-5 object-cover rounded-sm flex-shrink-0" />
                ) : (
                  <BookOpen className="w-3.5 h-3.5 flex-shrink-0" />
                )}
                <span className="max-w-[120px] truncate">{book.title}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ヒット件数 */}
      {hasFilter && (
        <p className="text-xs text-slate-400">{filtered.length} 件ヒット</p>
      )}

      {/* 引用リスト */}
      {items.length === 0 ? (
        <div className="text-center py-16">
          <Quote className="w-12 h-12 text-slate-200 mx-auto mb-3" />
          <p className="text-slate-500">引用がまだありません</p>
          <p className="text-sm text-slate-400 mt-1">本の詳細ページから引用を追加できます</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12">
          <Quote className="w-10 h-10 text-slate-200 mx-auto mb-2" />
          <p className="text-slate-400 text-sm">該当する引用が見つかりません</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(({ quote, book, tags }) => (
            <div
              key={quote.id}
              className={cn(
                "bg-white rounded-xl border p-4 space-y-3 border-l-4",
                quote.isFavorite ? "border-l-amber-400 border-amber-100" : "border-l-indigo-200 border-slate-100"
              )}
            >
              <p className="text-slate-800 leading-relaxed">「{quote.text}」</p>
              <div className="flex items-center justify-between">
                <Link href={`/books/${book.id}`} className="flex items-center gap-2 hover:opacity-70 transition-opacity">
                  {book.coverUrl ? (
                    <img src={book.coverUrl} alt={book.title} className="w-6 h-8 object-cover rounded" />
                  ) : (
                    <BookOpen className="w-4 h-4 text-indigo-300" />
                  )}
                  <span className="text-sm text-slate-500 truncate max-w-[200px]">{book.title}</span>
                </Link>
                <div className="flex items-center gap-1 text-xs text-slate-400">
                  {quote.pageNumber && <span>p.{quote.pageNumber}</span>}
                  {quote.isFavorite && <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />}
                </div>
              </div>
              {tags.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {tags.map((tag) => (
                    <span key={tag.id} className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ backgroundColor: `${tag.color}20`, color: tag.color }}>
                      {tag.name}
                    </span>
                  ))}
                </div>
              )}
              {quote.memo && (
                <p className="text-xs text-slate-500 bg-slate-50 rounded-lg px-3 py-2">{quote.memo}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
