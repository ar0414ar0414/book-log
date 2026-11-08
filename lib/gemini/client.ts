import { GoogleGenerativeAI } from "@google/generative-ai";
import type { AiClient, ChatMessage } from "@/lib/ai/provider";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export const geminiModel = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
export const geminiVisionModel = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

export const geminiClient: AiClient = {
  async generateText(prompt) {
    const result = await geminiModel.generateContent(prompt);
    return result.response.text();
  },

  async *chatStream(systemPrompt, history, message) {
    const chat = geminiModel.startChat({
      history: [
        { role: "user", parts: [{ text: systemPrompt }] },
        { role: "model", parts: [{ text: "はい、喜んでお手伝いします！この本についてどのようなことでも聞いてください。" }] },
        ...history.map((m): { role: "user" | "model"; parts: { text: string }[] } => ({
          role: m.role === "assistant" ? "model" : "user",
          parts: [{ text: m.content }],
        })),
      ],
    });
    const result = await chat.sendMessageStream(message);
    for await (const chunk of result.stream) {
      const text = chunk.text();
      if (text) yield text;
    }
  },

  async visionOcr(imageBase64, mimeType, prompt) {
    const result = await geminiVisionModel.generateContent([
      prompt,
      { inlineData: { data: imageBase64, mimeType } },
    ]);
    return result.response.text();
  },
};
