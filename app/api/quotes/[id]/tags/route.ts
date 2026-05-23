import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { quoteTags, quotes } from "@/db/schema";
import { eq, and } from "drizzle-orm";

async function authorize(userId: string, quoteId: string) {
  const [quote] = await db.select().from(quotes)
    .where(and(eq(quotes.id, quoteId), eq(quotes.userId, userId)));
  return !!quote;
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: quoteId } = await params;
  if (!await authorize(user.id, quoteId))
    return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { tagId } = await request.json();
  await db.insert(quoteTags).values({ quoteId, tagId }).onConflictDoNothing();
  return NextResponse.json({ ok: true });
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: quoteId } = await params;
  if (!await authorize(user.id, quoteId))
    return NextResponse.json({ error: "Not found" }, { status: 404 });

  const tagId = new URL(request.url).searchParams.get("tagId");
  if (!tagId) return NextResponse.json({ error: "tagId required" }, { status: 400 });

  await db.delete(quoteTags).where(and(eq(quoteTags.quoteId, quoteId), eq(quoteTags.tagId, tagId)));
  return NextResponse.json({ ok: true });
}
