import { geminiClient } from "@/lib/gemini/client";
import { claudeClient } from "@/lib/claude/client";

export type AiProvider = "gemini" | "claude";

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export interface AiClient {
  generateText(prompt: string): Promise<string>;
  /** 返答を少しずつ返す。最初の文字が出るまでの待ち時間を短くするため */
  chatStream(
    systemPrompt: string,
    history: ChatMessage[],
    message: string
  ): AsyncIterable<string>;
  visionOcr(imageBase64: string, mimeType: string, prompt: string): Promise<string>;
}

/** 1回のリクエストで送る履歴の上限。超えると古い方から落とす */
export const HISTORY_MAX_MESSAGES = 20;
export const HISTORY_MAX_CHARS = 12_000;

/**
 * 会話履歴を直近だけに絞る。
 *
 * 全履歴をそのまま送ると、本1冊で会話を重ねるほど毎回の送信量が
 * 際限なく増え、遅くなる・費用が増える・いずれ上限に当たる。
 * 新しい側から詰めていき、件数と文字数のどちらかを超えたら止める。
 */
export function trimHistory(
  history: ChatMessage[],
  maxMessages: number = HISTORY_MAX_MESSAGES,
  maxChars: number = HISTORY_MAX_CHARS
): ChatMessage[] {
  const kept: ChatMessage[] = [];
  let chars = 0;

  for (let i = history.length - 1; i >= 0; i--) {
    const m = history[i];
    if (kept.length >= maxMessages) break;
    if (chars + m.content.length > maxChars && kept.length > 0) break;
    kept.push(m);
    chars += m.content.length;
  }

  kept.reverse();

  // 先頭が assistant だと「誰の発言への返答か」が欠けた状態で始まるので落とす
  return kept[0]?.role === "assistant" ? kept.slice(1) : kept;
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
  return provider === "claude" ? claudeClient : geminiClient;
}
