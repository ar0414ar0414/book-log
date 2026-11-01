import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { quotes } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { randomUUID } from "crypto";
import { parseJsonBody, quoteCreateSchema, uuidSchema } from "@/lib/validation";
import { ownsBook } from "@/lib/ownership";

export async function GET(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const bookId = searchParams.get("bookId");
  if (bookId && !uuidSchema.safeParse(bookId).success)
    return NextResponse.json({ error: "Invalid bookId" }, { status: 400 });

  const result = bookId
    ? await db.select().from(quotes).where(and(eq(quotes.userId, user.id), eq(quotes.bookId, bookId))).orderBy(quotes.createdAt)
    : await db.select().from(quotes).where(eq(quotes.userId, user.id)).orderBy(quotes.createdAt);

  return NextResponse.json(result);
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: body, error } = await parseJsonBody(request, quoteCreateSchema);
  if (error) return error;

  // 他人の本に自分の引用を紐づけられないようにする
  if (!(await ownsBook(user.id, body.bookId)))
    return NextResponse.json({ error: "Book not found" }, { status: 404 });

  const [quote] = await db.insert(quotes).values({
    id: randomUUID(),
    userId: user.id,
    bookId: body.bookId,
    text: body.text,
    pageNumber: body.pageNumber ?? null,
    chapter: body.chapter ?? null,
    memo: body.memo ?? null,
    isFavorite: body.isFavorite ?? false,
  }).returning();

  if (!quote) return NextResponse.json({ error: "Insert failed" }, { status: 500 });
  revalidatePath(`/books/${body.bookId}`);
  revalidatePath("/quotes");
  return NextResponse.json(quote);
}
