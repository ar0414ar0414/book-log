"use client";

import { useEffect, useRef, useState } from "react";
import { X, Loader2 } from "lucide-react";
import { BrowserMultiFormatReader } from "@zxing/browser";
import { NotFoundException } from "@zxing/library";

interface Props {
  onDetected: (isbn: string) => void;
  onClose: () => void;
}

export default function BarcodeScanner({ onDetected, onClose }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const readerRef = useRef<BrowserMultiFormatReader | null>(null);
  const [status, setStatus] = useState<"loading" | "scanning" | "error">("loading");
  const [errorMsg, setErrorMsg] = useState("");
  const detectedRef = useRef(false);

  useEffect(() => {
    const reader = new BrowserMultiFormatReader();
    readerRef.current = reader;

    async function start() {
      try {
        const devices = await BrowserMultiFormatReader.listVideoInputDevices();
        if (devices.length === 0) {
          setStatus("error");
          setErrorMsg("カメラが見つかりません");
          return;
        }
        // 背面カメラ優先
        const device =
          devices.find((d) => /back|rear|environment/i.test(d.label)) ??
          devices[devices.length - 1];

        setStatus("scanning");

        await reader.decodeFromVideoDevice(
          device.deviceId,
          videoRef.current!,
          (result, err) => {
            if (detectedRef.current) return;
            if (result) {
              const text = result.getText();
              // EAN-13 / ISBN-13 or ISBN-10
              if (/^(97[89]\d{10}|\d{9}[\dX])$/.test(text)) {
                detectedRef.current = true;
                navigator.vibrate?.(100);
                onDetected(text);
              }
            } else if (err && !(err instanceof NotFoundException)) {
              console.warn(err);
            }
          }
        );
      } catch (e: unknown) {
        setStatus("error");
        const msg = e instanceof Error ? e.message : "";
        if (msg.includes("Permission") || msg.includes("NotAllowed")) {
          setErrorMsg("カメラへのアクセスを許可してください");
        } else {
          setErrorMsg("カメラを起動できませんでした");
        }
      }
    }

    start();

    return () => {
      BrowserMultiFormatReader.releaseAllStreams();
    };
  }, [onDetected]);

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col">
      {/* ヘッダー */}
      <div className="flex items-center justify-between px-4 pt-safe-top py-3">
        <p className="text-white text-sm font-medium">バーコードをスキャン</p>
        <button
          onClick={onClose}
          className="w-9 h-9 flex items-center justify-center rounded-full bg-white/10 text-white"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* カメラ映像 */}
      <div className="flex-1 relative overflow-hidden">
        <video
          ref={videoRef}
          className="w-full h-full object-cover"
          playsInline
          muted
        />

        {/* スキャンガイド枠 */}
        {status === "scanning" && (
          <div className="absolute inset-0 flex items-center justify-center">
            {/* 半透明オーバーレイ（スキャンエリア外を暗く） */}
            <div className="absolute inset-0">
              <div className="absolute inset-0 bg-black/50" />
              <div
                className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-transparent"
                style={{ width: 280, height: 140 }}
              />
            </div>
            {/* スキャン枠 */}
            <div
              className="relative border-2 border-white rounded-lg"
              style={{ width: 280, height: 140 }}
            >
              {/* 四隅のハイライト */}
              <span className="absolute -top-0.5 -left-0.5 w-6 h-6 border-t-4 border-l-4 border-indigo-400 rounded-tl-lg" />
              <span className="absolute -top-0.5 -right-0.5 w-6 h-6 border-t-4 border-r-4 border-indigo-400 rounded-tr-lg" />
              <span className="absolute -bottom-0.5 -left-0.5 w-6 h-6 border-b-4 border-l-4 border-indigo-400 rounded-bl-lg" />
              <span className="absolute -bottom-0.5 -right-0.5 w-6 h-6 border-b-4 border-r-4 border-indigo-400 rounded-br-lg" />
              {/* スキャンライン */}
              <div className="absolute inset-x-2 top-1/2 h-0.5 bg-indigo-400/70 animate-pulse" />
            </div>
          </div>
        )}

        {/* ローディング */}
        {status === "loading" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/70">
            <Loader2 className="w-8 h-8 text-white animate-spin" />
            <p className="text-white text-sm">カメラ起動中...</p>
          </div>
        )}

        {/* エラー */}
        {status === "error" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 px-8 bg-black/80">
            <p className="text-white text-center text-sm">{errorMsg}</p>
            <button
              onClick={onClose}
              className="px-6 py-2.5 bg-white text-slate-900 rounded-full text-sm font-medium"
            >
              閉じる
            </button>
          </div>
        )}
      </div>

      {/* フッター */}
      {status === "scanning" && (
        <div className="px-4 py-4 pb-safe-bottom">
          <p className="text-white/60 text-xs text-center">
            ISBN バーコード（本の裏面）をスキャンエリアに合わせてください
          </p>
        </div>
      )}
    </div>
  );
}
