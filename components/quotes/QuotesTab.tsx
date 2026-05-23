"use client";

import { useEffect, useRef, useState } from "react";
import { Plus, Star, Trash2, Quote, Tag, X, Edit2 } from "lucide-react";
import { cn } from "@/lib/utils";

const TAG_COLORS = [
  "#6366f1", "#8b5cf6", "#3b82f6", "#06b6d4",
  "#10b981", "#f59e0b", "#ef4444", "#ec4899",
];

interface TagItem { id: string; name: string; color: string }
interface QuoteItem {
  id: string; text: string; pageNumber: number | null; chapter: string | null;
  memo: string | null; isFavorite: boolean; createdAt: Date; tags: TagItem[];
}

export default function QuotesTab({
  bookId,
  initialQuotes,
  initialTags,
}: {
  bookId: string;
  initialQuotes: QuoteItem[];
  initialTags: TagItem[];
}) {
  const [quoteList, setQuoteList] = useState(initialQuotes);
  const [userTags, setUserTags] = useState(initialTags);
  const [tagFilter, setTagFilter] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ text: "", pageNumber: "", chapter: "", memo: "" });
  const [saving, setSaving] = useState(false);
  const [openPickerId, setOpenPickerId] = useState<string | null>(null);
  const [newTagName, setNewTagName] = useState("");
  const [newTagColor, setNewTagColor] = useState(TAG_COLORS[0]);
  const [editingQuote, setEditingQuote] = useState<QuoteItem | null>(null);
  const [editForm, setEditForm] = useState({ text: "", pageNumber: "", chapter: "", memo: "" });
  const [editSaving, setEditSaving] = useState(false);
  const pickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) {
        setOpenPickerId(null);
      }
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

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
          pageNumber: editForm.pageNumber ? parseInt(editForm.pageNumber) : null,
          chapter: editForm.chapter || null,
          memo: editForm.memo || null,
        }),
      });
      const updated = await res.json();
      setQuoteList((list) => list.map((q) => q.id === editingQuote.id ? { ...q, ...updated } : q));
      setEditingQuote(null);
    } finally {
      setEditSaving(false);
    }
  }

  // ──────────── 引用 CRUD ────────────
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
          pageNumber: form.pageNumber ? parseInt(form.pageNumber) : null,
          chapter: form.chapter || null, memo: form.memo || null,
        }),
      });
      const newQuote = await res.json();
      setQuoteList((q) => [...q, { ...newQuote, tags: [] }]);
      setForm({ text: "", pageNumber: "", chapter: "", memo: "" });
      setShowForm(false);
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
  }

  async function handleDelete(id: string) {
    await fetch(`/api/quotes/${id}`, { method: "DELETE" });
    setQuoteList((q) => q.filter((item) => item.id !== id));
  }

  // ──────────── タグ操作 ────────────
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
  }

  async function removeTagFromQuote(quoteId: string, tagId: string) {
    await fetch(`/api/quotes/${quoteId}/tags?tagId=${tagId}`, { method: "DELETE" });
    setQuoteList((list) => list.map((q) =>
      q.id === quoteId ? { ...q, tags: q.tags.filter((t) => t.id !== tagId) } : q
    ));
  }

  async function handleCreateAndAdd(quoteId: string) {
    const tag = await createTag();
    if (tag) await addTagToQuote(quoteId, tag.id);
  }

  // ──────────── フィルタ済みリスト ────────────
  const filtered = tagFilter
    ? quoteList.filter((q) => q.tags.some((t) => t.id === tagFilter))
    : quoteList;

  // タグフィルタ用の使用タグ（quoteList 内に存在するもの）
  const usedTagIds = new Set(quoteList.flatMap((q) => q.tags.map((t) => t.id)));
  const filterableTags = userTags.filter((t) => usedTagIds.has(t.id));

  return (
    <div className="space-y-3">
      {/* ヘッダー */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-500">{quoteList.length}件の引用</p>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-1.5 text-sm text-indigo-600 hover:text-indigo-700 font-medium"
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
                ? "bg-slate-700 text-white border-slate-700"
                : "bg-white text-slate-500 border-slate-200 hover:border-slate-400"
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
                tagFilter === tag.id ? "text-white border-transparent" : "bg-white border-slate-200 hover:border-slate-400"
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
        <form onSubmit={handleAdd} className="bg-white rounded-xl border border-indigo-200 p-4 space-y-3">
          <textarea
            value={form.text}
            onChange={(e) => setForm((f) => ({ ...f, text: e.target.value }))}
            placeholder="引用したいテキストを入力..."
            rows={4}
            className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-indigo-400 resize-none"
            autoFocus
          />
          <div className="grid grid-cols-2 gap-2">
            <input
              type="number"
              value={form.pageNumber}
              onChange={(e) => setForm((f) => ({ ...f, pageNumber: e.target.value }))}
              placeholder="ページ番号"
              className="border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-indigo-400"
            />
            <input
              value={form.chapter}
              onChange={(e) => setForm((f) => ({ ...f, chapter: e.target.value }))}
              placeholder="章・セクション"
              className="border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-indigo-400"
            />
          </div>
          <input
            value={form.memo}
            onChange={(e) => setForm((f) => ({ ...f, memo: e.target.value }))}
            placeholder="メモ（任意）"
            className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-indigo-400"
          />
          <div className="flex gap-2">
            <button type="submit" disabled={saving || !form.text} className="flex-1 bg-indigo-600 text-white py-2 rounded-xl text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors">
              {saving ? "保存中..." : "保存"}
            </button>
            <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl text-sm transition-colors">
              キャンセル
            </button>
          </div>
        </form>
      )}

      {/* 引用リスト */}
      {filtered.length === 0 && !showForm ? (
        <div className="text-center py-12">
          <Quote className="w-10 h-10 text-slate-200 mx-auto mb-2" />
          <p className="text-slate-400 text-sm">
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
                  "bg-white rounded-xl border p-4 space-y-2.5 border-l-4",
                  q.isFavorite ? "border-l-amber-400 border-amber-100" : "border-l-indigo-200 border-slate-100"
                )}
              >
                <p className="text-slate-800 text-sm leading-relaxed">「{q.text}」</p>

                {/* タグ + アクション */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex flex-wrap gap-1.5">
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
                          ? "bg-indigo-50 border-indigo-300 text-indigo-600"
                          : "border-dashed border-slate-300 text-slate-400 hover:border-indigo-300 hover:text-indigo-500"
                      )}
                    >
                      <Tag className="w-3 h-3" />
                      タグ
                    </button>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button onClick={() => openEdit(q)} className="p-1.5 hover:bg-slate-100 text-slate-300 hover:text-slate-600 rounded-lg transition-colors">
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button onClick={() => toggleFavorite(q.id, q.isFavorite)} className="p-1.5 hover:bg-amber-50 rounded-lg transition-colors">
                      <Star className={cn("w-4 h-4", q.isFavorite ? "fill-amber-400 text-amber-400" : "text-slate-300")} />
                    </button>
                    <button onClick={() => handleDelete(q.id)} className="p-1.5 hover:bg-red-50 text-red-300 hover:text-red-500 rounded-lg transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* メモ */}
                {q.memo && <p className="text-xs text-slate-500 bg-slate-50 rounded-lg px-3 py-2">{q.memo}</p>}

                {/* ページ・章 */}
                <div className="flex items-center gap-2 text-xs text-slate-400">
                  {q.pageNumber && <span>p.{q.pageNumber}</span>}
                  {q.chapter && <span>{q.chapter}</span>}
                </div>

                {/* タグピッカー */}
                {isPickerOpen && (
                  <div className="border border-indigo-100 rounded-xl bg-indigo-50/50 p-3 space-y-2.5">
                    {/* 既存タグ */}
                    {availableTags.length > 0 && (
                      <div>
                        <p className="text-xs text-slate-500 mb-1.5">タグを追加</p>
                        <div className="flex flex-wrap gap-1.5">
                          {availableTags.map((tag) => (
                            <button
                              key={tag.id}
                              onClick={() => addTagToQuote(q.id, tag.id)}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium text-white transition-opacity hover:opacity-80"
                              style={{ backgroundColor: tag.color }}
                            >
                              <Plus className="w-3 h-3" />
                              {tag.name}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* 新規タグ作成 */}
                    <div>
                      <p className="text-xs text-slate-500 mb-1.5">新しいタグを作成</p>
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={newTagName}
                          onChange={(e) => setNewTagName(e.target.value)}
                          onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleCreateAndAdd(q.id))}
                          placeholder="タグ名..."
                          className="flex-1 text-xs border border-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-indigo-400 bg-white"
                        />
                        <button
                          type="button"
                          onClick={() => handleCreateAndAdd(q.id)}
                          disabled={!newTagName.trim()}
                          className="px-2.5 py-1.5 bg-indigo-600 text-white rounded-lg text-xs font-medium disabled:opacity-40 transition-colors hover:bg-indigo-700"
                        >
                          追加
                        </button>
                      </div>
                      {/* カラーパレット */}
                      <div className="flex gap-1.5 mt-2">
                        {TAG_COLORS.map((c) => (
                          <button
                            key={c}
                            type="button"
                            onClick={() => setNewTagColor(c)}
                            className={cn(
                              "w-5 h-5 rounded-full transition-transform",
                              newTagColor === c ? "scale-125 ring-2 ring-offset-1 ring-slate-400" : "hover:scale-110"
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
          <div className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-2xl shadow-2xl max-w-lg mx-auto">
            {/* ハンドルバー */}
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 rounded-full bg-slate-200" />
            </div>

            <div className="px-5 pb-2 pt-1 flex items-center justify-between">
              <p className="font-semibold text-slate-900">引用を編集</p>
              <button
                onClick={() => setEditingQuote(null)}
                className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors text-slate-400"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="px-5 pb-6 space-y-3">
              <textarea
                value={editForm.text}
                onChange={(e) => setEditForm((f) => ({ ...f, text: e.target.value }))}
                rows={4}
                className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-indigo-400 resize-none"
                autoFocus
              />
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="number"
                  value={editForm.pageNumber}
                  onChange={(e) => setEditForm((f) => ({ ...f, pageNumber: e.target.value }))}
                  placeholder="ページ番号"
                  className="border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-indigo-400"
                />
                <input
                  value={editForm.chapter}
                  onChange={(e) => setEditForm((f) => ({ ...f, chapter: e.target.value }))}
                  placeholder="章・セクション"
                  className="border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-indigo-400"
                />
              </div>
              <input
                value={editForm.memo}
                onChange={(e) => setEditForm((f) => ({ ...f, memo: e.target.value }))}
                placeholder="メモ（任意）"
                className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-indigo-400"
              />
              <div className="flex gap-2 pt-1">
                <button
                  onClick={() => setEditingQuote(null)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-sm font-medium hover:bg-slate-50 transition-colors"
                >
                  キャンセル
                </button>
                <button
                  onClick={handleEditSave}
                  disabled={editSaving || !editForm.text.trim()}
                  className="flex-1 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors"
                >
                  {editSaving ? "保存中..." : "保存"}
                </button>
              </div>
            </div>

            {/* iOSホームバー用余白 */}
            <div className="pb-safe-bottom" />
          </div>
        </>
      )}
    </div>
  );
}
