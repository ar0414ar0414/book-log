"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Star, Trash2, Quote, Tag, X, Edit2, Camera, Loader2, Pencil, Check } from "lucide-react";
import ReactMarkdown from "react-markdown";
import AutoResizeTextarea from "@/components/ui/AutoResizeTextarea";
import { cn } from "@/lib/utils";
import { useAiProvider } from "@/hooks/useAiProvider";

const SS_KEY = "folio_deleted_quotes";
function getDeletedIds(): Set<string> {
  try { return new Set(JSON.parse(sessionStorage.getItem(SS_KEY) ?? "[]")); } catch { return new Set(); }
}
function addDeletedId(id: string) {
  try {
    const s = getDeletedIds(); s.add(id);
    sessionStorage.setItem(SS_KEY, JSON.stringify([...s]));
  } catch {}
}
function clearDeletedIds() {
  try { sessionStorage.removeItem(SS_KEY); } catch {}
}

const TAG_COLORS = [
  "#6366f1", "#8b5cf6", "#3b82f6", "#06b6d4",
  "#10b981", "#f59e0b", "#ef4444", "#ec4899",
];

const PRESET_TAGS = [
  { name: "名言",           color: "#6366f1" },
  { name: "学び",           color: "#0ea5e9" },
  { name: "人生",           color: "#8b5cf6" },
  { name: "感動",           color: "#f59e0b" },
  { name: "仕事",           color: "#10b981" },
  { name: "哲学",           color: "#64748b" },
  { name: "モチベーション", color: "#ef4444" },
  { name: "読書メモ",       color: "#ec4899" },
];

interface TagItem { id: string; name: string; color: string }
interface QuoteItem {
  id: string; text: string; pageNumber: number | null; chapter: string | null;
  memo: string | null; isFavorite: boolean; createdAt: Date; tags: TagItem[];
}

const inputCls = "border border-slate-200 dark:border-slate-600 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-indigo-400 dark:focus:border-indigo-500 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500";

