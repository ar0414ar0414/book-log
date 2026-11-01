import { describe, it, expect } from "vitest";
import {
  bookUpdateSchema, bookCreateSchema, quoteCreateSchema, quoteUpdateSchema,
  tagCreateSchema, aiChatSchema, aiOcrSchema, uuidSchema, definedOnly,
} from "@/lib/validation";

const UUID = "123e4567-e89b-42d3-a456-426614174000";

describe("bookUpdateSchema（マスアサインメント対策）", () => {
  it("userId を渡しても結果に含めない", () => {
    const r = bookUpdateSchema.parse({ userId: "someone-else", status: "done" });
    expect(r).not.toHaveProperty("userId");
    expect(r.status).toBe("done");
  });

  it("id / createdAt も落とす", () => {
    const r = bookUpdateSchema.parse({ id: UUID, createdAt: "2020-01-01", memo: "x" });
    expect(r).not.toHaveProperty("id");
    expect(r).not.toHaveProperty("createdAt");
  });

  it("未知のステータスを弾く", () => {
    expect(bookUpdateSchema.safeParse({ status: "deleted" }).success).toBe(false);
  });

  it("評価は 0〜5 のみ", () => {
    expect(bookUpdateSchema.safeParse({ rating: 5 }).success).toBe(true);
    expect(bookUpdateSchema.safeParse({ rating: 6 }).success).toBe(false);
    expect(bookUpdateSchema.safeParse({ rating: -1 }).success).toBe(false);
  });

  it("ページ数は整数のみ", () => {
    expect(bookUpdateSchema.safeParse({ currentPage: 1.5 }).success).toBe(false);
    expect(bookUpdateSchema.safeParse({ currentPage: 120 }).success).toBe(true);
  });

  it("空オブジェクトは通る（呼び出し側で件数を見る）", () => {
    expect(definedOnly(bookUpdateSchema.parse({}))).toEqual({});
  });
});

describe("bookCreateSchema", () => {
  it("タイトルは必須", () => {
    expect(bookCreateSchema.safeParse({ title: "" }).success).toBe(false);
    expect(bookCreateSchema.safeParse({ title: "   " }).success).toBe(false);
  });

  it("status の既定値は want", () => {
    expect(bookCreateSchema.parse({ title: "本" }).status).toBe("want");
  });

  it("極端に長いタイトルを弾く", () => {
    expect(bookCreateSchema.safeParse({ title: "あ".repeat(501) }).success).toBe(false);
  });
});

describe("quoteCreateSchema", () => {
  it("bookId は uuid のみ", () => {
    expect(quoteCreateSchema.safeParse({ bookId: "../../etc", text: "x" }).success).toBe(false);
    expect(quoteCreateSchema.safeParse({ bookId: UUID, text: "x" }).success).toBe(true);
  });

  it("本文は必須で、AI に流れるため上限がある", () => {
    expect(quoteCreateSchema.safeParse({ bookId: UUID, text: "" }).success).toBe(false);
    expect(quoteCreateSchema.safeParse({ bookId: UUID, text: "あ".repeat(20_001) }).success).toBe(false);
  });

  it("本文の前後の空白は落とす", () => {
    expect(quoteCreateSchema.parse({ bookId: UUID, text: "  引用  " }).text).toBe("引用");
  });
});

describe("quoteUpdateSchema", () => {
  it("bookId / userId の差し替えを許さない", () => {
    const r = quoteUpdateSchema.parse({ bookId: UUID, userId: "x", memo: "m" });
    expect(r).not.toHaveProperty("bookId");
    expect(r).not.toHaveProperty("userId");
  });
});

describe("tagCreateSchema", () => {
  it("色は #rgb / #rrggbb のみ", () => {
    expect(tagCreateSchema.safeParse({ name: "t", color: "#fff" }).success).toBe(true);
    expect(tagCreateSchema.safeParse({ name: "t", color: "#6366f1" }).success).toBe(true);
    expect(tagCreateSchema.safeParse({ name: "t", color: "red; background:url(x)" }).success).toBe(false);
    expect(tagCreateSchema.safeParse({ name: "t", color: "javascript:alert(1)" }).success).toBe(false);
  });

  it("名前は必須・64文字まで", () => {
    expect(tagCreateSchema.safeParse({ name: "" }).success).toBe(false);
    expect(tagCreateSchema.safeParse({ name: "あ".repeat(65) }).success).toBe(false);
  });
});

describe("aiChatSchema", () => {
  it("provider の既定値は gemini、未知の値は弾く", () => {
    expect(aiChatSchema.parse({ bookId: UUID, message: "やあ" }).provider).toBe("gemini");
    expect(aiChatSchema.safeParse({ bookId: UUID, message: "やあ", provider: "gpt" }).success).toBe(false);
  });

  it("空メッセージを弾く", () => {
    expect(aiChatSchema.safeParse({ bookId: UUID, message: "   " }).success).toBe(false);
  });
});

describe("aiOcrSchema", () => {
  it("画像サイズに上限がある", () => {
    expect(aiOcrSchema.safeParse({ imageBase64: "a".repeat(14_000_001) }).success).toBe(false);
  });

  it("photoId は省略可だが、渡すなら uuid", () => {
    expect(aiOcrSchema.safeParse({ imageBase64: "a" }).success).toBe(true);
    expect(aiOcrSchema.safeParse({ imageBase64: "a", photoId: "nope" }).success).toBe(false);
  });
});

describe("uuidSchema", () => {
  it("uuid でない文字列を弾く（uuid カラムに渡すと 500 になるため）", () => {
    for (const v of ["", "1", "abc", "../x", "' OR 1=1--", `${UUID}x`]) {
      expect(uuidSchema.safeParse(v).success).toBe(false);
    }
    expect(uuidSchema.safeParse(UUID).success).toBe(true);
  });
});

describe("definedOnly", () => {
  it("undefined のキーだけを落とし、null は残す", () => {
    expect(definedOnly({ a: 1, b: undefined, c: null })).toEqual({ a: 1, c: null });
  });
});
