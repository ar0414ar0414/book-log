import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { books, bookListColumns } from "@/db/schema";
import { eq } from "drizzle-orm";
import StatsView from "@/components/stats/StatsView";
import type { BookListItem } from "@/types";

export default async function StatsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  // 統計は集計に使う列だけで足りる
  const allBooks = await db.select(bookListColumns).from(books).where(eq(books.userId, user.id));

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">読書統計</h1>
      <StatsView books={allBooks as BookListItem[]} />
    </div>
  );
}
