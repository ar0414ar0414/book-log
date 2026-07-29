import { NextResponse } from "next/server";

// Supabase 無料プランは7日間 API アクセスが無いと自動一時停止されるため、
// Vercel Cron から毎日叩いて活動を発生させる。
export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

  const res = await fetch(`${url}/rest/v1/tags?select=id&limit=1`, {
    headers: { apikey: key, Authorization: `Bearer ${key}` },
    cache: "no-store",
  });

  if (!res.ok) {
    return NextResponse.json(
      { ok: false, status: res.status },
      { status: 502 }
    );
  }

  return NextResponse.json({ ok: true, pingedAt: new Date().toISOString() });
}
