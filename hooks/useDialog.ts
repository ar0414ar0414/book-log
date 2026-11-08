"use client";

import { useEffect, useRef } from "react";

/**
 * モーダルの最低限の作法をまとめる。
 * - Escape で閉じる
 * - 開いている間は背面をスクロールさせない
 * - 閉じたら元のフォーカス位置へ戻す
 * - 開いたらモーダル自身にフォーカスを移す（読み上げの起点になる）
 *
 * 完全なフォーカストラップ（Tab の循環）は含まない。
 */
export function useDialog<T extends HTMLElement>(open: boolean, onClose: () => void) {
  const ref = useRef<T>(null);
  // onClose は毎レンダリング変わり得るので、購読し直さないよう ref 経由で読む。
  // 描画中に ref を書き換えてはいけないため、更新は effect で行う
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  });

  useEffect(() => {
    if (!open) return;

    const previouslyFocused = document.activeElement as HTMLElement | null;

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.stopPropagation();
        onCloseRef.current();
      }
    }
    document.addEventListener("keydown", onKeyDown);

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    ref.current?.focus();

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = prevOverflow;
      // 閉じた後に元の場所へ戻す。要素が消えている場合もあるので握りつぶす
      try {
        previouslyFocused?.focus?.();
      } catch {
        /* noop */
      }
    };
  }, [open]);

  return ref;
}
