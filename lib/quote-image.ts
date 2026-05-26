// Markdown記法を除去してプレーンテキストに変換
function stripMarkdown(text: string): string {
  return text
    .replace(/\*\*(.*?)\*\*/g, "$1")
    .replace(/\*(.*?)\*/g, "$1")
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/^[-*+]\s/gm, "・")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

// Canvas上でテキストを折り返して描画し、末尾のY座標を返す
function drawWrappedText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number,
  maxLines: number
): number {
  // 文字単位で折り返し（日本語対応）
  const chars = Array.from(text); // サロゲートペア対応
  let line = "";
  let currentY = y;
  let lineCount = 0;

  for (let i = 0; i < chars.length; i++) {
    const char = chars[i];
    if (char === "\n") {
      ctx.fillText(line, x, currentY);
      line = "";
      currentY += lineHeight;
      lineCount++;
      if (lineCount >= maxLines) break;
      continue;
    }
    const testLine = line + char;
    if (ctx.measureText(testLine).width > maxWidth && line !== "") {
      // 省略記号を最終行末尾に付与
      if (lineCount === maxLines - 1 && i < chars.length - 1) {
        let truncated = line;
        while (ctx.measureText(truncated + "…").width > maxWidth) {
          truncated = truncated.slice(0, -1);
        }
        ctx.fillText(truncated + "…", x, currentY);
      } else {
        ctx.fillText(line, x, currentY);
      }
      line = char;
      currentY += lineHeight;
      lineCount++;
      if (lineCount >= maxLines) break;
    } else {
      line = testLine;
    }
  }
  if (line && lineCount < maxLines) {
    ctx.fillText(line, x, currentY);
    currentY += lineHeight;
  }
  return currentY;
}

export async function generateQuoteImage(
  quoteText: string,
  bookTitle: string,
  author: string | null
): Promise<Blob> {
  const W = 1080;
  const H = 1080;
  const PAD = 96;

  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d")!;

  // ── 背景グラデーション ──
  const bg = ctx.createLinearGradient(0, H, W, 0);
  bg.addColorStop(0, "#0f172a"); // slate-950
  bg.addColorStop(1, "#1e1b4b"); // indigo-950
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  // ── 左アクセントバー ──
  const barGrad = ctx.createLinearGradient(0, PAD, 0, H - PAD);
  barGrad.addColorStop(0, "#818cf8"); // indigo-400
  barGrad.addColorStop(1, "#4f46e5"); // indigo-600
  ctx.fillStyle = barGrad;
  ctx.fillRect(PAD, PAD, 6, H - PAD * 2);

  // ── 装飾クォートマーク ──
  ctx.fillStyle = "rgba(99, 102, 241, 0.12)";
  ctx.font = `bold 480px Georgia, 'Times New Roman', serif`;
  ctx.fillText("“", PAD - 24, 520);

  // ── 引用テキスト ──
  const cleanText = stripMarkdown(quoteText);
  const textX = PAD + 36;
  const maxTextW = W - textX - PAD;
  const charLen = cleanText.length;
  const fontSize = charLen > 120 ? 42 : charLen > 70 ? 50 : 58;
  const lineHeight = Math.round(fontSize * 1.75);
  const maxLines = Math.floor((620 - fontSize) / lineHeight);

  ctx.fillStyle = "#f1f5f9"; // slate-100
  ctx.font = `${fontSize}px -apple-system, 'Hiragino Sans', 'Yu Gothic', sans-serif`;
  const textEndY = drawWrappedText(ctx, cleanText, textX, PAD + 80, maxTextW, lineHeight, maxLines);

  // ── セパレータ ──
  const sepY = Math.min(Math.max(textEndY + 56, 720), 820);
  const sepGrad = ctx.createLinearGradient(textX, 0, W - PAD, 0);
  sepGrad.addColorStop(0, "#6366f1");
  sepGrad.addColorStop(1, "rgba(99,102,241,0)");
  ctx.strokeStyle = sepGrad;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(textX, sepY);
  ctx.lineTo(W - PAD, sepY);
  ctx.stroke();

  // ── 書名・著者 ──
  ctx.fillStyle = "#a5b4fc"; // indigo-300
  ctx.font = `bold 38px -apple-system, 'Hiragino Sans', 'Yu Gothic', sans-serif`;
  const titleMaxW = W - textX - PAD;
  let titleStr = bookTitle;
  while (ctx.measureText(titleStr).width > titleMaxW && titleStr.length > 0) {
    titleStr = titleStr.slice(0, -1);
  }
  if (titleStr !== bookTitle) titleStr += "…";
  ctx.fillText(titleStr, textX, sepY + 68);

  if (author) {
    ctx.fillStyle = "#818cf8"; // indigo-400
    ctx.font = `34px -apple-system, 'Hiragino Sans', 'Yu Gothic', sans-serif`;
    let authorStr = author;
    while (ctx.measureText(authorStr).width > titleMaxW && authorStr.length > 0) {
      authorStr = authorStr.slice(0, -1);
    }
    if (authorStr !== author) authorStr += "…";
    ctx.fillText(authorStr, textX, sepY + 116);
  }

  // ── Folioブランド ──
  ctx.fillStyle = "rgba(148, 163, 184, 0.5)";
  ctx.font = `28px -apple-system, 'Hiragino Sans', 'Yu Gothic', sans-serif`;
  ctx.textAlign = "right";
  ctx.fillText("Folio", W - PAD, H - PAD + 12);
  ctx.textAlign = "left";

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("canvas toBlob failed"))),
      "image/png"
    );
  });
}

export async function shareQuoteImage(blob: Blob, bookTitle: string) {
  const file = new File([blob], "folio-quote.png", { type: "image/png" });
  if (navigator.share && navigator.canShare?.({ files: [file] })) {
    await navigator.share({ files: [file], title: `引用 — ${bookTitle}` });
  } else {
    // フォールバック: ダウンロード
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "folio-quote.png";
    a.click();
    URL.revokeObjectURL(url);
  }
}
