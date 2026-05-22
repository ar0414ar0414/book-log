import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { photos } from "@/db/schema";
import { eq, and } from "drizzle-orm";

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const [photo] = await db.select().from(photos).where(and(eq(photos.id, id), eq(photos.userId, user.id)));

  if (photo) {
    await supabase.storage.from("book-photos").remove([photo.storagePath]);
    await db.delete(photos).where(eq(photos.id, id));
  }

  return NextResponse.json({ ok: true });
}
