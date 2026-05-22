import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { aiConversations, books, quotes } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { geminiModel } from "@/lib/gemini/client";
import { randomUUID } from "crypto";

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { bookId, message } = await request.json();

  const [book] = await db.select().from(books).where(and(eq(books.id, bookId), eq(books.userId, user.id)));
  if (!book) return NextResponse.json({ error: "Book not found" }, { status: 404 });

  const bookQuotes = await db.select().from(quotes).where(and(eq(quotes.bookId, bookId), eq(quotes.userId, user.id)));
  const history = await db.select().from(aiConversations)
    .where(and(eq(aiConversations.bookId, bookId), eq(aiConversations.userId, user.id)))
    .orderBy(aiConversations.createdAt);

  const contextPrompt = `あなたは読書サポートAIです。以下の本について、読者と対話してください。

書籍情報:
- タイトル: ${book.title}
- 著者: ${book.author ?? "不明"}
- ジャンル: ${book.genre ?? "不明"}
- 読者のメモ: ${book.memo ?? "なし"}
- 読書状況: ${book.status === "done" ? "読了" : book.status === "reading" ? "読中" : "積読"}
${bookQuotes.length > 0 ? `\n保存した引用:\n${bookQuotes.map((q) => `・「${q.text}」`).join("\n")}` : ""}

上記の情報をもとに、読者の質問・感想に日本語で丁寧に回答してください。`;

  const chat = geminiModel.startChat({
    history: [
      { role: "user", parts: [{ text: contextPrompt }] },
      { role: "model", parts: [{ text: "はい、喜んでお手伝いします！この本についてどのようなことでも聞いてください。" }] },
      ...history.map((msg) => ({
        role: msg.role as "user" | "model",
        parts: [{ text: msg.content }],
      })),
    ],
  });

  const result = await chat.sendMessage(message);
  const aiReply = result.response.text();

  await db.insert(aiConversations).values([
    { id: randomUUID(), userId: user.id, bookId, role: "user", content: message },
    { id: randomUUID(), userId: user.id, bookId, role: "assistant", content: aiReply },
  ]);

  return NextResponse.json({ reply: aiReply });
}
