import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getAiClient, classifyAiError, type AiProvider } from "@/lib/ai/provider";
import { buildOcrPrompt } from "@/lib/gemini/prompts";
import { db } from "@/lib/db";
import { photos } from "@/db/schema";
import { eq, and } from "drizzle-orm";

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { photoId, imageBase64, mimeType, provider = "gemini" } = await request.json();

  try {
    const client = getAiClient(provider as AiProvider);
    const extractedText = await client.visionOcr(imageBase64, mimeType ?? "image/jpeg", buildOcrPrompt());

    if (photoId) {
      await db.update(photos)
        .set({ extractedText })
        .where(and(eq(photos.id, photoId), eq(photos.userId, user.id)));
    }

    return NextResponse.json({ text: extractedText });
  } catch (e) {
    const { code, message } = classifyAiError(e);
    return NextResponse.json({ error: code, message }, { status: code === "quota_exceeded" ? 429 : 500 });
  }
}
