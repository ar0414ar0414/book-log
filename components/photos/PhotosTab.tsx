"use client";

import { useState, useRef } from "react";
import { Camera, Upload, Trash2, FileText, Loader2, Image as ImageIcon, MessageSquare, Check, X, AlertCircle } from "lucide-react";
import AutoResizeTextarea from "@/components/ui/AutoResizeTextarea";
import { useAiProvider } from "@/hooks/useAiProvider";

interface PhotoItem {
  id: string; url: string; caption: string | null; extractedText: string | null; createdAt: Date;
}

export default function PhotosTab({ bookId, initialPhotos }: { bookId: string; initialPhotos: PhotoItem[] }) {
  const [photoList, setPhotoList] = useState(initialPhotos);
  const [uploading, setUploading] = useState(false);
  const [ocrLoading, setOcrLoading] = useState<string | null>(null);
  const [selectedPhoto, setSelectedPhoto] = useState<PhotoItem | null>(null);
  const { provider } = useAiProvider();
  const [ocrError, setOcrError] = useState<string | null>(null);
  const [captionEditing, setCaptionEditing] = useState(false);
  const [captionDraft, setCaptionDraft] = useState("");
  const [captionSaving, setCaptionSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleUpload(files: FileList | null) {
    if (!files || files.length === 0) return;
    setUploading(true);
    try {
      for (const file of Array.from(files)) {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("bookId", bookId);
        const res = await fetch("/api/photos", { method: "POST", body: formData });
        const photo = await res.json();
        setPhotoList((p) => [...p, photo]);
      }
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

  function openCaptionEdit(photo: PhotoItem) {
    setCaptionDraft(photo.caption ?? "");
    setCaptionEditing(true);
  }

  async function saveCaption(photoId: string) {
    setCaptionSaving(true);
    try {
      const res = await fetch(`/api/photos/${photoId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ caption: captionDraft.trim() || null }),
      });
      const updated = await res.json();
      setPhotoList((p) => p.map((item) => item.id === photoId ? { ...item, caption: updated.caption } : item));
      setSelectedPhoto((p) => p ? { ...p, caption: updated.caption } : p);
      setCaptionEditing(false);
    } finally {
      setCaptionSaving(false);
    }
  }

  async function handleDelete(id: string) {
    await fetch(`/api/photos/${id}`, { method: "DELETE" });
    setPhotoList((p) => p.filter((item) => item.id !== id));
    if (selectedPhoto?.id === id) setSelectedPhoto(null);
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <button
          onClick={() => { if (inputRef.current) { inputRef.current.accept = "image/*"; inputRef.current.capture = "environment"; inputRef.current.click(); } }}
          className="flex-1 flex items-center justify-center gap-2 bg-indigo-600 text-white py-2.5 rounded-xl text-sm font-medium hover:bg-indigo-700 transition-colors"
        >
          <Camera className="w-4 h-4" />
          撮影する
        </button>
        <button
          onClick={() => { if (inputRef.current) { inputRef.current.removeAttribute("capture"); inputRef.current.click(); } }}
          className="flex-1 flex items-center justify-center gap-2 bg-white border border-slate-200 text-slate-700 py-2.5 rounded-xl text-sm font-medium hover:bg-slate-50 transition-colors"
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
          <ImageIcon className="w-10 h-10 text-slate-200 mx-auto mb-2" />
          <p className="text-slate-400 text-sm">写真がありません</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-2">
          {photoList.map((photo) => (
            <div
              key={photo.id}
              className="relative rounded-xl overflow-hidden border border-slate-100 cursor-pointer"
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

      {/* photo modal */}
      {selectedPhoto && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-end sm:items-center justify-center p-4" onClick={() => { setSelectedPhoto(null); setCaptionEditing(false); }}>
          <div className="bg-white rounded-2xl w-full max-w-lg overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <img src={selectedPhoto.url} alt="" className="w-full max-h-64 object-contain bg-black" />
            <div className="p-4 space-y-3">
              {ocrError && (
                <div className="flex items-start gap-2.5 bg-red-50 border border-red-200 rounded-xl px-3 py-2.5">
                  <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-xs text-red-700">{ocrError}</p>
                    <button onClick={() => setOcrError(null)} className="text-xs text-red-400 hover:text-red-600 mt-0.5">閉じる</button>
                  </div>
                </div>
              )}
              {/* メモ欄 */}
              <div>
                {captionEditing ? (
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-slate-500 flex items-center gap-1">
                      <MessageSquare className="w-3 h-3" />メモ
                    </p>
                    <AutoResizeTextarea
                      value={captionDraft}
                      onChange={(e) => setCaptionDraft(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); saveCaption(selectedPhoto.id); }
                        if (e.key === "Escape") setCaptionEditing(false);
                      }}
                      rows={3}
                      placeholder="この写真のメモを入力..."
                      autoFocus
                      className="w-full border border-indigo-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-indigo-400"
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => setCaptionEditing(false)}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl border border-slate-200 text-slate-600 text-sm hover:bg-slate-50 transition-colors"
                      >
                        <X className="w-3.5 h-3.5" />キャンセル
                      </button>
                      <button
                        onClick={() => saveCaption(selectedPhoto.id)}
                        disabled={captionSaving}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors"
                      >
                        {captionSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                        保存
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => openCaptionEdit(selectedPhoto)}
                    className="w-full flex items-start gap-2 px-3 py-2.5 rounded-xl border border-dashed border-slate-200 hover:border-indigo-300 hover:bg-indigo-50 transition-colors text-left group"
                  >
                    <MessageSquare className="w-4 h-4 text-slate-400 group-hover:text-indigo-500 flex-shrink-0 mt-0.5 transition-colors" />
                    {selectedPhoto.caption ? (
                      <p className="text-sm text-slate-700 leading-relaxed">{selectedPhoto.caption}</p>
                    ) : (
                      <p className="text-sm text-slate-400 group-hover:text-indigo-500 transition-colors">メモを追加...</p>
                    )}
                  </button>
                )}
              </div>

              {/* OCR */}
              {selectedPhoto.extractedText ? (
                <div className="bg-slate-50 rounded-xl p-3">
                  <p className="text-xs font-medium text-slate-500 mb-1 flex items-center gap-1"><FileText className="w-3 h-3" />抽出テキスト</p>
                  <p className="text-sm text-slate-700 whitespace-pre-wrap">{selectedPhoto.extractedText}</p>
                </div>
              ) : (
                <button
                  onClick={() => handleOcr(selectedPhoto)}
                  disabled={ocrLoading === selectedPhoto.id}
                  className="w-full flex items-center justify-center gap-2 border border-indigo-200 text-indigo-600 py-2.5 rounded-xl text-sm font-medium hover:bg-indigo-50 transition-colors disabled:opacity-50"
                >
                  {ocrLoading === selectedPhoto.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
                  AIでテキスト抽出
                </button>
              )}
              <button
                onClick={() => handleDelete(selectedPhoto.id)}
                className="w-full flex items-center justify-center gap-2 text-red-500 py-2 text-sm hover:bg-red-50 rounded-xl transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                削除
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
