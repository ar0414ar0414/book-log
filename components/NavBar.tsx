"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookOpen, Quote, LayoutDashboard, LogOut, BarChart2, Settings } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/dashboard", icon: LayoutDashboard, label: "ホーム" },
  { href: "/books", icon: BookOpen, label: "本棚" },
  { href: "/quotes", icon: Quote, label: "引用" },
  { href: "/stats", icon: BarChart2, label: "統計" },
  { href: "/settings", icon: Settings, label: "設定" },
];

export default function NavBar({ user }: { user: User }) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();

  async function signOut() {
    await supabase.auth.signOut();
    router.push("/login");
  }

  return (
    <>
      {/* top header */}
      <header className="sticky top-0 z-50 bg-white dark:bg-slate-800 border-b border-slate-100 dark:border-slate-700 px-4 h-14 flex items-center justify-between">
        <Link href="/dashboard" className="flex items-center gap-2 font-bold text-indigo-600 dark:text-indigo-400">
          <BookOpen className="w-5 h-5" />
          Folio
        </Link>
        <button
          onClick={signOut}
          className="flex items-center gap-1.5 text-sm text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 transition-colors"
        >
          <LogOut className="w-4 h-4" />
          <span className="hidden sm:inline">ログアウト</span>
        </button>
      </header>

      {/* bottom nav (mobile) */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-slate-800 border-t border-slate-100 dark:border-slate-700 flex sm:hidden safe-area-pb">
        {navItems.map(({ href, icon: Icon, label }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex-1 flex flex-col items-center justify-center py-2 gap-0.5 text-xs transition-colors active:scale-95 active:opacity-60",
              pathname === href || (href !== "/dashboard" && pathname.startsWith(href))
                ? "text-indigo-600 dark:text-indigo-400"
                : "text-slate-400 dark:text-slate-500"
            )}
          >
            <Icon className="w-5 h-5" />
            {label}
          </Link>
        ))}
      </nav>

      {/* side nav (desktop) */}
      <div className="hidden sm:flex fixed left-0 top-14 bottom-0 w-48 border-r border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-800 flex-col gap-1 p-3">
        {navItems.map(({ href, icon: Icon, label }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors active:scale-95 active:opacity-60",
              pathname === href || (href !== "/dashboard" && pathname.startsWith(href))
                ? "bg-indigo-50 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300"
                : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700"
            )}
          >
            <Icon className="w-4 h-4" />
            {label}
          </Link>
        ))}
      </div>
    </>
  );
}
