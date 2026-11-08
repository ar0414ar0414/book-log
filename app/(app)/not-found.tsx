import Link from "next/link";
import { BookOpen, ArrowLeft } from "lucide-react";

export default function AppNotFound() {
  return (
    <div className="py-16 flex flex-col items-center text-center gap-4">
      <div className="w-14 h-14 rounded-2xl bg-indigo-50 dark:bg-indigo-950 flex items-center justify-center">
        <BookOpen className="w-7 h-7 text-indigo-300 dark:text-indigo-600" />
      </div>

      <div className="space-y-1">
        <h1 className="text-lg font-bold text-slate-900 dark:text-slate-100">
          見つかりませんでした
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          削除されたか、URL が間違っているようです。
        </p>
      </div>

      <Link
        href="/books"
        className="flex items-center gap-2 mt-2 bg-indigo-600 dark:bg-indigo-500 text-white px-5 py-2.5 rounded-xl font-medium hover:bg-indigo-700 dark:hover:bg-indigo-600 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        本棚に戻る
      </Link>
    </div>
  );
}
