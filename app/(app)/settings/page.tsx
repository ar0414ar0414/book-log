"use client";

import { useEffect, useState } from "react";
import { Sparkles, Check, AlertCircle, Sun, Moon } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAiProvider } from "@/hooks/useAiProvider";
import { useTheme } from "@/hooks/useTheme";
import type { AiProvider } from "@/lib/ai/provider";

interface ProviderAvailability { gemini: boolean; claude: boolean }

function GeminiIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden>
      <path d="M11.04 19.32Q12 21.51 12 24q0-2.49.93-4.68.96-2.19 2.58-3.81t3.81-2.55Q21.51 12 24 12q-2.49 0-4.68-.93a12.3 12.3 0 0 1-3.81-2.58 12.3 12.3 0 0 1-2.58-3.81Q12 2.49 12 0q0 2.49-.96 4.68-.93 2.19-2.55 3.81a12.3 12.3 0 0 1-3.81 2.58Q2.49 12 0 12q2.49 0 4.68.96 2.19.93 3.81 2.55t2.55 3.81" />
    </svg>
  );
}

function AnthropicIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden>
      <path d="M17.3041 3.541h-3.6718l6.696 16.918H24Zm-10.6082 0L0 20.459h3.7442l1.3693-3.5527h7.0052l1.3693 3.5528h3.7442L10.5363 3.5409Zm-.3712 10.2232 2.2914-5.9456 2.2914 5.9456Z" />
    </svg>
  );
}

const PROVIDERS: { id: AiProvider; name: string; model: string; description: string; color: string; Icon: React.ComponentType<{ className?: string }> }[] = [
  {
    id: "gemini",
    name: "Gemini",
    model: "gemini-2.5-flash",
    description: "Google AI Studio。高速・低コスト。",
    color: "#4285f4",
    Icon: GeminiIcon,
  },
  {
    id: "claude",
    name: "Claude",
    model: "claude-haiku-4-5",
    description: "Anthropic。日本語の精度が高い。",
    color: "#D97757",
    Icon: AnthropicIcon,
  },
];

export default function SettingsPage() {
  const { provider, setProvider } = useAiProvider();
  const { theme, setTheme } = useTheme();
  const [availability, setAvailability] = useState<ProviderAvailability | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch("/api/ai/providers")
      .then((r) => r.json())
      .then(setAvailability)
      .catch(() => setAvailability({ gemini: false, claude: false }));
  }, []);

  function handleSelect(p: AiProvider) {
    if (!availability) return;
    if (p === "gemini" && !availability.gemini) return;
    if (p === "claude" && !availability.claude) return;
    setProvider(p);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <div className="space-y-6 pb-nav-safe sm:pb-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">設定</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">アプリの動作をカスタマイズ</p>
      </div>

      {/* テーマ */}
      <section className="space-y-3">
        <h2 className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-2">
          <Sun className="w-4 h-4 text-amber-500" />
          テーマ
        </h2>
        <div className="flex gap-2">
          <button
            onClick={() => setTheme("light")}
            className={cn(
              "flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border-2 text-sm font-medium transition-all",
              theme === "light"
                ? "border-indigo-400 bg-indigo-50 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300"
                : "border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:border-indigo-200 dark:hover:border-indigo-700"
            )}
          >
            <Sun className="w-4 h-4" />
            ライト
          </button>
          <button
            onClick={() => setTheme("dark")}
            className={cn(
              "flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border-2 text-sm font-medium transition-all",
              theme === "dark"
                ? "border-indigo-400 bg-indigo-50 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300"
                : "border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:border-indigo-200 dark:hover:border-indigo-700"
            )}
          >
            <Moon className="w-4 h-4" />
            ダーク
          </button>
        </div>
      </section>

      {/* AI プロバイダー */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-indigo-500 dark:text-indigo-400" />
            AI プロバイダー
          </h2>
          {saved && (
            <span className="text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-1 font-medium">
              <Check className="w-3.5 h-3.5" />保存しました
            </span>
          )}
        </div>
        <p className="text-xs text-slate-400 dark:text-slate-500">
          チャット・要約・OCR に使用する AI エンジンを選択します。
          APIキーは管理者が環境変数で設定します。
        </p>

        <div className="grid grid-cols-1 gap-3">
          {PROVIDERS.map((p) => {
            const available = availability ? (p.id === "gemini" ? availability.gemini : availability.claude) : null;
            const isSelected = provider === p.id;
            const disabled = available === false;

            return (
              <button
                key={p.id}
                onClick={() => handleSelect(p.id)}
                disabled={disabled}
                className={cn(
                  "w-full flex items-center gap-4 p-4 rounded-2xl border-2 text-left transition-all",
                  isSelected
                    ? "border-indigo-400 bg-indigo-50 dark:bg-indigo-900/40 shadow-sm"
                    : disabled
                      ? "border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 opacity-50 cursor-not-allowed"
                      : "border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 hover:border-indigo-200 dark:hover:border-indigo-700 hover:bg-indigo-50/30 dark:hover:bg-indigo-900/20"
                )}
              >
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: p.color }}
                >
                  <p.Icon className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-slate-900 dark:text-slate-100">{p.name}</p>
                    <span className="text-xs text-slate-400 dark:text-slate-500 font-mono">{p.model}</span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{p.description}</p>
                  {disabled && (
                    <p className="text-xs text-amber-600 dark:text-amber-400 flex items-center gap-1 mt-1">
                      <AlertCircle className="w-3 h-3" />
                      APIキー未設定
                    </p>
                  )}
                </div>
                {isSelected && !disabled && (
                  <div className="w-5 h-5 rounded-full bg-indigo-600 dark:bg-indigo-500 flex items-center justify-center flex-shrink-0">
                    <Check className="w-3 h-3 text-white" />
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </section>

    </div>
  );
}
