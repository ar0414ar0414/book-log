"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Quote, Star, BookOpen, Search, X, Share2, Loader2, Check } from "lucide-react";
import ReactMarkdown from "react-markdown";
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
  const [sharingId, setSharingId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  function stripMd(text: string): string {
    return text
      .replace(/\*\*(.*?)\*\*/g, "$1")
      .replace(/\*(.*?)\*/g, "$1")
      .replace(/^#{1,6}\s+/gm, "")
      .replace(/^[-*+]\s/gm, "・")
      .replace(/\n{3,}/g, "\n\n")
      .trim();
  }

  async function handleShare(quote: QuoteItem["quote"], book: QuoteItem["book"]) {
    if (sharingId) return;
    setSharingId(quote.id);
    const text = `${stripMd(quote.text)}\n\n── 『${book.title}』`;
    try {
      if (navigator.share) {
        await navigator.share({ text, title: `引用 — ${book.title}` });
      } else {
        await navigator.clipboard.writeText(text);
        setCopiedId(quote.id);
        setTimeout(() => setCopiedId(null), 2000);
      }
    } catch {
      // share cancelled or clipboard unavailable — no-op
    } finally {
      setSharingId(null);
    }
  }

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
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">引用一覧</h1>
        <span className="text-sm text-slate-500 dark:text-slate-400">{items.length}件</span>
      </div>

      <div className="space-y-2">
        <div className="flex items-center gap-2">
          {searchOpen ? (
            <>
              <div className="flex-1 flex items-center gap-2 bg-white dark:bg-slate-800 border border-indigo-300 dark:border-indigo-600 rounded-full px-3.5 py-2 shadow-sm">
                <Search className="w-4 h-4 text-indigo-400 flex-shrink-0" />
                <input
                  autoFocus
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="引用・メモを検索..."
                  className="flex-1 text-sm bg-transparent focus:outline-none text-slate-700 dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-slate-500"
                />
                {query && (
                  <button onClick={() => setQuery("")} className="text-slate-300 dark:text-slate-600 hover:text-slate-500 dark:hover:text-slate-400 transition-colors">
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
              <button
                onClick={() => { setSearchOpen(false); setQuery(""); }}
                className="text-sm text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 whitespace-nowrap px-1"
              >
                キャンセル
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => setSearchOpen(true)}
                className="w-9 h-9 flex items-center justify-center rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 text-slate-500 dark:text-slate-400 hover:border-indigo-300 dark:hover:border-indigo-600 hover:text-indigo-500 dark:hover:text-indigo-400 transition-colors shadow-sm flex-shrink-0"
              >
                <Search className="w-4 h-4" />
              </button>

              <button
                onClick={() => setFavOnly((v) => !v)}
                className={cn(
                  "flex items-center gap-1.5 px-3.5 py-2 rounded-full text-sm font-medium border transition-colors shadow-sm",
                  favOnly
                    ? "bg-amber-500 border-amber-500 text-white"
                    : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-600 text-slate-500 dark:text-slate-400 hover:border-amber-300 hover:text-amber-500 dark:hover:border-amber-600 dark:hover:text-amber-400"
                )}
              >
                <Star className={cn("w-3.5 h-3.5", favOnly && "fill-white")} />
                お気に入り
              </button>

              {hasFilter && (
                <button
                  onClick={() => { setFavOnly(false); setSelectedBook(null); setQuery(""); }}
                  className="ml-auto flex items-center gap-1 text-xs text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                >
                  <X className="w-3 h-3" />
                  解除
                </button>
              )}
            </>
          )}
        </div>

        {!searchOpen && books.length > 1 && (
          <div className="flex gap-1.5 overflow-x-auto pb-0.5 scrollbar-hide">
            {books.map((book) => (
              <button
                key={book.id}
                onClick={() => setSelectedBook((v) => v === book.id ? null : book.id)}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border whitespace-nowrap transition-colors flex-shrink-0",
                  selectedBook === book.id
                    ? "bg-indigo-600 dark:bg-indigo-500 border-indigo-600 dark:border-indigo-500 text-white"
                    : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-400 hover:border-indigo-300 dark:hover:border-indigo-600"
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

      {hasFilter && (
        <p className="text-xs text-slate-400 dark:text-slate-500">{filtered.length} 件ヒット</p>
      )}

      {items.length === 0 ? (
        <div className="text-center py-16">
          <Quote className="w-12 h-12 text-slate-200 dark:text-slate-700 mx-auto mb-3" />
          <p className="text-slate-500 dark:text-slate-400">引用がまだありません</p>
          <p className="text-sm text-slate-400 dark:text-slate-500 mt-1">本の詳細ページから引用を追加できます</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12">
          <Quote className="w-10 h-10 text-slate-200 dark:text-slate-700 mx-auto mb-2" />
          <p className="text-slate-400 dark:text-slate-500 text-sm">該当する引用が見つかりません</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(({ quote, book, tags }) => (
            <div
              key={quote.id}
              className={cn(
                "bg-white dark:bg-slate-800 rounded-xl border p-4 space-y-3 border-l-4",
                quote.isFavorite
                  ? "border-l-amber-400 border-amber-100 dark:border-amber-800"
                  : "border-l-indigo-200 dark:border-l-indigo-700 border-slate-100 dark:border-slate-700"
              )}
            >
              <div className="text-slate-800 dark:text-slate-200 text-sm leading-relaxed prose prose-sm dark:prose-invert max-w-none prose-p:my-0.5 prose-headings:my-1 prose-ul:my-0.5 prose-ol:my-0.5 prose-li:my-0">
                <ReactMarkdown
                  components={{
                    p: ({ children }) => <p className="leading-relaxed">{children}</p>,
                    h1: ({ children }) => <p className="font-bold text-base">{children}</p>,
                    h2: ({ children }) => <p className="font-bold">{children}</p>,
                    h3: ({ children }) => <p className="font-semibold">{children}</p>,
                    ul: ({ children }) => <ul className="list-disc list-inside space-y-0.5">{children}</ul>,
                    ol: ({ children }) => <ol className="list-decimal list-inside space-y-0.5">{children}</ol>,
                    strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
                    hr: () => <hr className="my-1 border-slate-200 dark:border-slate-600" />,
                  }}
                >{quote.text}</ReactMarkdown>
              </div>
              <div className="flex items-center justify-between">
                <Link href={`/books/${book.id}`} className="flex items-center gap-2 hover:opacity-70 transition-opacity min-w-0 flex-1 mr-2">
                  {book.coverUrl ? (
                    <img src={book.coverUrl} alt={book.title} className="w-6 h-8 object-cover rounded flex-shrink-0" />
                  ) : (
                    <BookOpen className="w-4 h-4 text-indigo-300 dark:text-indigo-600 flex-shrink-0" />
                  )}
                  <span className="text-sm text-slate-500 dark:text-slate-400 truncate">{book.title}</span>
                </Link>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {quote.pageNumber && <span className="text-xs text-slate-400 dark:text-slate-500">p.{quote.pageNumber}</span>}
                  {quote.isFavorite && <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />}
                  <button
                    onClick={() => handleShare(quote, book)}
                    disabled={sharingId === quote.id}
                    className="p-1.5 rounded-lg text-slate-300 dark:text-slate-600 hover:text-indigo-500 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 transition-colors disabled:opacity-50"
                    title={copiedId === quote.id ? "コピーしました" : "シェア"}
                  >
                    {sharingId === quote.id
                      ? <Loader2 className="w-4 h-4 animate-spin" />
                      : copiedId === quote.id
                      ? <Check className="w-4 h-4 text-emerald-500" />
                      : <Share2 className="w-4 h-4" />
                    }
                  </button>
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
                <p className="text-xs text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-700 rounded-lg px-3 py-2">{quote.memo}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
