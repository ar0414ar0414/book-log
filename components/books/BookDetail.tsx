"use client";

import { useState } from "react";
import { BookOpen, Star, Quote, Image as ImageIcon, Bot, Edit2, Trash2, ArrowLeft, Plus } from "lucide-react";
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
  }[];
  initialPhotos: {
    id: string; url: string; caption: string | null; extractedText: string | null; createdAt: Date;
  }[];
  initialChat: { id: string; role: string; content: string; createdAt: Date }[];
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

export default function BookDetail({ book, initialQuotes, initialPhotos, initialChat }: Props) {
  const [activeTab, setActiveTab] = useState<Tab>("quotes");
  const [deleting, setDeleting] = useState(false);
  const [status, setStatus] = useState<BookStatus>(book.status as BookStatus);
  const [updatingStatus, setUpdatingStatus] = useState(false);
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

  async function handleDelete() {
    if (!confirm(`「${book.title}」を削除しますか？`)) return;
    setDeleting(true);
    await fetch(`/api/books/${book.id}`, { method: "DELETE" });
    router.push("/books");
  }

  return (
    <div className="pb-20 sm:pb-6 space-y-4">
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

      {activeTab === "quotes" && <QuotesTab bookId={book.id} initialQuotes={initialQuotes} />}
      {activeTab === "photos" && <PhotosTab bookId={book.id} initialPhotos={initialPhotos} />}
      {activeTab === "ai" && <AiChatTab bookId={book.id} initialChat={initialChat} />}
    </div>
  );
}
