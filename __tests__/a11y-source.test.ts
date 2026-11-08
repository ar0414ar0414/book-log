import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { execSync } from "node:child_process";

/**
 * アクセシビリティ対応が後戻りしないための検査。
 * レンダリングせずソースを読む静的チェックなので万能ではないが、
 * 「アイコンだけのボタンを無名で足す」「モーダルを role 無しで足す」
 * といった退行はここで止まる。
 */

const tsxFiles = execSync("grep -rl '' components app --include=*.tsx")
  .toString().trim().split("\n");

const read = (f: string) => readFileSync(f, "utf8");

/**
 * 中身がアイコン（JSX 要素）だけかどうか。
 * {label} のように変数で文字を出すボタンは名前があるとみなす。
 */
function isIconOnly(inner: string): boolean {
  let prev: string;
  let cur = inner;
  // 内側から JSX 要素を消していく
  do {
    prev = cur;
    cur = cur.replace(/<([A-Za-z][\w.]*)\b[^<>]*\/>/g, "");
    cur = cur.replace(/<([A-Za-z][\w.]*)\b[^<>]*>([^<>]*)<\/\1>/g, "$2");
  } while (cur !== prev);
  return cur.trim().length === 0;
}

/**
 * 開始タグの終端を探す。onClick={() => ...} の "=>" を終端と誤認しないよう、
 * 波かっこと文字列の内側を読み飛ばしながら走査する。
 */
function findTagEnd(src: string, from: number): number {
  let depth = 0;
  let quote: string | null = null;
  for (let i = from; i < src.length; i++) {
    const c = src[i];
    if (quote) {
      if (c === quote && src[i - 1] !== "\\") quote = null;
      continue;
    }
    if (c === '"' || c === "'" || c === "`") { quote = c; continue; }
    if (c === "{") depth++;
    else if (c === "}") depth--;
    else if (c === ">" && depth === 0) return i;
  }
  return -1;
}

/** ファイル内の <button> を (属性, 中身) に分解する */
function buttons(src: string): { attrs: string; inner: string; line: number }[] {
  const out: { attrs: string; inner: string; line: number }[] = [];
  let i = 0;
  while ((i = src.indexOf("<button", i)) !== -1) {
    const tagEnd = findTagEnd(src, i);
    if (tagEnd === -1) break;
    const close = src.indexOf("</button>", tagEnd);
    if (close === -1) break;
    out.push({
      attrs: src.slice(i, tagEnd),
      inner: src.slice(tagEnd + 1, close),
      line: src.slice(0, i).split("\n").length,
    });
    i = close;
  }
  return out;
}

describe("ボタン", () => {
  it("アイコンだけのボタンには必ず名前が付いている", () => {
    const offenders: string[] = [];
    for (const f of tsxFiles) {
      const src = read(f);
      for (const b of buttons(src)) {
        const named = /aria-label|aria-labelledby|title=/.test(b.attrs);
        if (!named && isIconOnly(b.inner)) offenders.push(`${f}:${b.line}`);
      }
    }
    expect(offenders).toEqual([]);
  });

  it("検査そのものが機能している", () => {
    // アイコンだけ → 検出される
    const [bad] = buttons(`<button onClick={() => x()} className="p"><X className="w-4" /></button>`);
    expect(isIconOnly(bad.inner)).toBe(true);
    expect(/aria-label/.test(bad.attrs)).toBe(false);

    // 変数で文字を出す → 検出しない
    const [ok] = buttons(`<button onClick={() => x()}>{label}</button>`);
    expect(isIconOnly(ok.inner)).toBe(false);

    // 文字列リテラル → 検出しない
    const [ok2] = buttons(`<button>{saving ? "保存中..." : "保存"}</button>`);
    expect(isIconOnly(ok2.inner)).toBe(false);
  });
});

describe("モーダル", () => {
  // オーバーレイ（背景）ではなく本体のコンテナを対象にする
  const modalOwners = [
    "components/books/BarcodeScanner.tsx",
    "components/books/BookDetail.tsx",
    "components/books/ReadingBooksWidget.tsx",
    "components/photos/PhotosTab.tsx",
    "components/quotes/QuotesTab.tsx",
  ];

  it("role=\"dialog\" と aria-modal が揃っている", () => {
    for (const f of modalOwners) {
      const src = read(f);
      const dialogs = (src.match(/role="dialog"/g) ?? []).length;
      const modals = (src.match(/aria-modal="true"/g) ?? []).length;
      expect(dialogs, `${f} に role="dialog" が無い`).toBeGreaterThan(0);
      expect(modals, `${f} の aria-modal の数が role と合わない`).toBe(dialogs);
    }
  });

  it("すべてのダイアログに名前が付いている", () => {
    for (const f of modalOwners) {
      const src = read(f);
      const dialogs = (src.match(/role="dialog"/g) ?? []).length;
      const labels = (src.match(/aria-label=|aria-labelledby=/g) ?? []).length;
      expect(labels, `${f} のラベル数がダイアログ数に足りない`).toBeGreaterThanOrEqual(dialogs);
    }
  });

  it("Escape で閉じられる（useDialog を使っている）", () => {
    for (const f of modalOwners) {
      expect(read(f), `${f} が useDialog を使っていない`).toContain("useDialog");
    }
  });
});

describe("画像", () => {
  it("すべての img に alt がある", () => {
    const offenders: string[] = [];
    for (const f of tsxFiles) {
      const src = read(f);
      const re = /<img\b([\s\S]*?)\/>/g;
      let m: RegExpExecArray | null;
      while ((m = re.exec(src))) {
        if (!/\balt=/.test(m[1])) {
          offenders.push(`${f}:${src.slice(0, m.index).split("\n").length}`);
        }
      }
    }
    expect(offenders).toEqual([]);
  });
});

describe("フォーム", () => {
  it("BookForm の label はすべて入力欄と紐づいている", () => {
    const src = read("components/books/BookForm.tsx");
    const fors = [...src.matchAll(/htmlFor="([^"]+)"/g)].map((m) => m[1]);
    const ids = [...src.matchAll(/\bid="([^"]+)"/g)].map((m) => m[1]);
    expect(fors.length).toBeGreaterThan(0);
    for (const f of fors) expect(ids, `htmlFor="${f}" に対応する id が無い`).toContain(f);
  });

  it("id が重複していない", () => {
    const src = read("components/books/BookForm.tsx");
    const ids = [...src.matchAll(/\bid="([^"]+)"/g)].map((m) => m[1]);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("htmlFor の付いた label は実在する入力欄を指す（ボタン群には付けない）", () => {
    const src = read("components/books/BookForm.tsx");
    // ボタン群は role="group" + aria-labelledby で表現する
    expect(src).toContain('role="group"');
    expect(src).not.toMatch(/htmlFor="book-status"/);
    expect(src).not.toMatch(/htmlFor="book-rating"/);
  });
});
