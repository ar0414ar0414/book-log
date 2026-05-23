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

export function buildReadingRecordPrompt(
  book: Book,
  quotes: Quote[],
  photoTexts: string[],
): string {
  const quotesSection = quotes.length > 0
    ? `\n保存した引用（${quotes.length}件）:\n${quotes.map((q, i) => `${i + 1}. 「${q.text}」${q.memo ? `（メモ: ${q.memo}）` : ""}`).join("\n")}`
    : "";

  const photoSection = photoTexts.length > 0
    ? `\n写真から抽出したメモ書き:\n${photoTexts.map((t, i) => `[写真${i + 1}] ${t}`).join("\n\n")}`
    : "";

  return `以下の本について、読者が残した記録（メモ・引用・写真のメモ書き）をもとに、個人的な読書記録を日本語で作成してください。読者の言葉や引用を積極的に活用し、本人の視点を大切にした記録にしてください。

【書籍情報】
タイトル: ${book.title}
著者: ${book.author || "不明"}
ジャンル: ${book.genre || "不明"}
評価: ${book.rating ? `${book.rating}/5` : "未評価"}
読者メモ: ${book.memo || "なし"}
${quotesSection}${photoSection}

【出力形式】
以下の4セクションを必ず含めて、見出しは「## セクション名」の形式で記述してください。

## この本について
（2〜3文でこの本の内容・テーマを読者メモ・引用をもとに説明）

## 印象に残った言葉
（保存した引用の中から特に心に響いたものをピックアップし、なぜ印象的か一言添える）

## 学びと気づき
（メモ・引用・写真メモから読み取れる、読者にとっての具体的な学び）

## 次に活かしたいこと
（この本を読んで行動・考え方をどう変えたいか、具体的なアクションや思考の変化）`;
}

export function buildOcrPrompt(): string {
  return "この画像に写っているテキストをすべて正確に書き起こしてください。日本語の場合は日本語で、英語の場合は英語で出力してください。";
}
