export const VIEW_MODE_COOKIE = "folio_view_mode";
export type ViewMode = "grid" | "list";

export function isViewMode(v: unknown): v is ViewMode {
  return v === "grid" || v === "list";
}

/** 1年間保持。表示設定なので httpOnly にはできない（クライアントから書き換える） */
export function viewModeCookie(mode: ViewMode): string {
  return `${VIEW_MODE_COOKIE}=${mode}; path=/; max-age=31536000; samesite=lax`;
}
