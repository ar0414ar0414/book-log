import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { quotes } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { definedOnly, parseJsonBody, quoteUpdateSchema, uuidSchema } from "@/lib/validation";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  if (!uuidSchema.safeParse(id).success)
    return NextResponse.json({ error: "Not found" }, { status: 404 });

  // 更新を許可するフィールドのみ抽出（userId/bookId 等の書き換えを防ぐ）
  const { data, error } = await parseJsonBody(request, quoteUpdateSchema);
  if (error) return error;

  const allowed = definedOnly(data);
  if (Object.keys(allowed).length === 0)
    return NextResponse.json({ error: "No valid fields" }, { status: 400 });

  const [quote] = await db.update(quotes)
    .set(allowed)
    .where(and(eq(quotes.id, id), eq(quotes.userId, user.id)))
    .returning();

  if (!quote) return NextResponse.json({ error: "Not found" }, { status: 404 });
  revalidatePath(`/books/${quote.bookId}`);
  revalidatePath("/quotes");
  return NextResponse.json(quote);
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  if (!uuidSchema.safeParse(id).success)
    return NextResponse.json({ error: "Not found" }, { status: 404 });

  const [quote] = await db.select().from(quotes).where(and(eq(quotes.id, id), eq(quotes.userId, user.id)));
  await db.delete(quotes).where(and(eq(quotes.id, id), eq(quotes.userId, user.id)));
  if (quote) {
    revalidatePath(`/books/${quote.bookId}`);
    revalidatePath("/quotes");
  }
  return NextResponse.json({ ok: true });
}
