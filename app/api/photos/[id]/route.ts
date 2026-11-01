import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { photos } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { PHOTO_BUCKET } from "@/lib/supabase/photo-urls";
import { parseJsonBody, photoUpdateSchema, uuidSchema } from "@/lib/validation";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  if (!uuidSchema.safeParse(id).success)
    return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { data, error } = await parseJsonBody(request, photoUpdateSchema);
  if (error) return error;

  const [photo] = await db.update(photos)
    .set({ caption: data.caption ?? null })
    .where(and(eq(photos.id, id), eq(photos.userId, user.id)))
    .returning();

  if (!photo) return NextResponse.json({ error: "Not found" }, { status: 404 });
  revalidatePath(`/books/${photo.bookId}`);
  return NextResponse.json(photo);
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  if (!uuidSchema.safeParse(id).success)
    return NextResponse.json({ error: "Not found" }, { status: 404 });

  const [photo] = await db.select().from(photos).where(and(eq(photos.id, id), eq(photos.userId, user.id)));

  if (photo) {
    await db.delete(photos).where(eq(photos.id, id));
    revalidatePath(`/books/${photo.bookId}`);
    try {
      await supabase.storage.from(PHOTO_BUCKET).remove([photo.storagePath]);
    } catch {
      // storage cleanup failure is non-critical; DB record is already deleted
    }
  }

  return NextResponse.json({ ok: true });
}
