import { describe, it, expect } from "vitest";
import { trimHistory, HISTORY_MAX_MESSAGES, HISTORY_MAX_CHARS, type ChatMessage } from "@/lib/ai/provider";

const msg = (role: "user" | "assistant", content: string): ChatMessage => ({ role, content });
/** user → assistant の往復を n 組つくる */
const pairs = (n: number, len = 10): ChatMessage[] =>
  Array.from({ length: n * 2 }, (_, i) =>
    msg(i % 2 === 0 ? "user" : "assistant", `${i}`.padEnd(len, "x"))
  );

describe("trimHistory", () => {
  it("上限内ならそのまま返す", () => {
    const h = pairs(3);
    expect(trimHistory(h)).toEqual(h);
  });

  it("空配列でも落ちない", () => {
    expect(trimHistory([])).toEqual([]);
  });

  it("件数の上限を超えたら古い方から落とす", () => {
    const h = pairs(30); // 60件
    const r = trimHistory(h, 10, 1_000_000);
    expect(r.length).toBeLessThanOrEqual(10);
    // 残るのは新しい側
    expect(r[r.length - 1]).toEqual(h[h.length - 1]);
  });

  it("文字数の上限を超えたら古い方から落とす", () => {
    // 文字数の規則だけを見るため、残った先頭が user になる並びにしてある
    const h = [
      msg("assistant", "a".repeat(100)),
      msg("user", "b".repeat(100)),
      msg("assistant", "c".repeat(100)),
    ];
    const r = trimHistory(h, 100, 250);
    expect(r.map((m) => m.content[0])).toEqual(["b", "c"]);
  });

  it("文字数で切った結果の先頭が assistant なら、それも落とす", () => {
    const h = [
      msg("user", "a".repeat(100)),
      msg("assistant", "b".repeat(100)),
      msg("user", "c".repeat(100)),
    ];
    // 文字数では [b, c] まで残るが、先頭が assistant なので c だけになる
    expect(trimHistory(h, 100, 250).map((m) => m.content[0])).toEqual(["c"]);
  });

  it("先頭が assistant にならない（返答から始まる履歴は文脈が欠ける）", () => {
    const h = [msg("user", "x"), msg("assistant", "y"), msg("user", "z"), msg("assistant", "w")];
    // 3件だけ残すと [assistant, user, assistant] になるので、先頭が落ちる
    const r = trimHistory(h, 3, 1_000_000);
    expect(r[0].role).toBe("user");
  });

  it("1件が上限より長くても、最低1件は残す（空送信を避ける）", () => {
    const h = [msg("user", "a".repeat(50_000))];
    expect(trimHistory(h, 10, 100)).toHaveLength(1);
  });

  it("直近の発言は必ず含まれる", () => {
    const h = pairs(50);
    const last = h[h.length - 1];
    expect(trimHistory(h)).toContainEqual(last);
  });

  it("並び順は時系列のまま（逆順にならない）", () => {
    const h = pairs(20);
    const r = trimHistory(h);
    const idx = r.map((m) => h.indexOf(m));
    expect(idx).toEqual([...idx].sort((a, b) => a - b));
  });

  it("既定の上限が設定されている", () => {
    expect(HISTORY_MAX_MESSAGES).toBeGreaterThan(0);
    expect(HISTORY_MAX_CHARS).toBeGreaterThan(1000);
    const huge = pairs(200, 500); // 400件 × 500文字 = 20万文字
    const r = trimHistory(huge);
    expect(r.length).toBeLessThanOrEqual(HISTORY_MAX_MESSAGES);
    expect(r.reduce((s, m) => s + m.content.length, 0)).toBeLessThanOrEqual(HISTORY_MAX_CHARS);
  });
});
