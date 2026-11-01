import { z } from "zod";
import { NextResponse } from "next/server";

/**
 * API の入力検証。
 *
 * ここを通していない値を DB や AI プロンプトに渡さないこと。
 * - uuid 以外の文字列を uuid カラムに渡すと Postgres が例外を投げて 500 になる
 * - 長さ無制限のテキストは AI のトークンを際限なく消費する
 * - body をそのまま update の set() に展開すると、userId など
 *   更新させてはいけないカラムまで書き換えられる
 */

export const uuidSchema = z.uuid();

/** AI プロンプトや DB に入る自由入力の上限。極端な値だけを弾く緩い制限 */
const TEXT_MAX = 20_000;
const SHORT_TEXT_MAX = 500;

const nullableText = (max: number) => z.string().max(max).nullish();

export const bookStatusSchema = z.enum(["want", "reading", "done"]);

export const bookCreateSchema = z.object({
  title: z.string().trim().min(1).max(SHORT_TEXT_MAX),
  author: nullableText(SHORT_TEXT_MAX),
  isbn: nullableText(32),
  coverUrl: nullableText(2048),
  publisher: nullableText(SHORT_TEXT_MAX),
  publishedDate: nullableText(64),
  genre: nullableText(SHORT_TEXT_MAX),
  description: nullableText(TEXT_MAX),
  status: bookStatusSchema.default("want"),
  rating: z.number().min(0).max(5).nullish(),
  memo: nullableText(TEXT_MAX),
  pageCount: z.number().int().min(0).max(100_000).nullish(),
  startedAt: z.string().nullish(),
  finishedAt: z.string().nullish(),
});

/**
 * 更新を許可するカラムだけを列挙する。
 * ここに無いカラム（userId, id, createdAt など）は無視される。
 */
export const bookUpdateSchema = z.object({
  title: z.string().trim().min(1).max(SHORT_TEXT_MAX).optional(),
  author: nullableText(SHORT_TEXT_MAX),
  genre: nullableText(SHORT_TEXT_MAX),
  coverUrl: nullableText(2048),
  status: bookStatusSchema.optional(),
  rating: z.number().min(0).max(5).nullish(),
  memo: nullableText(TEXT_MAX),
  preMemo: nullableText(TEXT_MAX),
  postMemo: nullableText(TEXT_MAX),
  aiRecord: nullableText(TEXT_MAX),
  aiSummary: nullableText(TEXT_MAX),
  currentPage: z.number().int().min(0).max(100_000).nullish(),
  pageCount: z.number().int().min(0).max(100_000).nullish(),
  startedAt: z.string().nullish(),
  finishedAt: z.string().nullish(),
});

export const quoteCreateSchema = z.object({
  bookId: uuidSchema,
  text: z.string().trim().min(1).max(TEXT_MAX),
  pageNumber: z.number().int().min(0).max(100_000).nullish(),
  chapter: nullableText(SHORT_TEXT_MAX),
  memo: nullableText(TEXT_MAX),
  isFavorite: z.boolean().optional(),
});

export const quoteUpdateSchema = z.object({
  text: z.string().trim().min(1).max(TEXT_MAX).optional(),
  pageNumber: z.number().int().min(0).max(100_000).nullish(),
  chapter: nullableText(SHORT_TEXT_MAX),
  memo: nullableText(TEXT_MAX),
  isFavorite: z.boolean().optional(),
});

export const tagCreateSchema = z.object({
  name: z.string().trim().min(1).max(64),
  // #rgb / #rrggbb のみ。任意の文字列を style に流し込ませない
  color: z.string().regex(/^#[0-9a-fA-F]{3}([0-9a-fA-F]{3})?$/).optional(),
});

export const quoteTagSchema = z.object({ tagId: uuidSchema });

export const photoUpdateSchema = z.object({
  caption: nullableText(SHORT_TEXT_MAX),
});

export const aiProviderSchema = z.enum(["gemini", "claude"]).default("gemini");

export const aiChatSchema = z.object({
  bookId: uuidSchema,
  message: z.string().trim().min(1).max(TEXT_MAX),
  provider: aiProviderSchema,
});

export const aiBookSchema = z.object({
  bookId: uuidSchema,
  provider: aiProviderSchema,
});

export const aiOcrSchema = z.object({
  photoId: uuidSchema.nullish(),
  // base64 の上限。10MB 相当（base64 は約 4/3 に膨らむ）
  imageBase64: z.string().min(1).max(14_000_000),
  mimeType: z.string().max(100).optional(),
  provider: aiProviderSchema,
});

/** 検証に失敗したら 400 を返す。成功時は型の付いた値を返す */
export async function parseJsonBody<T extends z.ZodType>(
  request: Request,
  schema: T
): Promise<{ data: z.infer<T>; error: null } | { data: null; error: NextResponse }> {
  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return { data: null, error: NextResponse.json({ error: "Invalid JSON" }, { status: 400 }) };
  }

  const result = schema.safeParse(raw);
  if (!result.success) {
    return {
      data: null,
      error: NextResponse.json(
        { error: "Invalid request", issues: z.treeifyError(result.error) },
        { status: 400 }
      ),
    };
  }
  return { data: result.data, error: null };
}

/** undefined のキーを落とす。PATCH で「未指定」と「null 指定」を区別するため */
export function definedOnly<T extends Record<string, unknown>>(obj: T): Partial<T> {
  return Object.fromEntries(
    Object.entries(obj).filter(([, v]) => v !== undefined)
  ) as Partial<T>;
}
