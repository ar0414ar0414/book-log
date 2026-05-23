import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { books, quotes } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { getAiClient, classifyAiError, type AiProvider } from "@/lib/ai/provider";
import { buildSummaryPrompt } from "@/lib/gemini/prompts";
import type { Book, Quote } from "@/types";

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { bookId, provider = "gemini" } = await request.json();

  const [book] = await db.select().from(books).where(and(eq(books.id, bookId), eq(books.userId, user.id)));
  if (!book) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const bookQuotes = await db.select().from(quotes).where(and(eq(quotes.bookId, bookId), eq(quotes.userId, user.id)));

  try {
    const prompt = buildSummaryPrompt(book as Book, bookQuotes as Quote[]);
    const client = getAiClient(provider as AiProvider);
    const summary = await client.generateText(prompt);
    return NextResponse.json({ summary });
  } catch (e) {
    const { code, message } = classifyAiError(e);
    return NextResponse.json({ error: code, message }, { status: code === "quota_exceeded" ? 429 : 500 });
  }
}
