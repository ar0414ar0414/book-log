import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { books } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { bookUpdateSchema, definedOnly, parseJsonBody, uuidSchema } from "@/lib/validation";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  if (!uuidSchema.safeParse(id).success)
    return NextResponse.json({ error: "Not found" }, { status: 404 });

  // body をそのまま set() に展開すると userId や id まで書き換えられるため、
  // スキーマで許可したカラムだけを取り出す
  const { data, error } = await parseJsonBody(request, bookUpdateSchema);
  if (error) return error;

  const patch = definedOnly({
    ...data,
    startedAt: data.startedAt === undefined ? undefined : data.startedAt ? new Date(data.startedAt) : null,
    finishedAt: data.finishedAt === undefined ? undefined : data.finishedAt ? new Date(data.finishedAt) : null,
  });
  if (Object.keys(patch).length === 0)
    return NextResponse.json({ error: "No valid fields" }, { status: 400 });

  const [book] = await db.update(books)
    .set({ ...patch, updatedAt: new Date() })
    .where(and(eq(books.id, id), eq(books.userId, user.id)))
    .returning();

  if (!book) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(book);
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  if (!uuidSchema.safeParse(id).success)
    return NextResponse.json({ error: "Not found" }, { status: 404 });

  await db.delete(books).where(and(eq(books.id, id), eq(books.userId, user.id)));
  return NextResponse.json({ ok: true });
}
