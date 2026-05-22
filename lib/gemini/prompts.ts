import type { Book, Quote } from "@/types";

export function buildSummaryPrompt(book: Book, quotes: Quote[]): string {
  const quotesText = quotes.length > 0
    ? `\n\n保存した引用・ハイライト:\n${quotes.map((q, i) => `${i + 1}. 「${q.text}」`).join("\n")}`
    : "";

  return `以下の本について、読者のメモと引用をもとに丁寧な要約と考察を日本語で提供してください。

書籍情報:
- タイトル: ${book.title}
- 著者: ${book.author || "不明"}
- ジャンル: ${book.genre || "不明"}
- 読者のメモ: ${book.memo || "なし"}
${quotesText}

以下の形式で回答してください:
1. 本の概要（2〜3文）
2. 主要なテーマ・メッセージ
3. 特に印象的なポイント
4. この本から得られる学び`;
}

export function buildRecommendPrompt(books: Book[]): string {
  const bookList = books
    .filter((b) => b.status === "done")
    .map((b) => `・${b.title}（${b.author}）評価: ${b.rating || "未評価"}/5`)
    .join("\n");

  return `以下の読了本リストをもとに、次に読むべき本を3冊推薦してください。日本語で回答してください。

読了本:
${bookList}

各推薦について、タイトル・著者・推薦理由を記載してください。`;
}

export function buildQuoteAnalysisPrompt(quotes: Quote[]): string {
  const quotesText = quotes.map((q, i) => `${i + 1}. 「${q.text}」`).join("\n");

  return `以下の引用・ハイライト集を分析して、読者の興味・関心のテーマや傾向を日本語で教えてください。

引用一覧:
${quotesText}

分析内容:
1. 共通するテーマ・キーワード
2. 読者が大切にしている価値観や考え方
3. 印象的な引用へのコメント`;
}

export function buildOcrPrompt(): string {
  return "この画像に写っているテキストをすべて正確に書き起こしてください。日本語の場合は日本語で、英語の場合は英語で出力してください。";
}