export default function QuotesTab({
  bookId,
  initialQuotes,
  initialTags,
  ocrDraft,
  onOcrDraftConsumed,
}: {
  bookId: string;
  initialQuotes: QuoteItem[];
  initialTags: TagItem[];
  ocrDraft?: string | null;
  onOcrDraftConsumed?: () => void;
}) {
  const router = useRouter();
  const { provider } = useAiProvider();
  const [quoteList, setQuoteList] = useState(() => {
    if (typeof window === "undefined") return initialQuotes;
    const deleted = getDeletedIds();
    return deleted.size > 0 ? initialQuotes.filter((q) => !deleted.has(q.id)) : initialQuotes;
  });
  const [userTags, setUserTags] = useState(initialTags);
  const [tagFilter, setTagFilter] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ text: "", pageNumber: "", chapter: "", memo: "" });
  const [saving, setSaving] = useState(false);
  const [ocrLoading, setOcrLoading] = useState(false);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const [openPickerId, setOpenPickerId] = useState<string | null>(null);
  const [tagEditMode, setTagEditMode] = useState(false);
  const [newTagName, setNewTagName] = useState("");
  const [newTagColor, setNewTagColor] = useState(TAG_COLORS[0]);
  const [editingQuote, setEditingQuote] = useState<QuoteItem | null>(null);
  const [editForm, setEditForm] = useState({ text: "", pageNumber: "", chapter: "", memo: "" });
  const [editSaving, setEditSaving] = useState(false);
  const pickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (ocrDraft) {
      setForm((f) => ({ ...f, text: ocrDraft }));
      setShowForm(true);
      onOcrDraftConsumed?.();
    }
  }, [ocrDraft]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) {
        setOpenPickerId(null);
        setTagEditMode(false);
      }
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  useEffect(() => {
    fetch(`/api/quotes?bookId=${bookId}`)
      .then((r) => r.json())
      .then((fresh: { id: string }[]) => {
        const freshIds = new Set(fresh.map((q) => q.id));
        setQuoteList((list) => list.filter((q) => freshIds.has(q.id)));
        clearDeletedIds();
      })
      .catch(() => {});
  }, [bookId]);

  function openEdit(q: QuoteItem) {
    setEditingQuote(q);
    setEditForm({
      text: q.text,
      pageNumber: q.pageNumber?.toString() ?? "",
      chapter: q.chapter ?? "",
      memo: q.memo ?? "",
    });
  }

  async function handleEditSave() {
    if (!editingQuote || !editForm.text.trim()) return;
    setEditSaving(true);
    try {
      const res = await fetch(`/api/quotes/${editingQuote.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: editForm.text,
          pageNumber: editForm.pageNumber ? (Number.isFinite(parseInt(editForm.pageNumber, 10)) ? parseInt(editForm.pageNumber, 10) : null) : null,
          chapter: editForm.chapter || null,
          memo: editForm.memo || null,
        }),
      });
      const updated = await res.json();
      setQuoteList((list) => list.map((q) => q.id === editingQuote.id ? { ...q, ...updated } : q));
      setEditingQuote(null);
      router.refresh();
    } finally {
      setEditSaving(false);
    }
  }

  async function handleCameraOcr(file: File) {
    setOcrLoading(true);
    try {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = async () => {
        const base64 = (reader.result as string).split(",")[1];
        const res = await fetch("/api/ai/ocr", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ imageBase64: base64, mimeType: file.type, provider }),
        });
        const data = await res.json();
        if (res.ok && data.text) {
          setForm((f) => ({ ...f, text: f.text ? f.text + "\n" + data.text : data.text }));
        }
        setOcrLoading(false);
      };
    } catch {
      setOcrLoading(false);
    }
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!form.text.trim()) return;
    setSaving(true);
    try {
      const res = await fetch("/api/quotes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bookId, text: form.text,
          pageNumber: form.pageNumber ? (Number.isFinite(parseInt(form.pageNumber, 10)) ? parseInt(form.pageNumber, 10) : null) : null,
          chapter: form.chapter || null, memo: form.memo || null,
        }),
      });
      const newQuote = await res.json();
      setQuoteList((q) => [...q, { ...newQuote, tags: [] }]);
      setForm({ text: "", pageNumber: "", chapter: "", memo: "" });
      setShowForm(false);
      router.refresh();
    } finally { setSaving(false); }
  }

  async function toggleFavorite(id: string, current: boolean) {
    const res = await fetch(`/api/quotes/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isFavorite: !current }),
    });
    const updated = await res.json();
    setQuoteList((q) => q.map((item) => item.id === id ? { ...item, ...updated } : item));
    router.refresh();
  }

  async function handleDelete(id: string) {
    addDeletedId(id);
    setQuoteList((q) => q.filter((item) => item.id !== id));
    try {
      await fetch(`/api/quotes/${id}`, { method: "DELETE" });
      router.refresh();
    } catch {
      // 失敗時は再取得で復元される
    }
  }

  async function createTag(): Promise<TagItem | null> {
    if (!newTagName.trim()) return null;
    const res = await fetch("/api/tags", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newTagName.trim(), color: newTagColor }),
    });
    const tag: TagItem = await res.json();
    setUserTags((t) => [...t, tag]);
    setNewTagName("");
    return tag;
  }

  async function addTagToQuote(quoteId: string, tagId: string) {
    const tag = userTags.find((t) => t.id === tagId);
    if (!tag) return;
    await fetch(`/api/quotes/${quoteId}/tags`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tagId }),
    });
    setQuoteList((list) => list.map((q) =>
      q.id === quoteId && !q.tags.find((t) => t.id === tagId)
        ? { ...q, tags: [...q.tags, tag] }
        : q
    ));
    router.refresh();
  }

  async function removeTagFromQuote(quoteId: string, tagId: string) {
    await fetch(`/api/quotes/${quoteId}/tags?tagId=${tagId}`, { method: "DELETE" });
    setQuoteList((list) => list.map((q) =>
      q.id === quoteId ? { ...q, tags: q.tags.filter((t) => t.id !== tagId) } : q
    ));
    router.refresh();
  }

  async function handleCreateAndAdd(quoteId: string) {
    const tag = await createTag();
    if (tag) await addTagToQuote(quoteId, tag.id);
  }

  async function handleAddPreset(quoteId: string, preset: { name: string; color: string }) {
    const res = await fetch("/api/tags", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: preset.name, color: preset.color }),
    });
    const tag: TagItem = await res.json();
    setUserTags((t) => [...t, tag]);
    await addTagToQuote(quoteId, tag.id);
  }

  async function handleDeleteTag(tagId: string) {
    await fetch(`/api/tags/${tagId}`, { method: "DELETE" });
    setUserTags((t) => t.filter((tag) => tag.id !== tagId));
    setQuoteList((list) => list.map((q) => ({ ...q, tags: q.tags.filter((t) => t.id !== tagId) })));
  }

  const filtered = tagFilter
    ? quoteList.filter((q) => q.tags.some((t) => t.id === tagFilter))
    : quoteList;

  const usedTagIds = new Set(quoteList.flatMap((q) => q.tags.map((t) => t.id)));
  const filterableTags = userTags.filter((t) => usedTagIds.has(t.id));

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-500 dark:text-slate-400">{quoteList.length}件の引用</p>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-1.5 text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 font-medium"
        >
          <Plus className="w-4 h-4" />
          引用を追加
        </button>
      </div>

      {/* タグフィルタ */}
      {filterableTags.length > 0 && (
        <div className="flex gap-1.5 overflow-x-auto pb-0.5 scrollbar-hide">
          <button
            onClick={() => setTagFilter(null)}
            className={cn(
              "flex-shrink-0 px-2.5 py-1 rounded-full text-xs font-medium border transition-colors",
              !tagFilter
                ? "bg-slate-700 dark:bg-slate-200 text-white dark:text-slate-800 border-slate-700 dark:border-slate-200"
                : "bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-600 hover:border-slate-400 dark:hover:border-slate-500"
            )}
          >
            すべて
          </button>
          {filterableTags.map((tag) => (
            <button
              key={tag.id}
              onClick={() => setTagFilter(tagFilter === tag.id ? null : tag.id)}
              className={cn(
                "flex-shrink-0 flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border transition-colors",
                tagFilter === tag.id ? "text-white border-transparent" : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-600 hover:border-slate-400 dark:hover:border-slate-500"
              )}
              style={tagFilter === tag.id ? { backgroundColor: tag.color, borderColor: tag.color } : {}}
            >
              <span
                className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                style={{ backgroundColor: tagFilter === tag.id ? "white" : tag.color }}
              />
              {tag.name}
            </button>
          ))}
        </div>
      )}

      {/* 追加フォーム */}
      {showForm && (
        <form onSubmit={handleAdd} className="bg-white dark:bg-slate-800 rounded-xl border border-indigo-200 dark:border-indigo-700 p-4 space-y-3">
          <div className="relative">
            <AutoResizeTextarea
              value={form.text}
              onChange={(e) => setForm((f) => ({ ...f, text: e.target.value }))}
              placeholder="引用したいテキストを入力..."
              rows={4}
              className={cn(inputCls, "w-full pr-10")}
              autoFocus
              disabled={ocrLoading}
            />
            <button
              type="button"
              onClick={() => cameraInputRef.current?.click()}
              disabled={ocrLoading}
              className="absolute top-2 right-2 p-1.5 text-slate-400 hover:text-indigo-500 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 rounded-lg transition-colors disabled:opacity-50"
              title="カメラで撮影してOCR"
            >
              {ocrLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Camera className="w-4 h-4" />}
            </button>
            <input
              ref={cameraInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) handleCameraOcr(f); e.target.value = ""; }}
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <input
              type="number"
              value={form.pageNumber}
              onChange={(e) => setForm((f) => ({ ...f, pageNumber: e.target.value }))}
              placeholder="ページ番号"
              className={inputCls}
            />
            <input
              value={form.chapter}
              onChange={(e) => setForm((f) => ({ ...f, chapter: e.target.value }))}
              placeholder="章・セクション"
              className={inputCls}
            />
          </div>
          <input
            value={form.memo}
            onChange={(e) => setForm((f) => ({ ...f, memo: e.target.value }))}
            placeholder="メモ（任意）"
            className={cn(inputCls, "w-full")}
          />
          <div className="flex gap-2">
            <button type="submit" disabled={saving || !form.text} className="flex-1 bg-indigo-600 dark:bg-indigo-500 text-white py-2 rounded-xl text-sm font-medium hover:bg-indigo-700 dark:hover:bg-indigo-600 disabled:opacity-50 transition-colors">
              {saving ? "保存中..." : "保存"}
            </button>
            <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl text-sm transition-colors">
              キャンセル
            </button>
          </div>
        </form>
      )}

      {/* 引用リスト */}
      {filtered.length === 0 && !showForm ? (
        <div className="text-center py-12">
          <Quote className="w-10 h-10 text-slate-200 dark:text-slate-700 mx-auto mb-2" />
          <p className="text-slate-400 dark:text-slate-500 text-sm">
            {tagFilter ? "このタグの引用がありません" : "引用がまだありません"}
          </p>
        </div>
      ) : (
        <div className="space-y-2" ref={openPickerId ? pickerRef : undefined}>
          {[...filtered].reverse().map((q) => {
            const isPickerOpen = openPickerId === q.id;
            const attachedTagIds = new Set(q.tags.map((t) => t.id));
            const availableTags = userTags.filter((t) => !attachedTagIds.has(t.id));

            return (
              <div
                key={q.id}
                className={cn(
                  "bg-white dark:bg-slate-800 rounded-xl border p-4 space-y-2.5 border-l-4",
                  q.isFavorite
                    ? "border-l-amber-400 border-amber-100 dark:border-amber-800"
                    : "border-l-indigo-200 dark:border-l-indigo-700 border-slate-100 dark:border-slate-700"
                )}
              >
                <div className="text-slate-800 dark:text-slate-200 text-sm leading-relaxed prose prose-sm dark:prose-invert max-w-none prose-p:my-0.5 prose-headings:my-1 prose-ul:my-0.5 prose-ol:my-0.5 prose-li:my-0">
                  <ReactMarkdown
                    components={{
                      p: ({ children }) => <p className="leading-relaxed">{children}</p>,
                      h1: ({ children }) => <p className="font-bold text-base">{children}</p>,
                      h2: ({ children }) => <p className="font-bold">{children}</p>,
                      h3: ({ children }) => <p className="font-semibold">{children}</p>,
                      ul: ({ children }) => <ul className="list-disc list-inside space-y-0.5">{children}</ul>,
                      ol: ({ children }) => <ol className="list-decimal list-inside space-y-0.5">{children}</ol>,
                      strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
                      hr: () => <hr className="my-1 border-slate-200 dark:border-slate-600" />,
                    }}
                  >{q.text}</ReactMarkdown>
                </div>

                <div className="flex items-start justify-between gap-2">
                  <div className="flex flex-wrap gap-1.5 flex-1 min-w-0">
                    {q.tags.map((tag) => (
                      <span
                        key={tag.id}
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium text-white"
                        style={{ backgroundColor: tag.color }}
                      >
                        {tag.name}
                        <button
                          onClick={() => removeTagFromQuote(q.id, tag.id)}
                          className="opacity-70 hover:opacity-100 transition-opacity"
                        >
                          <X className="w-2.5 h-2.5" />
                        </button>
                      </span>
                    ))}
                    <button
                      onClick={() => setOpenPickerId(isPickerOpen ? null : q.id)}
                      className={cn(
                        "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs border transition-colors",
                        isPickerOpen
                          ? "bg-indigo-50 dark:bg-indigo-900/50 border-indigo-300 dark:border-indigo-600 text-indigo-600 dark:text-indigo-400"
                          : "border-dashed border-slate-300 dark:border-slate-600 text-slate-400 dark:text-slate-500 hover:border-indigo-300 dark:hover:border-indigo-600 hover:text-indigo-500 dark:hover:text-indigo-400"
                      )}
                    >
                      <Tag className="w-3 h-3" />
                      タグ
                    </button>
                  </div>
                  <div className="flex items-center gap-0.5 flex-shrink-0 -mr-1">
                    <button
                      onClick={() => toggleFavorite(q.id, q.isFavorite)}
                      className="p-1.5 rounded-lg transition-colors hover:bg-amber-50 dark:hover:bg-amber-950/30"
                    >
                      <Star className={cn("w-4 h-4", q.isFavorite ? "fill-amber-400 text-amber-400" : "text-slate-300 dark:text-slate-600")} />
                    </button>
                    <button
                      onClick={() => openEdit(q)}
                      className="p-1.5 rounded-lg text-slate-300 dark:text-slate-600 hover:text-indigo-500 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 transition-colors"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(q.id)}
                      className="p-1.5 rounded-lg text-slate-300 dark:text-slate-600 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {q.memo && <p className="text-xs text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-700 rounded-lg px-3 py-2">{q.memo}</p>}

                <div className="flex items-center gap-2 text-xs text-slate-400 dark:text-slate-500">
                  {q.pageNumber && <span>p.{q.pageNumber}</span>}
                  {q.chapter && <span>{q.chapter}</span>}
                </div>

                {/* タグピッカー */}
                {isPickerOpen && (
                  <div className="border border-indigo-100 dark:border-indigo-800 rounded-xl bg-indigo-50/50 dark:bg-indigo-950/30 p-3 space-y-2.5">
                    {userTags.length > 0 && (
                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <p className="text-xs text-slate-500 dark:text-slate-400">
                            {tagEditMode ? "タグを削除" : "タグを追加"}
                          </p>
                          <button
                            onClick={() => setTagEditMode((v) => !v)}
                            className={cn(
                              "flex items-center gap-1 text-xs px-2 py-0.5 rounded-full transition-colors",
                              tagEditMode
                                ? "bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-400"
                                : "text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300"
                            )}
                          >
                            {tagEditMode ? <><Check className="w-3 h-3" />完了</> : <><Pencil className="w-3 h-3" />管理</>}
                          </button>
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {tagEditMode
                            ? userTags.map((tag) => (
                                <button
                                  key={tag.id}
                                  onClick={() => handleDeleteTag(tag.id)}
                                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium text-white transition-opacity hover:opacity-80"
                                  style={{ backgroundColor: tag.color }}
                                >
                                  {tag.name}
                                  <X className="w-3 h-3 opacity-80" />
                                </button>
                              ))
                            : availableTags.map((tag) => (
                                <button
                                  key={tag.id}
                                  onClick={() => addTagToQuote(q.id, tag.id)}
                                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium text-white transition-opacity hover:opacity-80"
                                  style={{ backgroundColor: tag.color }}
                                >
                                  <Plus className="w-3 h-3" />
                                  {tag.name}
                                </button>
                              ))
                          }
                        </div>
                      </div>
                    )}

                    {/* 提案タグ（未作成のプリセット） */}
                    {(() => {
                      const existing = new Set(userTags.map((t) => t.name));
                      const suggestions = PRESET_TAGS.filter((p) => !existing.has(p.name));
                      if (suggestions.length === 0) return null;
                      return (
                        <div>
                          <p className="text-xs text-slate-500 dark:text-slate-400 mb-1.5">提案タグ</p>
                          <div className="flex flex-wrap gap-1.5">
                            {suggestions.map((preset) => (
                              <button
                                key={preset.name}
                                onClick={() => handleAddPreset(q.id, preset)}
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium text-white/90 border border-white/30 hover:opacity-90 transition-opacity"
                                style={{ backgroundColor: preset.color }}
                              >
                                <Plus className="w-3 h-3" />
                                {preset.name}
                              </button>
                            ))}
                          </div>
                        </div>
                      );
                    })()}

                    <div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mb-1.5">新しいタグを作成</p>
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={newTagName}
                          onChange={(e) => setNewTagName(e.target.value)}
                          onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleCreateAndAdd(q.id))}
                          placeholder="タグ名..."
                          className="flex-1 min-w-0 text-xs border border-slate-200 dark:border-slate-600 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-indigo-400 dark:focus:border-indigo-500 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500"
                        />
                        <button
                          type="button"
                          onClick={() => handleCreateAndAdd(q.id)}
                          disabled={!newTagName.trim()}
                          className="px-2.5 py-1.5 bg-indigo-600 dark:bg-indigo-500 text-white rounded-lg text-xs font-medium disabled:opacity-40 transition-colors hover:bg-indigo-700 dark:hover:bg-indigo-600"
                        >
                          追加
                        </button>
                      </div>
                      <div className="flex gap-1.5 mt-2">
                        {TAG_COLORS.map((c) => (
                          <button
                            key={c}
                            type="button"
                            onClick={() => setNewTagColor(c)}
                            className={cn(
                              "w-5 h-5 rounded-full transition-transform",
                              newTagColor === c ? "scale-125 ring-2 ring-offset-1 ring-slate-400 dark:ring-slate-500" : "hover:scale-110"
                            )}
                            style={{ backgroundColor: c }}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* 編集ボトムシート */}
      {editingQuote && (
        <>
          <div
            className="fixed inset-0 bg-black/40 z-40 backdrop-blur-sm"
            onClick={() => setEditingQuote(null)}
          />
          <div className="fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-slate-800 rounded-t-2xl shadow-2xl max-w-lg mx-auto">
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 rounded-full bg-slate-200 dark:bg-slate-600" />
            </div>

            <div className="px-5 pb-2 pt-1 flex items-center justify-between">
              <p className="font-semibold text-slate-900 dark:text-slate-100">引用を編集</p>
              <button
                onClick={() => setEditingQuote(null)}
                className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors text-slate-400 dark:text-slate-500"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="px-5 pb-6 space-y-3">
              <AutoResizeTextarea
                value={editForm.text}
                onChange={(e) => setEditForm((f) => ({ ...f, text: e.target.value }))}
                rows={4}
                className={cn(inputCls, "w-full")}
                autoFocus
              />
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="number"
                  value={editForm.pageNumber}
                  onChange={(e) => setEditForm((f) => ({ ...f, pageNumber: e.target.value }))}
                  placeholder="ページ番号"
                  className={inputCls}
                />
                <input
                  value={editForm.chapter}
                  onChange={(e) => setEditForm((f) => ({ ...f, chapter: e.target.value }))}
                  placeholder="章・セクション"
                  className={inputCls}
                />
              </div>
              <input
                value={editForm.memo}
                onChange={(e) => setEditForm((f) => ({ ...f, memo: e.target.value }))}
                placeholder="メモ（任意）"
                className={cn(inputCls, "w-full")}
              />
              <div className="flex gap-2 pt-1">
                <button
                  onClick={() => setEditingQuote(null)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-400 text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                >
                  キャンセル
                </button>
                <button
                  onClick={handleEditSave}
                  disabled={editSaving || !editForm.text.trim()}
                  className="flex-1 py-2.5 rounded-xl bg-indigo-600 dark:bg-indigo-500 text-white text-sm font-medium hover:bg-indigo-700 dark:hover:bg-indigo-600 disabled:opacity-50 transition-colors"
                >
                  {editSaving ? "保存中..." : "保存"}
                </button>
              </div>
            </div>

            <div className="pb-safe-bottom" />
          </div>
        </>
      )}
    </div>
  );
}
