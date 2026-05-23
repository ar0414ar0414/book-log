import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { books } from "@/db/schema";
import { eq } from "drizzle-orm";
import StatsView from "@/components/stats/StatsView";
import type { Book } from "@/types";

export default async function StatsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const allBooks = await db.select().from(books).where(eq(books.userId, user.id));

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold text-slate-900">読書統計</h1>
      <StatsView books={allBooks as Book[]} />
    </div>
  );
}
