export default function QuotesLoading() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="h-7 w-16 bg-slate-200 dark:bg-slate-700 rounded-lg" />
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-l-4 border-slate-100 dark:border-slate-700 border-l-slate-200 dark:border-l-slate-600">
            <div className="space-y-2">
              <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded" />
              <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-4/5" />
              <div className="h-3 bg-slate-100 dark:bg-slate-800 rounded w-2/5 mt-1" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
