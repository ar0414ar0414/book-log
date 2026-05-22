"use client";

import { useState, useRef } from "react";
import { Camera, Upload, Trash2, FileText, Loader2, Image as ImageIcon } from "lucide-react";

interface PhotoItem {
  id: string; url: string; caption: string | null; extractedText: string | null; createdAt: Date;
}

export default function PhotosTab({ bookId, initialPhotos }: { bookId: string; initialPhotos: PhotoItem[] }) {
  const [photoList, setPhotoList] = useState(initialPhotos);
  const [uploading, setUploading] = useState(false);
  const [ocrLoading, setOcrLoading] = useState<string | null>(null);
  const [selectedPhoto, setSelectedPhoto] = useState<PhotoItem | null>(null);
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
          body: JSON.stringify({ photoId: photo.id, imageBase64: base64, mimeType: blob.type }),
        });
        const { text } = await res.json();
        setPhotoList((p) => p.map((item) => item.id === photo.id ? { ...item, extractedText: text } : item));
        if (selectedPhoto?.id === photo.id) setSelectedPhoto((p) => p ? { ...p, extractedText: text } : p);
        setOcrLoading(null);
      };
    } catch {
      setOcrLoading(null);
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
              {photo.extractedText && (
                <div className="absolute bottom-0 left-0 right-0 bg-black/50 px-2 py-1">
                  <p className="text-white text-xs line-clamp-1">{photo.extractedText}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* photo modal */}
      {selectedPhoto && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-end sm:items-center justify-center p-4" onClick={() => setSelectedPhoto(null)}>
          <div className="bg-white rounded-2xl w-full max-w-lg overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <img src={selectedPhoto.url} alt="" className="w-full max-h-64 object-contain bg-black" />
            <div className="p-4 space-y-3">
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
