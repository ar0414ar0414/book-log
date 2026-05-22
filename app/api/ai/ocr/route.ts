import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { geminiVisionModel } from "@/lib/gemini/client";
import { buildOcrPrompt } from "@/lib/gemini/prompts";
import { db } from "@/lib/db";
import { photos } from "@/db/schema";
import { eq, and } from "drizzle-orm";

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { photoId, imageBase64, mimeType } = await request.json();

  const result = await geminiVisionModel.generateContent([
    buildOcrPrompt(),
    { inlineData: { data: imageBase64, mimeType: mimeType ?? "image/jpeg" } },
  ]);

  const extractedText = result.response.text();

  if (photoId) {
    await db.update(photos)
      .set({ extractedText })
      .where(and(eq(photos.id, photoId), eq(photos.userId, user.id)));
  }

  return NextResponse.json({ text: extractedText });
}
