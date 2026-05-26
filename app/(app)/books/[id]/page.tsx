import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { books, quotes, photos, aiConversations, tags, quoteTags } from "@/db/schema";
import { eq, and, inArray, desc } from "drizzle-orm";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, BookOpen, Loader2 } from "lucide-react";
import { STATUS_LABELS, STATUS_COLORS, cn } from "@/lib/utils";
import type { BookStatus } from "@/types";
import BookDetail from "@/components/books/BookDetail";

type BookRow = {
  id: string; title: string; author: string | null; coverUrl: string | null;
  genre: string | null; status: string; rating: number | null; memo: string | null;
  preMemo: string | null; postMemo: string | null; aiRecord: string | null; aiSummary: string | null;
  currentPage: number | null; pageCount: number | null;
  startedAt: Date | null; finishedAt: Date | null; updatedAt: Date;
  publisher: string | null; publishedDate: string | null; description: string | null;
  [key: string]: unknown;
};

// タブデータ（重い）を取得して BookDetail をレンダリング
async function BookDetailData({ bookId, userId, book }: { bookId: string; userId: string; book: BookRow }) {
  type TagItem = { id: string; name: string; color: string };

  const [allBooks, [bookQuotes, bookPhotos, chatHistory, userTags]] = await Promise.all([
    db.select({ id: books.id }).from(books).where(eq(books.userId, userId)).orderBy(desc(books.updatedAt)),
    Promise.all([
      db.select().from(quotes).where(and(eq(quotes.bookId, bookId), eq(quotes.userId, userId))).orderBy(quotes.createdAt),
      db.select().from(photos).where(and(eq(photos.bookId, bookId), eq(photos.userId, userId))).orderBy(photos.createdAt),
      db.select().from(aiConversations).where(and(eq(aiConversations.bookId, bookId), eq(aiConversations.userId, userId))).orderBy(aiConversations.createdAt),
      db.select().from(tags).where(eq(tags.userId, userId)).orderBy(tags.createdAt),
    ]),
  ]);

  const currentIdx = allBooks.findIndex((b) => b.id === bookId);
  const prevId = currentIdx > 0 ? allBooks[currentIdx - 1].id : null;
  const nextId = currentIdx < allBooks.length - 1 ? allBooks[currentIdx + 1].id : null;

  const quoteIds = bookQuotes.map((q) => q.id);
  const qtRows = quoteIds.length > 0
    ? await db.select().from(quoteTags).where(inArray(quoteTags.quoteId, quoteIds))
    : [];

  const tagById = new Map(userTags.map((t) => [t.id, t]));
  const tagsForQuote = new Map<string, TagItem[]>();
  qtRows.forEach(({ quoteId, tagId }) => {
    const tag = tagById.get(tagId);
    if (!tag) return;
    if (!tagsForQuote.has(quoteId)) tagsForQuote.set(quoteId, []);
    tagsForQuote.get(quoteId)!.push({ id: tag.id, name: tag.name, color: tag.color ?? "#6366f1" });
  });

  const quotesWithTags = bookQuotes.map((q) => ({ ...q, tags: tagsForQuote.get(q.id) ?? [] }));
  const normalizedTags: TagItem[] = userTags.map((t) => ({ id: t.id, name: t.name, color: t.color ?? "#6366f1" }));

  return (
    <BookDetail
      book={book}
      initialQuotes={quotesWithTags}
      initialPhotos={bookPhotos}
      initialChat={chatHistory}
      initialTags={normalizedTags}
      prevId={prevId}
      nextId={nextId}
    />
  );
}

// 本の情報ヘッダーをすぐ表示するフォールバック
function BookShell({ book }: { book: BookRow }) {
  return (
    <div className="space-y-4 pb-nav-safe sm:pb-6">
      <div className="flex items-center justify-between">
        <Link href="/books" className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors">
          <ArrowLeft className="w-5 h-5 text-slate-600 dark:text-slate-400" />
        </Link>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 p-4 flex gap-4">
        {book.coverUrl ? (
          <img src={book.coverUrl} alt={book.title} className="w-20 h-28 object-cover rounded-lg shadow flex-shrink-0" />
        ) : (
          <div className="w-20 h-28 bg-indigo-50 dark:bg-indigo-950 rounded-lg flex items-center justify-center flex-shrink-0">
            <BookOpen className="w-8 h-8 text-indigo-200 dark:text-indigo-700" />
          </div>
        )}
        <div className="flex-1 min-w-0 space-y-2 pt-1">
          <p className="font-semibold text-slate-900 dark:text-slate-100 text-base leading-tight">{book.title}</p>
          <p className="text-sm text-slate-500 dark:text-slate-400">{book.author ?? "著者不明"}</p>
          <span className={cn("text-xs px-2 py-0.5 rounded-full inline-block", STATUS_COLORS[book.status as BookStatus])}>
            {STATUS_LABELS[book.status as BookStatus]}
          </span>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700">
        <div className="flex p-1 gap-1 border-b border-slate-100 dark:border-slate-700">
          {["引用", "写真", "AI"].map((label) => (
            <div key={label} className="flex-1 py-2 text-center text-sm text-slate-400 dark:text-slate-500">{label}</div>
          ))}
        </div>
        <div className="py-12 flex justify-center">
          <Loader2 className="w-5 h-5 text-slate-300 dark:text-slate-600 animate-spin" />
        </div>
      </div>
    </div>
  );
}

export default async function BookPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  // 本だけ先に取得（高速）
  const [book] = await db.select().from(books).where(and(eq(books.id, id), eq(books.userId, user.id)));
  if (!book) notFound();

  return (
    <Suspense fallback={<BookShell book={book as BookRow} />}>
      <BookDetailData bookId={id} userId={user.id} book={book as BookRow} />
    </Suspense>
  );
}
