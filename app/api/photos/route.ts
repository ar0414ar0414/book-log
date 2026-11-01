import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { photos } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { randomUUID } from "crypto";
import { PHOTO_BUCKET, withSignedUrls, signOne } from "@/lib/supabase/photo-urls";
import { uuidSchema } from "@/lib/validation";
import { ownsBook } from "@/lib/ownership";

const MAX_PHOTO_BYTES = 10 * 1024 * 1024;

/** パス区切りや制御文字を含むファイル名でストレージのパスを壊されないようにする */
function safeFileName(name: string): string {
  const cleaned = name.replace(/[^A-Za-z0-9._-]/g, "_").replace(/^\.+/, "");
  return cleaned.slice(0, 100) || "image";
}

export async function GET(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const bookId = searchParams.get("bookId");
  if (bookId && !uuidSchema.safeParse(bookId).success)
    return NextResponse.json({ error: "Invalid bookId" }, { status: 400 });

  const result = bookId
    ? await db.select().from(photos).where(and(eq(photos.userId, user.id), eq(photos.bookId, bookId))).orderBy(photos.createdAt)
    : await db.select().from(photos).where(eq(photos.userId, user.id)).orderBy(photos.createdAt);

  return NextResponse.json(await withSignedUrls(supabase, result));
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
  if (!uuidSchema.safeParse(bookId).success)
    return NextResponse.json({ error: "Invalid bookId" }, { status: 400 });
  if (!file.type.startsWith("image/"))
    return NextResponse.json({ error: "Only images are allowed" }, { status: 400 });
  if (file.size > MAX_PHOTO_BYTES)
    return NextResponse.json({ error: "File too large" }, { status: 413 });

  // 他人の本に写真を紐づけられないようにする
  if (!(await ownsBook(user.id, bookId)))
    return NextResponse.json({ error: "Book not found" }, { status: 404 });

  // ファイル名はそのままパスに入るので、記号類を落としてから使う
  const storagePath = `${user.id}/${bookId}/${randomUUID()}-${safeFileName(file.name)}`;
  const arrayBuffer = await file.arrayBuffer();

  const { error: uploadError } = await supabase.storage
    .from(PHOTO_BUCKET)
    .upload(storagePath, arrayBuffer, { contentType: file.type });

  if (uploadError) return NextResponse.json({ error: uploadError.message }, { status: 500 });

  const [photo] = await db.insert(photos).values({
    id: randomUUID(),
    userId: user.id,
    bookId,
    storagePath,
    caption: caption || null,
  }).returning();

  if (!photo) return NextResponse.json({ error: "Insert failed" }, { status: 500 });

  revalidatePath(`/books/${bookId}`);
  return NextResponse.json({ ...photo, url: await signOne(supabase, storagePath) });
}
