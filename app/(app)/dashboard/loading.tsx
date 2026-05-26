export default function DashboardLoading() {
  return (
    <div className="pb-nav-safe sm:pb-6 space-y-6 animate-pulse">
      <div>
        <div className="h-7 w-44 bg-slate-200 dark:bg-slate-700 rounded-lg" />
        <div className="h-4 w-32 bg-slate-100 dark:bg-slate-800 rounded mt-1.5" />
      </div>
      <div className="grid grid-cols-3 gap-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-100 dark:border-slate-700 space-y-2">
            <div className="h-5 w-10 bg-slate-200 dark:bg-slate-700 rounded-full" />
            <div className="h-8 w-8 bg-slate-200 dark:bg-slate-700 rounded" />
            <div className="h-3 w-4 bg-slate-100 dark:bg-slate-800 rounded" />
          </div>
        ))}
      </div>
      <div className="flex gap-3">
        <div className="flex-1 h-12 bg-slate-200 dark:bg-slate-700 rounded-xl" />
        <div className="flex-1 h-12 bg-slate-100 dark:bg-slate-800 rounded-xl" />
      </div>
      <div className="space-y-2">
        <div className="h-5 w-24 bg-slate-200 dark:bg-slate-700 rounded mb-3" />
        {[0, 1, 2].map((i) => (
          <div key={i} className="flex gap-3 bg-white dark:bg-slate-800 rounded-xl p-3 border border-slate-100 dark:border-slate-700">
            <div className="w-10 h-14 bg-slate-200 dark:bg-slate-700 rounded" />
            <div className="flex-1 space-y-2 pt-1">
              <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-3/4" />
              <div className="h-3 bg-slate-100 dark:bg-slate-800 rounded w-1/2" />
              <div className="h-4 w-12 bg-slate-100 dark:bg-slate-800 rounded-full" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
