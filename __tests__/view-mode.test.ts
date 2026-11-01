import { describe, it, expect } from "vitest";
import { isViewMode, viewModeCookie, VIEW_MODE_COOKIE } from "@/lib/view-mode";

describe("isViewMode", () => {
  it("grid / list だけを受け付ける", () => {
    expect(isViewMode("grid")).toBe(true);
    expect(isViewMode("list")).toBe(true);
  });

  it("壊れた Cookie 値を弾く", () => {
    for (const v of [undefined, null, "", "GRID", "table", 1, {}]) {
      expect(isViewMode(v)).toBe(false);
    }
  });
});

describe("viewModeCookie", () => {
  it("Cookie 名と値を含む", () => {
    expect(viewModeCookie("list")).toContain(`${VIEW_MODE_COOKIE}=list`);
  });

  it("サイト全体で有効", () => {
    expect(viewModeCookie("grid")).toContain("path=/");
  });

  it("1年間保持する", () => {
    expect(viewModeCookie("grid")).toContain("max-age=31536000");
  });

  it("samesite=lax を付ける", () => {
    expect(viewModeCookie("grid")).toContain("samesite=lax");
  });

  it("書き出した値がそのまま読み戻せる", () => {
    for (const mode of ["grid", "list"] as const) {
      const value = viewModeCookie(mode).split(";")[0].split("=")[1];
      expect(isViewMode(value)).toBe(true);
      expect(value).toBe(mode);
    }
  });
});
