"use client";

import { useSyncExternalStore } from "react";
import { WifiOff } from "lucide-react";

function subscribe(onChange: () => void) {
  window.addEventListener("online", onChange);
  window.addEventListener("offline", onChange);
  return () => {
    window.removeEventListener("online", onChange);
    window.removeEventListener("offline", onChange);
  };
}

const getSnapshot = () => navigator.onLine;
// サーバー側では判断できないのでオンライン扱い（帯を出さない）
const getServerSnapshot = () => true;

/**
 * オフライン時は保存済みの内容を表示するため、見ている情報が
 * 最新とは限らない。その旨を明示する。
 */
export default function OfflineBanner() {
  const online = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  if (online) return null;

  return (
    <div
      role="status"
      className="sticky top-14 z-40 flex items-center justify-center gap-2 bg-amber-50 dark:bg-amber-950 border-b border-amber-200 dark:border-amber-900 px-4 py-1.5 text-xs text-amber-800 dark:text-amber-200"
    >
      <WifiOff className="w-3.5 h-3.5 flex-shrink-0" aria-hidden />
      オフラインです。保存済みの内容を表示しています
    </div>
  );
}
