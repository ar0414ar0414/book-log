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

export function getAiClient(provider: AiProvider): AiClient {
  if (provider === "claude") {
    const { claudeClient } = require("@/lib/claude/client");
    return claudeClient;
  }
  const { geminiClient } = require("@/lib/gemini/client");
  return geminiClient;
}
