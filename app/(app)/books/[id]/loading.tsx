export default function BookDetailLoading() {
  return (
    <div className="space-y-4 pb-nav-safe sm:pb-6 animate-pulse">
      <div className="h-9 w-9 bg-slate-200 dark:bg-slate-700 rounded-lg" />
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 p-4 flex gap-4">
        <div className="w-20 h-28 bg-slate-200 dark:bg-slate-700 rounded-lg flex-shrink-0" />
        <div className="flex-1 space-y-2 pt-1">
          <div className="h-5 bg-slate-200 dark:bg-slate-700 rounded w-4/5" />
          <div className="h-4 bg-slate-100 dark:bg-slate-800 rounded w-1/2" />
          <div className="h-4 w-14 bg-slate-100 dark:bg-slate-800 rounded-full" />
          <div className="flex gap-1 pt-1">
            {[0,1,2,3,4].map(i => <div key={i} className="w-5 h-5 bg-slate-200 dark:bg-slate-700 rounded-full" />)}
          </div>
        </div>
      </div>
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 p-4 space-y-2">
        <div className="h-4 w-16 bg-slate-200 dark:bg-slate-700 rounded" />
        <div className="h-3 bg-slate-100 dark:bg-slate-800 rounded" />
        <div className="h-3 bg-slate-100 dark:bg-slate-800 rounded w-3/4" />
      </div>
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700">
        <div className="flex p-1 gap-1 border-b border-slate-100 dark:border-slate-700">
          {[0, 1, 2].map((i) => (
            <div key={i} className="flex-1 h-9 bg-slate-100 dark:bg-slate-800 rounded-lg" />
          ))}
        </div>
        <div className="py-12 flex justify-center">
          <div className="w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-700" />
        </div>
      </div>
    </div>
  );
}
