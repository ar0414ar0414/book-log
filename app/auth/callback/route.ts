import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { tags } from "@/db/schema";
import { eq } from "drizzle-orm";
import { randomUUID } from "crypto";

const DEFAULT_TAGS = [
  { name: "名言",           color: "#6366f1" },
  { name: "学び",           color: "#0ea5e9" },
  { name: "人生",           color: "#8b5cf6" },
  { name: "感動",           color: "#f59e0b" },
  { name: "仕事",           color: "#10b981" },
  { name: "哲学",           color: "#64748b" },
  { name: "モチベーション", color: "#ef4444" },
  { name: "読書メモ",       color: "#ec4899" },
];

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");

  if (code) {
    const supabase = await createClient();
    const { data: { user }, error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error && user) {
      // 初回ログイン時のみデフォルトタグを作成
      const existing = await db.select({ id: tags.id }).from(tags).where(eq(tags.userId, user.id)).limit(1);
      if (existing.length === 0) {
        await db.insert(tags).values(
          DEFAULT_TAGS.map((t) => ({ id: randomUUID(), userId: user.id, name: t.name, color: t.color }))
        );
      }
      return NextResponse.redirect(`${origin}/dashboard`);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth`);
}
