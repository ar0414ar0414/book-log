import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getAiClient, classifyAiError } from "@/lib/ai/provider";
import { aiOcrSchema, parseJsonBody } from "@/lib/validation";
import { buildOcrPrompt } from "@/lib/gemini/prompts";
import { db } from "@/lib/db";
import { photos } from "@/db/schema";
import { eq, and } from "drizzle-orm";

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data, error: badRequest } = await parseJsonBody(request, aiOcrSchema);
  if (badRequest) return badRequest;
  const { photoId, imageBase64, mimeType, provider } = data;

  try {
    const client = getAiClient(provider);
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
