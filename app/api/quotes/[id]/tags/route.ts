import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { quoteTags, quotes } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { parseJsonBody, quoteTagSchema, uuidSchema } from "@/lib/validation";
import { ownsTag } from "@/lib/ownership";

async function getQuote(userId: string, quoteId: string) {
  const [quote] = await db.select().from(quotes)
    .where(and(eq(quotes.id, quoteId), eq(quotes.userId, userId)));
  return quote ?? null;
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: quoteId } = await params;
  if (!uuidSchema.safeParse(quoteId).success)
    return NextResponse.json({ error: "Not found" }, { status: 404 });

  const quote = await getQuote(user.id, quoteId);
  if (!quote) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { data, error } = await parseJsonBody(request, quoteTagSchema);
  if (error) return error;

  // 他人のタグを自分の引用に付けられないようにする
  if (!(await ownsTag(user.id, data.tagId)))
    return NextResponse.json({ error: "Tag not found" }, { status: 404 });

  await db.insert(quoteTags).values({ quoteId, tagId: data.tagId }).onConflictDoNothing();
  revalidatePath(`/books/${quote.bookId}`);
  revalidatePath("/quotes");
  return NextResponse.json({ ok: true });
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: quoteId } = await params;
  if (!uuidSchema.safeParse(quoteId).success)
    return NextResponse.json({ error: "Not found" }, { status: 404 });

  const quote = await getQuote(user.id, quoteId);
  if (!quote) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const tagId = new URL(request.url).searchParams.get("tagId");
  if (!tagId || !uuidSchema.safeParse(tagId).success)
    return NextResponse.json({ error: "tagId required" }, { status: 400 });

  await db.delete(quoteTags).where(and(eq(quoteTags.quoteId, quoteId), eq(quoteTags.tagId, tagId)));
  revalidatePath(`/books/${quote.bookId}`);
  revalidatePath("/quotes");
  return NextResponse.json({ ok: true });
}
