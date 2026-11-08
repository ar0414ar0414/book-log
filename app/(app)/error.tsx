"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, RotateCw, Home } from "lucide-react";

export default function AppError({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  useEffect(() => {
    // サーバー由来のエラーは本文が伏せられるため、ログ照合用に digest を残す
    console.error("[app error]", error.digest ?? "", error);
  }, [error]);

  return (
    <div className="py-16 flex flex-col items-center text-center gap-4">
      <div className="w-14 h-14 rounded-2xl bg-amber-50 dark:bg-amber-950 flex items-center justify-center">
        <AlertTriangle className="w-7 h-7 text-amber-500" />
      </div>

      <div className="space-y-1">
        <h1 className="text-lg font-bold text-slate-900 dark:text-slate-100">
          うまく読み込めませんでした
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          通信が不安定なときにも起こります。少し待ってから試してください。
        </p>
      </div>

      <div className="flex gap-3 mt-2">
        <button
          onClick={() => unstable_retry()}
          className="flex items-center gap-2 bg-indigo-600 dark:bg-indigo-500 text-white px-5 py-2.5 rounded-xl font-medium hover:bg-indigo-700 dark:hover:bg-indigo-600 transition-colors"
        >
          <RotateCw className="w-4 h-4" />
          もう一度試す
        </button>
        <Link
          href="/dashboard"
          className="flex items-center gap-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-300 px-5 py-2.5 rounded-xl font-medium hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
        >
          <Home className="w-4 h-4" />
          ホームへ
        </Link>
      </div>

      {error.digest && (
        <p className="text-xs text-slate-400 dark:text-slate-500 mt-2">
          エラーID: <code className="font-mono">{error.digest}</code>
        </p>
      )}
    </div>
  );
}
