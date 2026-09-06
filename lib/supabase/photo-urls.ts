import type { createClient } from "@/lib/supabase/server";

/**
 * 写真は public バケットの公開 URL ではなく、読み取り時に発行する署名付き URL で配信する。
 * 公開 URL は URL を知っていれば誰でも閲覧できてしまうため。
 */
export const PHOTO_BUCKET = "book-photos";
export const PHOTO_URL_TTL_SECONDS = 60 * 60;

type SupabaseClient = Awaited<ReturnType<typeof createClient>>;

export async function withSignedUrls<T extends { storagePath: string }>(
  supabase: SupabaseClient,
  rows: T[],
  expiresIn: number = PHOTO_URL_TTL_SECONDS
): Promise<(T & { url: string })[]> {
  if (rows.length === 0) return [];

  const { data, error } = await supabase.storage
    .from(PHOTO_BUCKET)
    .createSignedUrls(rows.map((r) => r.storagePath), expiresIn);

  if (error) throw error;

  // 署名に失敗した分（ストレージから消えている等）は url が空になる
  const byPath = new Map(
    (data ?? []).filter((d) => d.signedUrl).map((d) => [d.path, d.signedUrl])
  );
  return rows.map((r) => ({ ...r, url: byPath.get(r.storagePath) ?? "" }));
}

export async function signOne(
  supabase: SupabaseClient,
  storagePath: string,
  expiresIn: number = PHOTO_URL_TTL_SECONDS
): Promise<string> {
  const { data, error } = await supabase.storage
    .from(PHOTO_BUCKET)
    .createSignedUrl(storagePath, expiresIn);
  if (error) throw error;
  return data.signedUrl;
}
