import { describe, it, expect } from "vitest";
import { localizeGenre, formatDate, STATUS_LABELS } from "@/lib/utils";

describe("localizeGenre", () => {
  it("既知のジャンルを日本語にする", () => {
    expect(localizeGenre("Business & Economics")).toBe("ビジネス・経済");
    expect(localizeGenre("Computers")).toBe("IT・コンピュータ");
  });

  it("前後の空白を無視して引ける", () => {
    expect(localizeGenre("  Psychology  ")).toBe("心理学");
  });

  it("未知のジャンルはそのまま返す", () => {
    expect(localizeGenre("Gardening")).toBe("Gardening");
  });

  it("null / undefined / 空文字は null", () => {
    expect(localizeGenre(null)).toBeNull();
    expect(localizeGenre(undefined)).toBeNull();
    expect(localizeGenre("")).toBeNull();
  });
});

describe("formatDate", () => {
  it("null はダッシュ", () => {
    expect(formatDate(null)).toBe("—");
  });

  it("Date と ISO 文字列で同じ結果になる", () => {
    const d = new Date("2026-03-09T12:00:00Z");
    expect(formatDate(d)).toBe(formatDate(d.toISOString()));
  });
});

describe("STATUS_LABELS", () => {
  it("3つのステータスを網羅している", () => {
    expect(STATUS_LABELS).toMatchObject({ want: "積読", reading: "読中", done: "読了" });
  });
});
