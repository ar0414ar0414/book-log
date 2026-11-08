import { describe, it, expect } from "vitest";
import { classifyAiError, getAiClient } from "@/lib/ai/provider";

describe("classifyAiError", () => {
  it.each([
    ["429 Too Many Requests"],
    ["quota exceeded for this project"],
    ["RESOURCE_EXHAUSTED"],
    ["rate_limit_error"],
    ["the model is overloaded"],
  ])("上限系のメッセージを quota_exceeded にする: %s", (msg) => {
    expect(classifyAiError(new Error(msg)).code).toBe("quota_exceeded");
  });

  it("それ以外は api_error", () => {
    expect(classifyAiError(new Error("socket hang up")).code).toBe("api_error");
  });

  it("Error 以外を投げられても落ちない", () => {
    expect(classifyAiError("429").code).toBe("quota_exceeded");
    expect(classifyAiError(null).code).toBe("api_error");
    expect(classifyAiError({ weird: true }).code).toBe("api_error");
  });

  it("どのケースでもユーザー向けメッセージが入る", () => {
    for (const e of [new Error("429"), new Error("boom")]) {
      expect(classifyAiError(e).message.length).toBeGreaterThan(0);
    }
  });
});

describe("getAiClient", () => {
  it("プロバイダーごとに別のクライアントを返す", () => {
    expect(getAiClient("claude")).not.toBe(getAiClient("gemini"));
  });

  it("どちらも AiClient のメソッドを備えている", () => {
    for (const p of ["gemini", "claude"] as const) {
      const c = getAiClient(p);
      expect(typeof c.generateText).toBe("function");
      expect(typeof c.chatStream).toBe("function");
      expect(typeof c.visionOcr).toBe("function");
    }
  });
});
