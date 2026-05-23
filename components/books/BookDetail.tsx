"use client";

import { useState } from "react";
import { BookOpen, Star, Quote, Image as ImageIcon, Bot, Trash2, ArrowLeft, Sparkles, Copy, Check, Loader2, ChevronDown, ChevronUp } from "lucide-react";
import Link from "next/link";
import { cn, STATUS_LABELS, STATUS_COLORS, formatDate } from "@/lib/utils";
import type { BookStatus } from "@/types";
import QuotesTab from "@/components/quotes/QuotesTab";
import PhotosTab from "@/components/photos/PhotosTab";
import AiChatTab from "@/components/ai/AiChatTab";
import { useRouter } from "next/navigation";

type Tab = "quotes" | "photos" | "ai";

interface Props {
  book: {
    id: string; title: string; author: string | null; coverUrl: string | null;
    genre: string | null; status: string; rating: number | null; memo: string | null;
    startedAt: Date | null; finishedAt: Date | null; publisher: string | null;
    publishedDate: string | null; description: string | null; pageCount: number | null;
  };
  initialQuotes: {
    id: string; text: string; pageNumber: number | null; chapter: string | null;
    memo: string | null; isFavorite: boolean; createdAt: Date;
    tags: { id: string; name: string; color: string }[];
  }[];
  initialPhotos: {
    id: string; url: string; caption: string | null; extractedText: string | null; createdAt: Date;
  }[];
  initialChat: { id: string; role: string; content: string; createdAt: Date }[];
  initialTags: { id: string; name: string; color: string }[];
}

const tabs: { id: Tab; label: string; icon: React.ElementType }[] = [
  { id: "quotes", label: "引用", icon: Quote },
  { id: "photos", label: "写真", icon: ImageIcon },
  { id: "ai", label: "AI", icon: Bot },
];

const STATUS_OPTIONS: { value: BookStatus; label: string }[] = [
  { value: "want", label: "積読" },
  { value: "reading", label: "読中" },
  { value: "done", label: "読了" },
];

function parseRecord(text: string): { heading: string; body: string }[] {
  const sections: { heading: string; body: string }[] = [];
  const lines = text.split("\n");
  let current: { heading: string; body: string } | null = null;
  for (const line of lines) {
    if (line.startsWith("## ")) {
      if (current) sections.push(current);
      current = { heading: line.replace("## ", "").trim(), body: "" };
    } else if (current) {
      current.body += (current.body ? "\n" : "") + line;
    }
  }
  if (current) sections.push(current);
  return sections.length > 0 ? sections : [{ heading: "", body: text }];
}

