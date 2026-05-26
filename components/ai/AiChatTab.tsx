"use client";

import { useState, useRef, useEffect } from "react";
import { Send, Bot, User, Loader2, Sparkles, AlertCircle, Trash2 } from "lucide-react";
import { useAiProvider } from "@/hooks/useAiProvider";
import { cn } from "@/lib/utils";
import ReactMarkdown from "react-markdown";

interface Message {
  id: string; role: string; content: string; createdAt: Date;
}

export default function AiChatTab({ bookId, initialChat, initialSummary }: { bookId: string; initialChat: Message[]; initialSummary: string | null }) {
  const [messages, setMessages] = useState(initialChat);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [summary, setSummary] = useState<string | null>(initialSummary);
  const [error, setError] = useState<string | null>(null);
  const [confirmClear, setConfirmClear] = useState(false);
  const [clearLoading, setClearLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const { provider } = useAiProvider();

  useEffect(() => {
    fetch(`/api/ai/chat?bookId=${bookId}`)
      .then((r) => r.json())
      .then((fresh: Message[]) => setMessages(fresh))
      .catch(() => {});
  }, [bookId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMsg = input.trim();
    setInput("");
    setMessages((m) => [...m, {
      id: Date.now().toString(), role: "user", content: userMsg, createdAt: new Date()
    }]);
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookId, message: userMsg, provider }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.message ?? "エラーが発生しました"); return; }
      setMessages((m) => [...m, {
        id: (Date.now() + 1).toString(), role: "assistant", content: data.reply, createdAt: new Date()
      }]);
    } finally {
      setLoading(false);
    }
  }

  async function handleClear() {
    setClearLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/ai/chat?bookId=${bookId}`, { method: "DELETE" });
      if (!res.ok) { setError("削除に失敗しました"); return; }
      setMessages([]);
      setSummary(null);
    } finally {
      setClearLoading(false);
      setConfirmClear(false);
    }
  }

  async function handleSummary() {
    setSummaryLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/ai/summary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookId, provider }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.message ?? "エラーが発生しました"); return; }
      setSummary(data.summary);
    } finally {
      setSummaryLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      {confirmClear && (
        <div className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-xl px-4 py-3 flex items-center justify-between gap-3">
          <p className="text-sm text-slate-600 dark:text-slate-400">会話履歴をすべて削除しますか？</p>
          <div className="flex gap-2 flex-shrink-0">
            <button onClick={() => setConfirmClear(false)} className="text-xs px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-600 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700">キャンセル</button>
            <button onClick={handleClear} disabled={clearLoading} className="text-xs px-3 py-1.5 rounded-lg bg-red-500 text-white hover:bg-red-600 disabled:opacity-50 flex items-center gap-1">
              {clearLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3" />}
              削除
            </button>
          </div>
        </div>
      )}

      <div className="flex gap-2">
        {!summary && (
          <button
            onClick={handleSummary}
            disabled={summaryLoading}
            className="flex items-center justify-center gap-2 flex-1 border border-indigo-200 dark:border-indigo-700 text-indigo-600 dark:text-indigo-400 py-2.5 rounded-xl text-sm font-medium hover:bg-indigo-50 dark:hover:bg-indigo-950/30 transition-colors disabled:opacity-50"
          >
            {summaryLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            AIに要約・考察を作ってもらう
          </button>
        )}
        {messages.length > 0 && (
          <button
            onClick={() => setConfirmClear(true)}
            className="flex items-center justify-center w-10 h-10 rounded-xl border border-slate-200 dark:border-slate-600 text-slate-400 dark:text-slate-500 hover:text-red-400 hover:border-red-200 dark:hover:border-red-800 transition-colors flex-shrink-0"
            title="会話をリセット"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>

      {error && (
        <div className="flex items-start gap-2.5 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-xl px-4 py-3">
          <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
            <button onClick={() => setError(null)} className="text-xs text-red-400 hover:text-red-600 mt-0.5">閉じる</button>
          </div>
        </div>
      )}

      {summary && (
        <div className="bg-indigo-50 dark:bg-indigo-950/40 rounded-xl p-4 border border-indigo-100 dark:border-indigo-800">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            <p className="text-sm font-semibold text-indigo-700 dark:text-indigo-300">AI要約・考察</p>
          </div>
          <ReactMarkdown
            components={{
              h1: ({ children }) => <p className="font-bold text-base mb-1 text-slate-900 dark:text-slate-100">{children}</p>,
              h2: ({ children }) => <p className="font-bold mb-1 text-slate-900 dark:text-slate-100">{children}</p>,
              p: ({ children }) => <p className="text-sm text-slate-700 dark:text-slate-300 mb-2 last:mb-0">{children}</p>,
              ul: ({ children }) => <ul className="list-disc list-inside space-y-0.5 mb-2 text-sm text-slate-700 dark:text-slate-300">{children}</ul>,
              ol: ({ children }) => <ol className="list-decimal list-inside space-y-0.5 mb-2 text-sm text-slate-700 dark:text-slate-300">{children}</ol>,
              strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
            }}
          >
            {summary}
          </ReactMarkdown>
          <button onClick={() => setSummary(null)} className="mt-2 text-xs text-indigo-400 dark:text-indigo-500 hover:text-indigo-600 dark:hover:text-indigo-400">閉じる</button>
        </div>
      )}

      {/* chat history */}
      <div className="space-y-3 min-h-[200px]">
        {messages.length === 0 && (
          <div className="text-center py-10">
            <Bot className="w-10 h-10 text-slate-200 dark:text-slate-700 mx-auto mb-2" />
            <p className="text-slate-400 dark:text-slate-500 text-sm">この本についてAIに聞いてみよう</p>
            <p className="text-xs text-slate-300 dark:text-slate-600 mt-1">感想・疑問・テーマなど何でも</p>
          </div>
        )}
        {messages.map((msg) => (
          <div key={msg.id} className={cn("flex gap-2.5", msg.role === "user" ? "justify-end" : "justify-start")}>
            {msg.role === "assistant" && (
              <div className="w-7 h-7 bg-indigo-100 dark:bg-indigo-900 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <Bot className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              </div>
            )}
            <div className={cn(
              "max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed",
              msg.role === "user"
                ? "bg-indigo-600 dark:bg-indigo-500 text-white rounded-br-sm"
                : "bg-white dark:bg-slate-700 border border-slate-100 dark:border-slate-600 text-slate-800 dark:text-slate-200 rounded-bl-sm"
            )}>
              {msg.role === "user" ? (
                <p className="whitespace-pre-wrap">{msg.content}</p>
              ) : (
                <ReactMarkdown
                  components={{
                    h1: ({ children }) => <p className="font-bold text-base mb-1">{children}</p>,
                    h2: ({ children }) => <p className="font-bold mb-1">{children}</p>,
                    h3: ({ children }) => <p className="font-semibold mb-0.5">{children}</p>,
                    p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                    ul: ({ children }) => <ul className="list-disc list-inside space-y-0.5 mb-2">{children}</ul>,
                    ol: ({ children }) => <ol className="list-decimal list-inside space-y-0.5 mb-2">{children}</ol>,
                    li: ({ children }) => <li className="text-sm">{children}</li>,
                    strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
                    hr: () => <hr className="my-2 border-slate-200 dark:border-slate-600" />,
                  }}
                >
                  {msg.content}
                </ReactMarkdown>
              )}
            </div>
            {msg.role === "user" && (
              <div className="w-7 h-7 bg-slate-100 dark:bg-slate-700 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <User className="w-4 h-4 text-slate-500 dark:text-slate-400" />
              </div>
            )}
          </div>
        ))}
        {loading && (
          <div className="flex gap-2.5">
            <div className="w-7 h-7 bg-indigo-100 dark:bg-indigo-900 rounded-full flex items-center justify-center flex-shrink-0">
              <Bot className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div className="bg-white dark:bg-slate-700 border border-slate-100 dark:border-slate-600 rounded-2xl rounded-bl-sm px-4 py-3">
              <Loader2 className="w-4 h-4 text-indigo-400 animate-spin" />
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* input */}
      <form onSubmit={handleSend} className="flex gap-2 sticky bottom-14 sm:bottom-0 bg-slate-50 dark:bg-slate-900 pt-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="この本について質問や感想を..."
          className="flex-1 min-w-0 border border-slate-200 dark:border-slate-600 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-indigo-400 dark:focus:border-indigo-500 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500"
        />
        <button
          type="submit"
          disabled={!input.trim() || loading}
          className="px-4 py-2.5 bg-indigo-600 dark:bg-indigo-500 text-white rounded-xl hover:bg-indigo-700 dark:hover:bg-indigo-600 disabled:opacity-50 transition-colors"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
}
