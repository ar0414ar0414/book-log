"use client";

import { useEffect, useState } from "react";
import { Sparkles, Check, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAiProvider } from "@/hooks/useAiProvider";
import type { AiProvider } from "@/lib/ai/provider";

interface ProviderAvailability { gemini: boolean; claude: boolean }

const PROVIDERS: { id: AiProvider; name: string; model: string; description: string; color: string }[] = [
  {
    id: "gemini",
    name: "Gemini",
    model: "gemini-2.0-flash",
    description: "Google AI Studio。高速・低コスト。",
    color: "#4285f4",
  },
  {
    id: "claude",
    name: "Claude",
    model: "claude-haiku-4-5",
    description: "Anthropic。日本語の精度が高い。",
    color: "#7c3aed",
  },
];

export default function SettingsPage() {
  const { provider, setProvider } = useAiProvider();
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
        <h1 className="text-xl font-bold text-slate-900">設定</h1>
        <p className="text-sm text-slate-500 mt-0.5">アプリの動作をカスタマイズ</p>
      </div>

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-slate-800 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-indigo-500" />
            AI プロバイダー
          </h2>
          {saved && (
            <span className="text-xs text-emerald-600 flex items-center gap-1 font-medium">
              <Check className="w-3.5 h-3.5" />保存しました
            </span>
          )}
        </div>
        <p className="text-xs text-slate-400">
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
                    ? "border-indigo-400 bg-indigo-50 shadow-sm"
                    : disabled
                      ? "border-slate-100 bg-slate-50 opacity-50 cursor-not-allowed"
                      : "border-slate-200 bg-white hover:border-indigo-200 hover:bg-indigo-50/30"
                )}
              >
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 text-white text-sm font-bold"
                  style={{ backgroundColor: p.color }}
                >
                  {p.name[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-slate-900">{p.name}</p>
                    <span className="text-xs text-slate-400 font-mono">{p.model}</span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">{p.description}</p>
                  {disabled && (
                    <p className="text-xs text-amber-600 flex items-center gap-1 mt-1">
                      <AlertCircle className="w-3 h-3" />
                      APIキー未設定
                    </p>
                  )}
                </div>
                {isSelected && !disabled && (
                  <div className="w-5 h-5 rounded-full bg-indigo-600 flex items-center justify-center flex-shrink-0">
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