export default function BookDetail({ book, initialQuotes, initialPhotos, initialChat, initialTags }: Props) {
  const [activeTab, setActiveTab] = useState<Tab>("quotes");
  const [deleting, setDeleting] = useState(false);
  const [status, setStatus] = useState<BookStatus>(book.status as BookStatus);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [aiRecord, setAiRecord] = useState<string | null>(null);
  const [aiRecordLoading, setAiRecordLoading] = useState(false);
  const [aiRecordOpen, setAiRecordOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const router = useRouter();

  async function handleStatusChange(newStatus: BookStatus) {
    if (newStatus === status || updatingStatus) return;
    setUpdatingStatus(true);
    setStatus(newStatus);
    await fetch(`/api/books/${book.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
    setUpdatingStatus(false);
  }

  async function generateAiRecord() {
    setAiRecordLoading(true);
    setAiRecordOpen(true);
    try {
      const res = await fetch("/api/ai/reading-record", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookId: book.id }),
      });
      const { record } = await res.json();
      setAiRecord(record);
    } finally {
      setAiRecordLoading(false);
    }
  }

  async function copyRecord() {
    if (!aiRecord) return;
    await navigator.clipboard.writeText(aiRecord);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function handleDelete() {
    if (!confirm(`「${book.title}」を削除しますか？`)) return;
    setDeleting(true);
    await fetch(`/api/books/${book.id}`, { method: "DELETE" });
    router.push("/books");
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Link href="/books" className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
          <ArrowLeft className="w-5 h-5 text-slate-600" />
        </Link>
        <h1 className="font-bold text-slate-900 text-lg truncate flex-1">{book.title}</h1>
        <button onClick={handleDelete} disabled={deleting} className="p-2 hover:bg-red-50 text-red-400 hover:text-red-600 rounded-lg transition-colors">
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      {/* book info card */}
      <div className="bg-white rounded-2xl border border-slate-100 p-4 flex gap-4">
        {book.coverUrl ? (
          <img src={book.coverUrl} alt={book.title} className="w-20 h-28 object-cover rounded-lg shadow flex-shrink-0" />
        ) : (
          <div className="w-20 h-28 bg-indigo-50 rounded-lg flex items-center justify-center flex-shrink-0">
            <BookOpen className="w-8 h-8 text-indigo-200" />
          </div>
        )}
        <div className="flex-1 min-w-0 space-y-2">
          <div>
            <p className="font-semibold text-slate-900 text-base leading-tight">{book.title}</p>
            <p className="text-sm text-slate-500">{book.author ?? "著者不明"}</p>
            {book.publisher && <p className="text-xs text-slate-400">{book.publisher}{book.publishedDate && ` · ${book.publishedDate}`}</p>}
          </div>
          <div className="flex items-center gap-1.5 flex-wrap">
            {STATUS_OPTIONS.map(({ value, label }) => (
              <button
                key={value}
                onClick={() => handleStatusChange(value)}
                disabled={updatingStatus}
                className={cn(
                  "text-xs px-2.5 py-0.5 rounded-full font-medium transition-colors",
                  status === value
                    ? STATUS_COLORS[value]
                    : "bg-slate-100 text-slate-400 hover:bg-slate-200"
                )}
              >
                {label}
              </button>
            ))}
            {book.genre && <span className="text-xs text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">{book.genre}</span>}
          </div>
          {book.rating && (
            <div className="flex gap-0.5">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} className={cn("w-4 h-4", i < book.rating! ? "fill-amber-400 text-amber-400" : "text-slate-200")} />
              ))}
            </div>
          )}
          <div className="text-xs text-slate-400 space-y-0.5">
            {book.startedAt && <p>開始: {formatDate(book.startedAt)}</p>}
            {book.finishedAt && <p>読了: {formatDate(book.finishedAt)}</p>}
          </div>
        </div>
      </div>

      {book.memo && (
        <div className="bg-amber-50 rounded-xl p-4 border border-amber-100">
          <p className="text-sm text-amber-800 leading-relaxed whitespace-pre-wrap">{book.memo}</p>
        </div>
      )}

      {/* AI読書記録 */}
      {status === "done" && (
        <div className="rounded-2xl border border-indigo-100 overflow-hidden">
          <button
            onClick={() => aiRecord ? setAiRecordOpen((v) => !v) : generateAiRecord()}
            disabled={aiRecordLoading}
            className="w-full flex items-center justify-between gap-3 px-4 py-3 bg-gradient-to-r from-indigo-50 to-purple-50 hover:from-indigo-100 hover:to-purple-100 transition-colors"
          >
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 bg-indigo-600 rounded-xl flex items-center justify-center flex-shrink-0">
                {aiRecordLoading
                  ? <Loader2 className="w-4 h-4 text-white animate-spin" />
                  : <Sparkles className="w-4 h-4 text-white" />
                }
              </div>
              <div className="text-left">
                <p className="text-sm font-semibold text-indigo-900">
                  {aiRecord ? "AI読書記録" : "AI読書記録を生成"}
                </p>
                <p className="text-xs text-indigo-500">
                  {aiRecord ? "メモ・引用・写真メモをもとに作成" : "メモ・引用・写真メモから自動まとめ"}
                </p>
              </div>
            </div>
            {aiRecord && (
              aiRecordOpen
                ? <ChevronUp className="w-4 h-4 text-indigo-400 flex-shrink-0" />
                : <ChevronDown className="w-4 h-4 text-indigo-400 flex-shrink-0" />
            )}
          </button>

          {aiRecordLoading && (
            <div className="px-4 py-6 text-center">
              <Loader2 className="w-6 h-6 text-indigo-400 animate-spin mx-auto mb-2" />
              <p className="text-sm text-slate-400">AIが読書記録を作成しています...</p>
            </div>
          )}

          {aiRecord && aiRecordOpen && (
            <div className="bg-white px-4 pb-4 pt-3 space-y-4">
              {parseRecord(aiRecord).map((section, i) => (
                <div key={i}>
                  {section.heading && (
                    <p className="text-xs font-semibold text-indigo-600 uppercase tracking-wide mb-1.5">
                      {section.heading}
                    </p>
                  )}
                  <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
                    {section.body.trim()}
                  </p>
                </div>
              ))}
              <div className="flex gap-2 pt-1 border-t border-slate-100">
                <button
                  onClick={copyRecord}
                  className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-indigo-600 transition-colors"
                >
                  {copied
                    ? <><Check className="w-3.5 h-3.5 text-emerald-500" /><span className="text-emerald-500">コピーしました</span></>
                    : <><Copy className="w-3.5 h-3.5" />クリップボードにコピー</>
                  }
                </button>
                <button
                  onClick={generateAiRecord}
                  disabled={aiRecordLoading}
                  className="ml-auto flex items-center gap-1.5 text-xs text-slate-400 hover:text-indigo-500 transition-colors disabled:opacity-50"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  再生成
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* tabs */}
      <div className="flex border-b border-slate-100">
        {tabs.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={cn(
              "flex-1 flex items-center justify-center gap-1.5 py-2.5 text-sm font-medium border-b-2 transition-colors",
              activeTab === id
                ? "border-indigo-600 text-indigo-600"
                : "border-transparent text-slate-500 hover:text-slate-700"
            )}
          >
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}
      </div>

      {activeTab === "quotes" && <QuotesTab bookId={book.id} initialQuotes={initialQuotes} initialTags={initialTags} />}
      {activeTab === "photos" && <PhotosTab bookId={book.id} initialPhotos={initialPhotos} />}
      {activeTab === "ai" && <AiChatTab bookId={book.id} initialChat={initialChat} />}
    </div>
  );
}
