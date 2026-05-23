"use client";

import { useEffect, useState } from "react";
import type { AiProvider } from "@/lib/ai/provider";

export function useAiProvider() {
  const [provider, setProviderState] = useState<AiProvider>("gemini");

  useEffect(() => {
    const saved = localStorage.getItem("folio_ai_provider") as AiProvider | null;
    if (saved === "gemini" || saved === "claude") setProviderState(saved);
  }, []);

  function setProvider(p: AiProvider) {
    setProviderState(p);
    localStorage.setItem("folio_ai_provider", p);
  }

  return { provider, setProvider };
}
