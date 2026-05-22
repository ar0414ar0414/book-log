import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { books } from "@/db/schema";
import { eq } from "drizzle-orm";
import Link from "next/link";
import { BookOpen, Plus, Star } from "lucide-react";
import { STATUS_LABELS, STATUS_COLORS, cn } from "@/lib/utils";
import type { BookStatus } from "@/types";

export default async function BooksPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status } = await searchParams;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const allBooks = await db.select().from(books).where(eq(books.userId, user.id)).orderBy(books.updatedAt);
  const filtered = status ? allBooks.filter((b) => b.status === status) : allBooks;

  return (
    <div className="pb-20 sm:pb-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-slate-900">本棚</h1>
        <Link
          href="/books/new"
          className="flex items-center gap-1.5 bg-indigo-600 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-indigo-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          追加
        </Link>
      </div>

      {/* filter tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
        {[undefined, "want", "reading", "done"].map((s) => (
          <Link
            key={s ?? "all"}
            href={s ? `/books?status=${s}` : "/books"}
            className={cn(
              "flex-shrink-0 px-4 py-1.5 rounded-full text-sm font-medium border transition-colors",
              (!status && !s) || status === s
                ? "bg-indigo-600 text-white border-indigo-600"
                : "bg-white text-slate-600 border-slate-200 hover:border-indigo-300"
            )}
          >
            {s ? STATUS_LABELS[s] : "すべて"}
            <span className="ml-1.5 text-xs opacity-70">
              {s ? allBooks.filter((b) => b.status === s).length : allBooks.length}
            </span>
          </Link>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-16">
          <BookOpen className="w-12 h-12 text-slate-200 mx-auto mb-3" />
          <p className="text-slate-500">本がありません</p>
          <Link href="/books/new" className="inline-flex items-center gap-2 mt-4 text-indigo-600 hover:underline text-sm">
            <Plus className="w-4 h-4" />
            本を追加する
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {[...filtered].reverse().map((book) => (
            <Link
              key={book.id}
              href={`/books/${book.id}`}
              className="bg-white rounded-xl border border-slate-100 overflow-hidden hover:border-indigo-200 transition-colors flex flex-col"
            >
              <div className="aspect-[2/3] bg-indigo-50 relative">
                {book.coverUrl ? (
                  <img src={book.coverUrl} alt={book.title} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <BookOpen className="w-10 h-10 text-indigo-200" />
                  </div>
                )}
                <span className={cn(
                  "absolute top-2 left-2 text-xs px-2 py-0.5 rounded-full font-medium",
                  STATUS_COLORS[book.status as BookStatus]
                )}>
                  {STATUS_LABELS[book.status]}
                </span>
              </div>
              <div className="p-3 flex-1 flex flex-col gap-1">
                <p className="font-medium text-slate-900 text-sm leading-tight line-clamp-2">{book.title}</p>
                <p className="text-xs text-slate-500 truncate">{book.author ?? "著者不明"}</p>
                {book.rating && (
                  <div className="flex items-center gap-0.5 text-amber-500 mt-auto">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className={cn("w-3 h-3", i < book.rating! ? "fill-current" : "text-slate-200")}
                      />
                    ))}
                  </div>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
