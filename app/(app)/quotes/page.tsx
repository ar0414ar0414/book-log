import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { quotes, books } from "@/db/schema";
import { eq } from "drizzle-orm";
import Link from "next/link";
import { Quote, Star, BookOpen } from "lucide-react";
import { cn } from "@/lib/utils";

export default async function QuotesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const allQuotes = await db
    .select({ quote: quotes, book: { id: books.id, title: books.title, coverUrl: books.coverUrl } })
    .from(quotes)
    .innerJoin(books, eq(quotes.bookId, books.id))
    .where(eq(quotes.userId, user.id))
    .orderBy(quotes.createdAt);

  const reversed = [...allQuotes].reverse();

  return (
    <div className="pb-20 sm:pb-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-slate-900">引用一覧</h1>
        <span className="text-sm text-slate-500">{allQuotes.length}件</span>
      </div>

      {allQuotes.length === 0 ? (
        <div className="text-center py-16">
          <Quote className="w-12 h-12 text-slate-200 mx-auto mb-3" />
          <p className="text-slate-500">引用がまだありません</p>
          <p className="text-sm text-slate-400 mt-1">本の詳細ページから引用を追加できます</p>
        </div>
      ) : (
        <div className="space-y-3">
          {reversed.map(({ quote, book }) => (
            <div key={quote.id} className={cn(
              "bg-white rounded-xl border p-4 space-y-3 border-l-4",
              quote.isFavorite ? "border-l-amber-400 border-amber-100" : "border-l-indigo-200 border-slate-100"
            )}>
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
              {quote.memo && <p className="text-xs text-slate-500 bg-slate-50 rounded-lg px-3 py-2">{quote.memo}</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
