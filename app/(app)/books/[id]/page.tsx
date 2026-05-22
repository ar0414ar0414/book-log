import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { books, quotes, photos, aiConversations } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { notFound } from "next/navigation";
import BookDetail from "@/components/books/BookDetail";

export default async function BookPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const [book] = await db.select().from(books).where(and(eq(books.id, id), eq(books.userId, user.id)));
  if (!book) notFound();

  const [bookQuotes, bookPhotos, chatHistory] = await Promise.all([
    db.select().from(quotes).where(and(eq(quotes.bookId, id), eq(quotes.userId, user.id))).orderBy(quotes.createdAt),
    db.select().from(photos).where(and(eq(photos.bookId, id), eq(photos.userId, user.id))).orderBy(photos.createdAt),
    db.select().from(aiConversations).where(and(eq(aiConversations.bookId, id), eq(aiConversations.userId, user.id))).orderBy(aiConversations.createdAt),
  ]);

  return (
    <BookDetail
      book={book}
      initialQuotes={bookQuotes}
      initialPhotos={bookPhotos}
      initialChat={chatHistory}
    />
  );
}
