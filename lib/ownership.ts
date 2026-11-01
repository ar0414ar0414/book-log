import { db } from "@/lib/db";
import { books, tags } from "@/db/schema";
import { eq, and } from "drizzle-orm";

/**
 * 他人の book / tag の ID を指定して自分のレコードを紐づけられないよう、
 * 参照先が自分のものかを確認する。
 */

export async function ownsBook(userId: string, bookId: string): Promise<boolean> {
  const [row] = await db
    .select({ id: books.id })
    .from(books)
    .where(and(eq(books.id, bookId), eq(books.userId, userId)))
    .limit(1);
  return Boolean(row);
}

export async function ownsTag(userId: string, tagId: string): Promise<boolean> {
  const [row] = await db
    .select({ id: tags.id })
    .from(tags)
    .where(and(eq(tags.id, tagId), eq(tags.userId, userId)))
    .limit(1);
  return Boolean(row);
}
