import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { quotes } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { randomUUID } from "crypto";

export async function GET(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const bookId = searchParams.get("bookId");

  const result = bookId
    ? await db.select().from(quotes).where(and(eq(quotes.userId, user.id), eq(quotes.bookId, bookId))).orderBy(quotes.createdAt)
    : await db.select().from(quotes).where(eq(quotes.userId, user.id)).orderBy(quotes.createdAt);

  return NextResponse.json(result);
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const [quote] = await db.insert(quotes).values({
    id: randomUUID(),
    userId: user.id,
    bookId: body.bookId,
    text: body.text,
    pageNumber: body.pageNumber || null,
    chapter: body.chapter || null,
    memo: body.memo || null,
    isFavorite: body.isFavorite ?? false,
  }).returning();

  if (!quote) return NextResponse.json({ error: "Insert failed" }, { status: 500 });
  return NextResponse.json(quote);
}
