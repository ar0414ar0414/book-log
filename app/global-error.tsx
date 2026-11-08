"use client";

import { useEffect } from "react";

/**
 * ルートレイアウト自体が失敗したときの最後の砦。
 * このファイルはルートレイアウトを置き換えるため、html / body を自前で持ち、
 * グローバル CSS に頼らずインラインスタイルで描く必要がある。
 */
export default function GlobalError({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  useEffect(() => {
    console.error("[global error]", error.digest ?? "", error);
  }, [error]);

  return (
    <html lang="ja">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#f8fafc",
          color: "#0f172a",
          fontFamily: "system-ui, sans-serif",
          padding: "1rem",
        }}
      >
        <div style={{ textAlign: "center", maxWidth: "24rem" }}>
          <h1 style={{ fontSize: "1.125rem", margin: "0 0 .5rem" }}>
            問題が発生しました
          </h1>
          <p style={{ fontSize: ".875rem", color: "#64748b", margin: "0 0 1.5rem" }}>
            アプリを読み込めませんでした。時間をおいて試してください。
          </p>
          <button
            onClick={() => unstable_retry()}
            style={{
              background: "#4f46e5",
              color: "#fff",
              border: 0,
              padding: ".7rem 1.4rem",
              borderRadius: ".75rem",
              fontSize: ".9rem",
              fontWeight: 500,
              cursor: "pointer",
            }}
          >
            もう一度試す
          </button>
          {error.digest && (
            <p style={{ fontSize: ".75rem", color: "#94a3b8", marginTop: "1.5rem" }}>
              エラーID: <code>{error.digest}</code>
            </p>
          )}
        </div>
      </body>
    </html>
  );
}
