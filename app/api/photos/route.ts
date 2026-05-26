import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { photos } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { randomUUID } from "crypto";

export async function GET(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const bookId = searchParams.get("bookId");

  const result = bookId
    ? await db.select().from(photos).where(and(eq(photos.userId, user.id), eq(photos.bookId, bookId))).orderBy(photos.createdAt)
    : await db.select().from(photos).where(eq(photos.userId, user.id)).orderBy(photos.createdAt);

  return NextResponse.json(result);
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const formData = await request.formData();
  const file = formData.get("file") as File;
  const bookId = formData.get("bookId") as string;
  const caption = formData.get("caption") as string | null;

  if (!file || !bookId) return NextResponse.json({ error: "Missing fields" }, { status: 400 });

  const storagePath = `${user.id}/${bookId}/${randomUUID()}-${file.name}`;
  const arrayBuffer = await file.arrayBuffer();

  const { error: uploadError } = await supabase.storage
    .from("book-photos")
    .upload(storagePath, arrayBuffer, { contentType: file.type });

  if (uploadError) return NextResponse.json({ error: uploadError.message }, { status: 500 });

  const { data: { publicUrl } } = supabase.storage.from("book-photos").getPublicUrl(storagePath);

  const [photo] = await db.insert(photos).values({
    id: randomUUID(),
    userId: user.id,
    bookId,
    url: publicUrl,
    storagePath,
    caption: caption || null,
  }).returning();

  revalidatePath(`/books/${bookId}`);
  return NextResponse.json(photo);
}
