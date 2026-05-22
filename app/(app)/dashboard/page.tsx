import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { books, quotes } from "@/db/schema";
import { eq, and, count } from "drizzle-orm";
import Link from "next/link";
import { BookOpen, Quote, Star, Plus } from "lucide-react";
import { STATUS_LABELS, STATUS_COLORS, cn } from "@/lib/utils";
import type { BookStatus } from "@/types";

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const [allBooks, allQuotes] = await Promise.all([
    db.select().from(books).where(eq(books.userId, user.id)).orderBy(books.updatedAt),
    db.select().from(quotes).where(eq(quotes.userId, user.id)).orderBy(quotes.createdAt),
  ]);

  const statusCount = {
    want: allBooks.filter((b) => b.status === "want").length,
    reading: allBooks.filter((b) => b.status === "reading").length,
    done: allBooks.filter((b) => b.status === "done").length,
  };

  const recentBooks = allBooks.slice(-4).reverse();
  const favoriteQuotes = allQuotes.filter((q) => q.isFavorite).slice(-3).reverse();

  return (
    <div className="pb-20 sm:pb-6 space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900">
          {user.user_metadata?.name ?? "ようこそ"}さんの本棚
        </h1>
        <p className="text-sm text-slate-500 mt-0.5">読書の記録を振り返ろう</p>
      </div>

      {/* stats */}
      <div className="grid grid-cols-3 gap-3">
        {(["want", "reading", "done"] as BookStatus[]).map((status) => (
          <Link
            key={status}
            href={`/books?status=${status}`}
            className="bg-white rounded-xl p-4 border border-slate-100 flex flex-col gap-1 hover:border-indigo-200 transition-colors"
          >
            <span className={cn("text-xs font-medium px-2 py-0.5 rounded-full w-fit", STATUS_COLORS[status])}>
              {STATUS_LABELS[status]}
            </span>
            <span className="text-2xl font-bold text-slate-900">{statusCount[status]}</span>
            <span className="text-xs text-slate-400">冊</span>
          </Link>
        ))}
      </div>

      {/* quick actions */}
      <div className="flex gap-3">
        <Link
          href="/books/new"
          className="flex-1 flex items-center justify-center gap-2 bg-indigo-600 text-white py-3 rounded-xl font-medium hover:bg-indigo-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          本を登録
        </Link>
        <Link
          href="/quotes"
          className="flex-1 flex items-center justify-center gap-2 bg-white border border-slate-200 text-slate-700 py-3 rounded-xl font-medium hover:bg-slate-50 transition-colors"
        >
          <Quote className="w-4 h-4" />
          引用を見る
        </Link>
      </div>

      {/* recent books */}
      {recentBooks.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-slate-800 flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-indigo-500" />
              最近の本
            </h2>
            <Link href="/books" className="text-sm text-indigo-600 hover:underline">すべて見る</Link>
          </div>
          <div className="space-y-2">
            {recentBooks.map((book) => (
              <Link
                key={book.id}
                href={`/books/${book.id}`}
                className="flex items-center gap-3 bg-white rounded-xl p-3 border border-slate-100 hover:border-indigo-200 transition-colors"
              >
                {book.coverUrl ? (
                  <img src={book.coverUrl} alt={book.title} className="w-10 h-14 object-cover rounded" />
                ) : (
                  <div className="w-10 h-14 bg-indigo-50 rounded flex items-center justify-center">
                    <BookOpen className="w-5 h-5 text-indigo-300" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-slate-900 truncate">{book.title}</p>
                  <p className="text-sm text-slate-500 truncate">{book.author ?? "著者不明"}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={cn("text-xs px-2 py-0.5 rounded-full", STATUS_COLORS[book.status as BookStatus])}>
                      {STATUS_LABELS[book.status]}
                    </span>
                    {book.rating && (
                      <span className="flex items-center gap-0.5 text-xs text-amber-500">
                        <Star className="w-3 h-3 fill-current" />
                        {book.rating}
                      </span>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* favorite quotes */}
      {favoriteQuotes.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-slate-800 flex items-center gap-2">
              <Star className="w-4 h-4 text-amber-500" />
              お気に入りの引用
            </h2>
            <Link href="/quotes" className="text-sm text-indigo-600 hover:underline">すべて見る</Link>
          </div>
          <div className="space-y-2">
            {favoriteQuotes.map((quote) => (
              <div key={quote.id} className="bg-white rounded-xl p-4 border border-slate-100 border-l-4 border-l-amber-400">
                <p className="text-slate-700 text-sm leading-relaxed line-clamp-3">「{quote.text}」</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {allBooks.length === 0 && (
        <div className="text-center py-16">
          <BookOpen className="w-12 h-12 text-slate-200 mx-auto mb-3" />
          <p className="text-slate-500 font-medium">まだ本が登録されていません</p>
          <p className="text-sm text-slate-400 mt-1">最初の1冊を登録してみましょう</p>
          <Link
            href="/books/new"
            className="inline-flex items-center gap-2 mt-4 bg-indigo-600 text-white px-5 py-2.5 rounded-xl font-medium hover:bg-indigo-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            本を登録する
          </Link>
        </div>
      )}
    </div>
  );
}
