import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { books, quotes, photos, aiConversations, tags, quoteTags } from "@/db/schema";
import { eq, and, inArray } from "drizzle-orm";
import { notFound } from "next/navigation";
import BookDetail from "@/components/books/BookDetail";

export default async function BookPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const [book] = await db.select().from(books).where(and(eq(books.id, id), eq(books.userId, user.id)));
  if (!book) notFound();

  const [bookQuotes, bookPhotos, chatHistory, userTags] = await Promise.all([
    db.select().from(quotes).where(and(eq(quotes.bookId, id), eq(quotes.userId, user.id))).orderBy(quotes.createdAt),
    db.select().from(photos).where(and(eq(photos.bookId, id), eq(photos.userId, user.id))).orderBy(photos.createdAt),
    db.select().from(aiConversations).where(and(eq(aiConversations.bookId, id), eq(aiConversations.userId, user.id))).orderBy(aiConversations.createdAt),
    db.select().from(tags).where(eq(tags.userId, user.id)).orderBy(tags.createdAt),
  ]);

  // 引用ごとのタグを取得
  const quoteIds = bookQuotes.map((q) => q.id);
  const qtRows = quoteIds.length > 0
    ? await db.select().from(quoteTags).where(inArray(quoteTags.quoteId, quoteIds))
    : [];

  type TagItem = { id: string; name: string; color: string };
  const tagById = new Map(userTags.map((t) => [t.id, t]));
  const tagsForQuote = new Map<string, TagItem[]>();
  qtRows.forEach(({ quoteId, tagId }) => {
    const tag = tagById.get(tagId);
    if (!tag) return;
    if (!tagsForQuote.has(quoteId)) tagsForQuote.set(quoteId, []);
    tagsForQuote.get(quoteId)!.push({ id: tag.id, name: tag.name, color: tag.color ?? "#6366f1" });
  });

  const quotesWithTags = bookQuotes.map((q) => ({
    ...q,
    tags: tagsForQuote.get(q.id) ?? [],
  }));

  const normalizedTags: TagItem[] = userTags.map((t) => ({
    id: t.id, name: t.name, color: t.color ?? "#6366f1",
  }));

  return (
    <BookDetail
      book={book}
      initialQuotes={quotesWithTags}
      initialPhotos={bookPhotos}
      initialChat={chatHistory}
      initialTags={normalizedTags}
    />
  );
}
