"use client";

import { useCallback, useSyncExternalStore } from "react";
import type { AiProvider } from "@/lib/ai/provider";

const KEY = "folio_ai_provider";
const DEFAULT: AiProvider = "gemini";

// localStorage は React の外にある状態なので useSyncExternalStore で購読する。
// useEffect で読んで setState すると、描画後に状態が変わるぶんだけ
// 画面が一瞬ちらつく上に React Compiler のルールにも反する。
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((l) => l());
}

function subscribe(onStoreChange: () => void) {
  listeners.add(onStoreChange);
  // 別タブでの変更も拾う
  window.addEventListener("storage", onStoreChange);
  return () => {
    listeners.delete(onStoreChange);
    window.removeEventListener("storage", onStoreChange);
  };
}

function getSnapshot(): AiProvider {
  try {
    const saved = localStorage.getItem(KEY);
    return saved === "claude" || saved === "gemini" ? saved : DEFAULT;
  } catch {
    // プライベートモード等で localStorage が触れない場合
    return DEFAULT;
  }
}

// サーバーには保存値が無いので既定値を返す
function getServerSnapshot(): AiProvider {
  return DEFAULT;
}

export function useAiProvider() {
  const provider = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const setProvider = useCallback((p: AiProvider) => {
    try {
      localStorage.setItem(KEY, p);
    } catch {
      // 保存できなくても画面上の選択は反映させる
    }
    emit();
  }, []);

  return { provider, setProvider };
}
