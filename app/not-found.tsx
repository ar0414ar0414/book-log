import Link from "next/link";
import { BookOpen } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-slate-50 dark:bg-slate-900">
      <div className="w-full max-w-sm bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-8 flex flex-col items-center gap-5 text-center">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 bg-indigo-600 dark:bg-indigo-500 rounded-xl flex items-center justify-center">
            <BookOpen className="w-6 h-6 text-white" />
          </div>
          <span className="text-xl font-bold text-slate-900 dark:text-slate-100">Folio</span>
        </div>

        <div className="space-y-1">
          <h1 className="font-bold text-slate-900 dark:text-slate-100">ページが見つかりません</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            お探しのページは存在しないようです。
          </p>
        </div>

        <Link
          href="/dashboard"
          className="w-full bg-indigo-600 dark:bg-indigo-500 text-white py-2.5 rounded-xl font-medium hover:bg-indigo-700 dark:hover:bg-indigo-600 transition-colors"
        >
          ホームへ
        </Link>
      </div>
    </div>
  );
}
