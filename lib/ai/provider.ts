export type AiProvider = "gemini" | "claude";

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export interface AiClient {
  generateText(prompt: string): Promise<string>;
  chatWithHistory(systemPrompt: string, history: ChatMessage[], message: string): Promise<string>;
  visionOcr(imageBase64: string, mimeType: string, prompt: string): Promise<string>;
}

export function classifyAiError(e: unknown): { code: "quota_exceeded" | "api_error"; message: string } {
  const msg = e instanceof Error ? e.message : String(e);
  const isQuota =
    msg.includes("429") ||
    msg.includes("quota") ||
    msg.includes("RESOURCE_EXHAUSTED") ||
    msg.includes("rate_limit") ||
    msg.includes("overloaded");
  return isQuota
    ? {
        code: "quota_exceeded",
        message: "APIの利用上限に達しました。しばらく待つか、設定からプロバイダーを変更してください。",
      }
    : {
        code: "api_error",
        message: "AI処理中にエラーが発生しました。もう一度お試しください。",
      };
}

export function getAiClient(provider: AiProvider): AiClient {
  if (provider === "claude") {
    const { claudeClient } = require("@/lib/claude/client");
    return claudeClient;
  }
  const { geminiClient } = require("@/lib/gemini/client");
  return geminiClient;
}
