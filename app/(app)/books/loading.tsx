export default function BooksLoading() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="flex items-center justify-between">
        <div className="h-7 w-16 bg-slate-200 dark:bg-slate-700 rounded-lg" />
        <div className="h-9 w-20 bg-slate-200 dark:bg-slate-700 rounded-xl" />
      </div>
      <div className="flex gap-2">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="h-8 w-16 bg-slate-200 dark:bg-slate-700 rounded-full flex-shrink-0" />
        ))}
      </div>
      <div className="grid grid-cols-3 gap-3">
        {Array.from({ length: 9 }).map((_, i) => (
          <div key={i} className="rounded-xl overflow-hidden border border-slate-100 dark:border-slate-700">
            <div className="aspect-[2/3] bg-slate-200 dark:bg-slate-700" />
            <div className="p-2 space-y-1 bg-white dark:bg-slate-800">
              <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded" />
              <div className="h-3 bg-slate-100 dark:bg-slate-800 rounded w-2/3" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
