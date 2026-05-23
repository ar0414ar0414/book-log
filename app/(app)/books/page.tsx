import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { books } from "@/db/schema";
import { eq } from "drizzle-orm";
import Link from "next/link";
import { Plus } from "lucide-react";
import { STATUS_LABELS, cn } from "@/lib/utils";
import BooksShelf from "@/components/books/BooksShelf";

export default async function BooksPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status } = await searchParams;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const allBooks = await db
    .select()
    .from(books)
    .where(eq(books.userId, user.id));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-slate-900">本棚</h1>
        <Link
          href="/books/new"
          className="flex items-center gap-1.5 bg-indigo-600 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-indigo-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          追加
        </Link>
      </div>

      {/* ステータスフィルタ */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
        {([undefined, "want", "reading", "done"] as const).map((s) => (
          <Link
            key={s ?? "all"}
            href={s ? `/books?status=${s}` : "/books"}
            className={cn(
              "flex-shrink-0 px-4 py-1.5 rounded-full text-sm font-medium border transition-colors",
              (!status && !s) || status === s
                ? "bg-indigo-600 text-white border-indigo-600"
                : "bg-white text-slate-600 border-slate-200 hover:border-indigo-300"
            )}
          >
            {s ? STATUS_LABELS[s] : "すべて"}
            <span className="ml-1.5 text-xs opacity-70">
              {s
                ? allBooks.filter((b) => b.status === s).length
                : allBooks.length}
            </span>
          </Link>
        ))}
      </div>

      <BooksShelf books={allBooks as import("@/types").Book[]} statusFilter={status} />
    </div>
  );
}
