"use client";

import { useState } from "react";
import { Plus, Star, Trash2, Quote } from "lucide-react";
import { cn } from "@/lib/utils";

interface QuoteItem {
  id: string; text: string; pageNumber: number | null; chapter: string | null;
  memo: string | null; isFavorite: boolean; createdAt: Date;
}

export default function QuotesTab({ bookId, initialQuotes }: { bookId: string; initialQuotes: QuoteItem[] }) {
  const [quoteList, setQuoteList] = useState(initialQuotes);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ text: "", pageNumber: "", chapter: "", memo: "" });
  const [saving, setSaving] = useState(false);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!form.text.trim()) return;
    setSaving(true);
    try {
      const res = await fetch("/api/quotes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bookId,
          text: form.text,
          pageNumber: form.pageNumber ? parseInt(form.pageNumber) : null,
          chapter: form.chapter || null,
          memo: form.memo || null,
        }),
      });
      const newQuote = await res.json();
      setQuoteList((q) => [...q, newQuote]);
      setForm({ text: "", pageNumber: "", chapter: "", memo: "" });
      setShowForm(false);
    } finally {
      setSaving(false);
    }
  }

  async function toggleFavorite(id: string, current: boolean) {
    const res = await fetch(`/api/quotes/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isFavorite: !current }),
    });
    const updated = await res.json();
    setQuoteList((q) => q.map((item) => item.id === id ? updated : item));
  }

  async function handleDelete(id: string) {
    await fetch(`/api/quotes/${id}`, { method: "DELETE" });
    setQuoteList((q) => q.filter((item) => item.id !== id));
  }

  return (
    <div className="space-y-3">
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

      {quoteList.length === 0 && !showForm ? (
        <div className="text-center py-12">
          <Quote className="w-10 h-10 text-slate-200 mx-auto mb-2" />
          <p className="text-slate-400 text-sm">引用がまだありません</p>
        </div>
      ) : (
        <div className="space-y-2">
          {[...quoteList].reverse().map((q) => (
            <div key={q.id} className={cn(
              "bg-white rounded-xl border p-4 space-y-2 border-l-4",
              q.isFavorite ? "border-l-amber-400 border-amber-100" : "border-l-indigo-200 border-slate-100"
            )}>
              <p className="text-slate-800 text-sm leading-relaxed">「{q.text}」</p>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs text-slate-400">
                  {q.pageNumber && <span>p.{q.pageNumber}</span>}
                  {q.chapter && <span>{q.chapter}</span>}
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={() => toggleFavorite(q.id, q.isFavorite)} className="p-1.5 hover:bg-amber-50 rounded-lg transition-colors">
                    <Star className={cn("w-4 h-4", q.isFavorite ? "fill-amber-400 text-amber-400" : "text-slate-300")} />
                  </button>
                  <button onClick={() => handleDelete(q.id)} className="p-1.5 hover:bg-red-50 text-red-300 hover:text-red-500 rounded-lg transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              {q.memo && <p className="text-xs text-slate-500 bg-slate-50 rounded-lg px-3 py-2">{q.memo}</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
