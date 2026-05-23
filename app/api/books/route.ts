import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { books, users } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { randomUUID } from "crypto";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const result = await db.select().from(books).where(eq(books.userId, user.id)).orderBy(desc(books.updatedAt));
  return NextResponse.json(result);
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // ensure user row exists
  await db.insert(users).values({
    id: user.id,
    email: user.email!,
    name: user.user_metadata?.full_name ?? null,
    avatarUrl: user.user_metadata?.avatar_url ?? null,
  }).onConflictDoNothing();

  const body = await request.json();
  const id = randomUUID();

  const [book] = await db.insert(books).values({
    id,
    userId: user.id,
    title: body.title,
    author: body.author || null,
    isbn: body.isbn || null,
    coverUrl: body.coverUrl || null,
    publisher: body.publisher || null,
    publishedDate: body.publishedDate || null,
    genre: body.genre || null,
    description: body.description || null,
    status: body.status ?? "want",
    rating: body.rating || null,
    memo: body.memo || null,
    pageCount: body.pageCount || null,
    startedAt: body.startedAt ? new Date(body.startedAt) : null,
    finishedAt: body.finishedAt ? new Date(body.finishedAt) : null,
  }).returning();

  return NextResponse.json(book);
}
