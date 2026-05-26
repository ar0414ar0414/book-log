"use client";

import { useState, useRef, useEffect } from "react";
import { Camera, Upload, Trash2, FileText, Loader2, Image as ImageIcon, MessageSquare, X, AlertCircle, Check, Quote } from "lucide-react";
import { useRouter } from "next/navigation";
import ReactMarkdown from "react-markdown";
import imageCompression from "browser-image-compression";
import AutoResizeTextarea from "@/components/ui/AutoResizeTextarea";
import { useAiProvider } from "@/hooks/useAiProvider";

interface PhotoItem {
  id: string; url: string; caption: string | null; extractedText: string | null; createdAt: Date;
}

export default function PhotosTab({ bookId, initialPhotos, onOcrToQuote }: { bookId: string; initialPhotos: PhotoItem[]; onOcrToQuote?: (text: string) => void }) {
  const [photoList, setPhotoList] = useState(initialPhotos);
  const [uploading, setUploading] = useState(false);
  const [ocrLoading, setOcrLoading] = useState<string | null>(null);
  const [ocrError, setOcrError] = useState<string | null>(null);
  const [selectedPhoto, setSelectedPhoto] = useState<PhotoItem | null>(null);
  const [captionDraft, setCaptionDraft] = useState("");
  const [captionSaving, setCaptionSaving] = useState(false);
  const [captionSaved, setCaptionSaved] = useState(false);
  const [fullscreenPhoto, setFullscreenPhoto] = useState<string | null>(null);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const { provider } = useAiProvider();
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const deletingRef = useRef(false);

  // マウント時にサーバーから最新の写真一覧を取得（Router Cache が古くても正しい状態に同期）
  useEffect(() => {
    fetch(`/api/photos?bookId=${bookId}`)
      .then((r) => r.json())
      .then((fresh) => setPhotoList(fresh as PhotoItem[]))
      .catch(() => {});
  }, [bookId]);

  // 写真が切り替わったらキャプションをリセット
  useEffect(() => {
    if (selectedPhoto) {
      setCaptionDraft(selectedPhoto.caption ?? "");
      setCaptionSaved(false);
    }
  }, [selectedPhoto?.id]);

  async function handleUpload(files: FileList | null) {
    if (!files || files.length === 0) return;
    setUploading(true);
    try {
      for (const file of Array.from(files)) {
        const compressed = await imageCompression(file, {
          maxSizeMB: 1,
          maxWidthOrHeight: 1920,
          useWebWorker: true,
        });
        const formData = new FormData();
        formData.append("file", compressed, file.name);
        formData.append("bookId", bookId);
        const res = await fetch("/api/photos", { method: "POST", body: formData });
        if (!res.ok) continue;
        const photo = await res.json();
        setPhotoList((p) => [...p, photo]);
      }
      router.refresh();
    } finally {
      setUploading(false);
    }
  }

  async function handleOcr(photo: PhotoItem) {
    setOcrLoading(photo.id);
    setOcrError(null);
    try {
      const response = await fetch(photo.url);
      const blob = await response.blob();
      const reader = new FileReader();
      reader.readAsDataURL(blob);
      reader.onload = async () => {
        const base64 = (reader.result as string).split(",")[1];
        const res = await fetch("/api/ai/ocr", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ photoId: photo.id, imageBase64: base64, mimeType: blob.type, provider }),
        });
        const data = await res.json();
        if (!res.ok) { setOcrError(data.message ?? "エラーが発生しました"); setOcrLoading(null); return; }
        setPhotoList((p) => p.map((item) => item.id === photo.id ? { ...item, extractedText: data.text } : item));
        if (selectedPhoto?.id === photo.id) setSelectedPhoto((p) => p ? { ...p, extractedText: data.text } : p);
        setOcrLoading(null);
      };
    } catch {
      setOcrError("AI処理中にエラーが発生しました。もう一度お試しください。");
      setOcrLoading(null);
    }
  }

  // 変更があった場合のみ保存・削除中はスキップ
  async function saveCaption(photoId: string) {
    if (deletingRef.current) return;
    const trimmed = captionDraft.trim();
    const current = photoList.find((p) => p.id === photoId)?.caption ?? "";
    if (trimmed === current) return;

    setCaptionSaving(true);
    try {
      const res = await fetch(`/api/photos/${photoId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ caption: trimmed || null }),
      });
      if (!res.ok) return;
      const updated = await res.json();
      setPhotoList((p) => p.map((item) => item.id === photoId ? { ...item, caption: updated.caption } : item));
      setSelectedPhoto((p) => p ? { ...p, caption: updated.caption } : p);
      setCaptionSaved(true);
      setTimeout(() => setCaptionSaved(false), 2000);
    } finally {
      setCaptionSaving(false);
    }
  }

  async function handleDelete(id: string) {
    deletingRef.current = true;
    setDeleting(true);
    try {
      await fetch(`/api/photos/${id}`, { method: "DELETE" });
      // API完了後にUIを更新 → router.refresh()が現在ページで確実に実行される
      setPhotoList((p) => p.filter((item) => item.id !== id));
      setSelectedPhoto(null);
      setConfirmingDelete(false);
      router.refresh();
    } finally {
      deletingRef.current = false;
      setDeleting(false);
    }
  }

  function closeModal() {
    if (selectedPhoto) saveCaption(selectedPhoto.id);
    setSelectedPhoto(null);
    setConfirmingDelete(false);
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <button
          onClick={() => { if (inputRef.current) { inputRef.current.accept = "image/*"; inputRef.current.capture = "environment"; inputRef.current.click(); } }}
          className="flex-1 flex items-center justify-center gap-2 bg-indigo-600 dark:bg-indigo-500 text-white py-2.5 rounded-xl text-sm font-medium hover:bg-indigo-700 dark:hover:bg-indigo-600 transition-colors"
        >
          <Camera className="w-4 h-4" />
          撮影する
        </button>
        <button
          onClick={() => { if (inputRef.current) { inputRef.current.removeAttribute("capture"); inputRef.current.click(); } }}
          className="flex-1 flex items-center justify-center gap-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-300 py-2.5 rounded-xl text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
          disabled={uploading}
        >
          {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
          アップロード
        </button>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => handleUpload(e.target.files)}
      />

      {photoList.length === 0 ? (
        <div className="text-center py-12">
          <ImageIcon className="w-10 h-10 text-slate-200 dark:text-slate-700 mx-auto mb-2" />
          <p className="text-slate-400 dark:text-slate-500 text-sm">写真がありません</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-2">
          {photoList.map((photo) => (
            <div
              key={photo.id}
              className="relative rounded-xl overflow-hidden border border-slate-100 dark:border-slate-700 cursor-pointer"
              onClick={() => setSelectedPhoto(photo)}
            >
              <img src={photo.url} alt={photo.caption ?? ""} className="w-full aspect-[4/3] object-cover" />
              {(photo.caption || photo.extractedText) && (
                <div className="absolute bottom-0 left-0 right-0 bg-black/50 px-2 py-1">
                  <p className="text-white text-xs line-clamp-1">
                    {photo.caption ?? photo.extractedText}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* fullscreen image viewer */}
      {fullscreenPhoto && (
        <div
          className="fixed inset-0 z-[60] bg-black flex items-center justify-center"
          onClick={() => setFullscreenPhoto(null)}
        >
          <button
            className="absolute top-4 right-4 p-2 text-white/70 hover:text-white bg-black/40 rounded-full"
            onClick={() => setFullscreenPhoto(null)}
          >
            <X className="w-5 h-5" />
          </button>
          <img
            src={fullscreenPhoto}
            alt=""
            className="max-w-full max-h-full object-contain"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}

      {/* photo modal */}
      {selectedPhoto && (
        <div
          className="fixed inset-0 z-50 bg-black/70 flex items-end sm:items-center justify-center p-4"
          onClick={closeModal}
        >
          <div
            className="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-lg flex flex-col max-h-[90vh]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* ヘッダー（常に表示） */}
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-slate-100 dark:border-slate-700 flex-shrink-0 min-h-[52px]">
              {confirmingDelete ? (
                /* 削除確認UI */
                <>
                  <p className="text-sm font-medium text-red-600 dark:text-red-400">削除しますか？</p>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setConfirmingDelete(false)}
                      className="px-3 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-700 rounded-lg transition-colors"
                    >
                      キャンセル
                    </button>
                    <button
                      onClick={() => handleDelete(selectedPhoto.id)}
                      disabled={deleting}
                      className="px-3 py-1.5 text-xs font-medium text-white bg-red-500 hover:bg-red-600 rounded-lg transition-colors disabled:opacity-60 flex items-center gap-1"
                    >
                      {deleting ? <Loader2 className="w-3 h-3 animate-spin" /> : "削除する"}
                    </button>
                  </div>
                </>
              ) : (
                /* 通常UI */
                <>
                  <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">写真詳細</p>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setConfirmingDelete(true)}
                      className="p-2.5 text-red-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-xl transition-colors"
                      title="削除"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                    <button
                      onClick={closeModal}
                      className="p-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition-colors"
                      title="閉じる"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                </>
              )}
            </div>

            {/* スクロール可能エリア */}
            <div className="overflow-y-auto flex-1 rounded-b-2xl">
            {/* 画像（タップで拡大） */}
            <img
              src={selectedPhoto.url}
              alt=""
              className="w-full max-h-64 object-contain bg-black cursor-zoom-in"
              onClick={() => setFullscreenPhoto(selectedPhoto.url)}
            />

            {/* コンテンツ */}
            <div className="p-4 space-y-3">
              {ocrError && (
                <div className="flex items-start gap-2.5 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-xl px-3 py-2.5">
                  <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-xs text-red-700 dark:text-red-300">{ocrError}</p>
                    <button onClick={() => setOcrError(null)} className="text-xs text-red-400 hover:text-red-600 mt-0.5">閉じる</button>
                  </div>
                </div>
              )}

              {/* メモ（常時編集可能） */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between h-4">
                  <p className="text-xs font-medium text-slate-500 dark:text-slate-400 flex items-center gap-1">
                    <MessageSquare className="w-3 h-3" />メモ
                  </p>
                  {captionSaving && <Loader2 className="w-3 h-3 text-slate-400 animate-spin" />}
                  {captionSaved && !captionSaving && (
                    <span className="text-xs text-emerald-500 flex items-center gap-0.5">
                      <Check className="w-3 h-3" />保存済み
                    </span>
                  )}
                </div>
                <AutoResizeTextarea
                  value={captionDraft}
                  onChange={(e) => setCaptionDraft(e.target.value)}
                  onBlur={() => saveCaption(selectedPhoto.id)}
                  rows={2}
                  placeholder="この写真のメモを入力..."
                  className="w-full border border-slate-200 dark:border-slate-600 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-indigo-400 dark:focus:border-indigo-500 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500"
                />
              </div>

              {/* OCR */}
              {selectedPhoto.extractedText ? (
                <div className="bg-slate-50 dark:bg-slate-700 rounded-xl p-3 space-y-2">
                  <p className="text-xs font-medium text-slate-500 dark:text-slate-400 flex items-center gap-1">
                    <FileText className="w-3 h-3" />抽出テキスト
                  </p>
                  <div className="text-sm text-slate-700 dark:text-slate-300">
                    <ReactMarkdown
                      components={{
                        p: ({ children }) => <p className="leading-relaxed mb-1 last:mb-0">{children}</p>,
                        h1: ({ children }) => <p className="font-bold text-base mb-1">{children}</p>,
                        h2: ({ children }) => <p className="font-bold mb-1">{children}</p>,
                        h3: ({ children }) => <p className="font-semibold mb-0.5">{children}</p>,
                        ul: ({ children }) => <ul className="list-disc list-inside space-y-0.5 mb-1">{children}</ul>,
                        ol: ({ children }) => <ol className="list-decimal list-inside space-y-0.5 mb-1">{children}</ol>,
                        strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
                        hr: () => <hr className="my-1 border-slate-200 dark:border-slate-600" />,
                      }}
                    >{selectedPhoto.extractedText}</ReactMarkdown>
                  </div>
                  {onOcrToQuote && (
                    <button
                      onClick={() => { onOcrToQuote(selectedPhoto.extractedText!); setSelectedPhoto(null); }}
                      className="w-full flex items-center justify-center gap-1.5 text-xs text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-700 rounded-lg py-1.5 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 transition-colors"
                    >
                      <Quote className="w-3 h-3" />
                      引用として追加
                    </button>
                  )}
                </div>
              ) : (
                <button
                  onClick={() => handleOcr(selectedPhoto)}
                  disabled={ocrLoading === selectedPhoto.id}
                  className="w-full flex items-center justify-center gap-2 border border-indigo-200 dark:border-indigo-700 text-indigo-600 dark:text-indigo-400 py-2.5 rounded-xl text-sm font-medium hover:bg-indigo-50 dark:hover:bg-indigo-950/30 transition-colors disabled:opacity-50"
                >
                  {ocrLoading === selectedPhoto.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
                  AIでテキスト抽出
                </button>
              )}
            </div>
            </div>{/* /overflow-y-auto */}
          </div>
        </div>
      )}
    </div>
  );
}
