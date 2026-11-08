import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { aiConversations, books, quotes } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { getAiClient, classifyAiError, trimHistory } from "@/lib/ai/provider";
import { randomUUID } from "crypto";
import { aiChatSchema, parseJsonBody, uuidSchema } from "@/lib/validation";

export async function GET(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const bookId = searchParams.get("bookId");
  if (!bookId || !uuidSchema.safeParse(bookId).success)
    return NextResponse.json({ error: "bookId required" }, { status: 400 });

  const messages = await db.select().from(aiConversations)
    .where(and(eq(aiConversations.bookId, bookId), eq(aiConversations.userId, user.id)))
    .orderBy(aiConversations.createdAt);

  return NextResponse.json(messages);
}

export async function DELETE(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const bookId = searchParams.get("bookId");
  if (!bookId || !uuidSchema.safeParse(bookId).success)
    return NextResponse.json({ error: "bookId required" }, { status: 400 });

  await db.delete(aiConversations).where(
    and(eq(aiConversations.bookId, bookId), eq(aiConversations.userId, user.id))
  );

  return NextResponse.json({ ok: true });
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data, error: badRequest } = await parseJsonBody(request, aiChatSchema);
  if (badRequest) return badRequest;
  const { bookId, message, provider } = data;

  const [book] = await db.select().from(books).where(and(eq(books.id, bookId), eq(books.userId, user.id)));
  if (!book) return NextResponse.json({ error: "Book not found" }, { status: 404 });

  const bookQuotes = await db.select().from(quotes).where(and(eq(quotes.bookId, bookId), eq(quotes.userId, user.id)));
  const history = await db.select().from(aiConversations)
    .where(and(eq(aiConversations.bookId, bookId), eq(aiConversations.userId, user.id)))
    .orderBy(aiConversations.createdAt);

  const systemPrompt = `あなたは読書サポートAIです。以下の本について、読者と対話してください。

書籍情報:
- タイトル: ${book.title}
- 著者: ${book.author ?? "不明"}
- ジャンル: ${book.genre ?? "不明"}
- 読者のメモ: ${book.memo ?? "なし"}
- 読書状況: ${book.status === "done" ? "読了" : book.status === "reading" ? "読中" : "積読"}
${bookQuotes.length > 0 ? `\n保存した引用:\n${bookQuotes.map((q) => `・「${q.text}」`).join("\n")}` : ""}

上記の情報をもとに、読者の質問・感想に日本語で丁寧に回答してください。`;

  try {
    const client = getAiClient(provider);
    const chatHistory = trimHistory(
      history.map((m) => ({ role: m.role as "user" | "assistant", content: m.content }))
    );
    const iterator = client.chatStream(systemPrompt, chatHistory, message)[Symbol.asyncIterator]();

    // 最初のかたまりだけ先に取り出す。ここで失敗するぶん（上限超過・認証エラー等）は
    // まだ本文を返していないので、従来どおり JSON とステータスコードで返せる。
    const first = await iterator.next();

    const encoder = new TextEncoder();
    let full = "";

    // 送れたぶんだけでも会話として残す。途中で切れても履歴が消えないように、
    // 正常終了・中断のどちらでも保存する。
    let saved = false;
    const persist = async () => {
      if (saved || !full) return;
      saved = true;
      await db.insert(aiConversations).values([
        { id: randomUUID(), userId: user.id, bookId, role: "user", content: message },
        { id: randomUUID(), userId: user.id, bookId, role: "assistant", content: full },
      ]);
    };

    const stream = new ReadableStream<Uint8Array>({
      async start(controller) {
        try {
          if (!first.done && first.value) {
            full += first.value;
            controller.enqueue(encoder.encode(first.value));
          }
          while (true) {
            const { value, done } = await iterator.next();
            if (done) break;
            if (!value) continue;
            full += value;
            controller.enqueue(encoder.encode(value));
          }
          await persist();
          controller.close();
        } catch (e) {
          // 本文を返し始めた後の失敗。ステータスコードはもう変えられないので
          // ストリームを中断し、クライアント側で「途中で切れた」として扱う
          await persist();
          controller.error(e);
        }
      },
      async cancel() {
        // クライアントが離脱した場合もここまでの返答は残す
        await iterator.return?.();
        await persist();
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-store",
        // プロキシによるバッファリングを防ぐ（効かないと一括で届いてしまう）
        "X-Accel-Buffering": "no",
      },
    });
  } catch (e) {
    const { code, message: msg } = classifyAiError(e);
    return NextResponse.json({ error: code, message: msg }, { status: code === "quota_exceeded" ? 429 : 500 });
  }
}
