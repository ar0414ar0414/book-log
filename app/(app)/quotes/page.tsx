import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { quotes, books, tags, quoteTags } from "@/db/schema";
import { eq, inArray } from "drizzle-orm";
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

  const quoteIds = allQuotes.map((q) => q.quote.id);
  const [qtRows, userTags] = quoteIds.length > 0
    ? await Promise.all([
        db.select().from(quoteTags).where(inArray(quoteTags.quoteId, quoteIds)),
        db.select().from(tags).where(eq(tags.userId, user.id)),
      ])
    : [[], []];

  const tagById = new Map(userTags.map((t) => [t.id, t]));
  const tagsForQuote = new Map<string, { id: string; name: string; color: string }[]>();
  qtRows.forEach(({ quoteId, tagId }) => {
    const tag = tagById.get(tagId);
    if (!tag) return;
    if (!tagsForQuote.has(quoteId)) tagsForQuote.set(quoteId, []);
    tagsForQuote.get(quoteId)!.push({ id: tag.id, name: tag.name, color: tag.color ?? "#6366f1" });
  });

  const items = allQuotes.map(({ quote, book }) => ({
    quote,
    book,
    tags: tagsForQuote.get(quote.id) ?? [],
  }));

  return <QuotesView items={items} allUserTags={userTags.map((t) => ({ id: t.id, name: t.name, color: t.color ?? "#6366f1" }))} />;
}
