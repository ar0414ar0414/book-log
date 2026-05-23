import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { books, quotes, photos } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { geminiModel } from "@/lib/gemini/client";
import { buildReadingRecordPrompt } from "@/lib/gemini/prompts";
import type { Book, Quote } from "@/types";

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { bookId } = await request.json();

  const [[book], bookQuotes, bookPhotos] = await Promise.all([
    db.select().from(books).where(and(eq(books.id, bookId), eq(books.userId, user.id))),
    db.select().from(quotes).where(and(eq(quotes.bookId, bookId), eq(quotes.userId, user.id))),
    db.select().from(photos).where(and(eq(photos.bookId, bookId), eq(photos.userId, user.id))),
  ]);

  if (!book) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const photoTexts = bookPhotos
    .filter((p) => p.extractedText)
    .map((p) => p.extractedText as string);

  const prompt = buildReadingRecordPrompt(book as Book, bookQuotes as Quote[], photoTexts);
  const result = await geminiModel.generateContent(prompt);
  const record = result.response.text();

  return NextResponse.json({ record });
}
