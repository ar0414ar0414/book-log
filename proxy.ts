import { type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

export async function proxy(request: NextRequest) {
  return await updateSession(request);
}

export const config = {
  // offline.html は Service Worker がオフライン時に出す静的ページなので、
  // 認証リダイレクトの対象から外す（/login に飛ぶとキャッシュできない）
  matcher: ["/((?!_next/static|_next/image|favicon.ico|icons|manifest.json|sw.js|offline.html|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
