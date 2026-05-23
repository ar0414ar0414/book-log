import Anthropic from "@anthropic-ai/sdk";
import type { AiClient, ChatMessage } from "@/lib/ai/provider";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });
const MODEL = "claude-haiku-4-5-20251001";

export const claudeClient: AiClient = {
  async generateText(prompt) {
    const msg = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 2048,
      messages: [{ role: "user", content: prompt }],
    });
    return (msg.content[0] as { type: "text"; text: string }).text;
  },

  async chatWithHistory(systemPrompt, history, message) {
    const messages: Anthropic.MessageParam[] = [
      ...history.map((m) => ({ role: m.role as "user" | "assistant", content: m.content })),
      { role: "user", content: message },
    ];
    const msg = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 1024,
      system: systemPrompt,
      messages,
    });
    return (msg.content[0] as { type: "text"; text: string }).text;
  },

  async visionOcr(imageBase64, mimeType, prompt) {
    const msg = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 1024,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image",
              source: { type: "base64", media_type: mimeType as "image/jpeg" | "image/png" | "image/gif" | "image/webp", data: imageBase64 },
            },
            { type: "text", text: prompt },
          ],
        },
      ],
    });
    return (msg.content[0] as { type: "text"; text: string }).text;
  },
};
