export default function StatsLoading() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="h-7 w-24 bg-slate-200 dark:bg-slate-700 rounded-lg" />
      <div className="grid grid-cols-2 gap-3">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-100 dark:border-slate-700 space-y-2">
            <div className="h-4 w-4 bg-slate-200 dark:bg-slate-700 rounded" />
            <div className="h-8 w-16 bg-slate-200 dark:bg-slate-700 rounded" />
            <div className="h-3 w-12 bg-slate-100 dark:bg-slate-800 rounded" />
          </div>
        ))}
      </div>
      <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-100 dark:border-slate-700 h-48" />
      <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-100 dark:border-slate-700 h-32" />
    </div>
  );
}
