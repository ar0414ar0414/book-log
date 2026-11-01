import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// どの AI プロバイダーが使えるかは、鍵の設定状況という内部情報なので
// ログイン済みのユーザーにだけ返す。
export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  return NextResponse.json({
    gemini: !!process.env.GEMINI_API_KEY,
    claude: !!process.env.ANTHROPIC_API_KEY,
  });
}
