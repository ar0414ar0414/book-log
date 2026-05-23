import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { quotes, books } from "@/db/schema";
import { eq } from "drizzle-orm";
import QuotesView from "@/components/quotes/QuotesView";

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

  return <QuotesView items={allQuotes} />;
}
