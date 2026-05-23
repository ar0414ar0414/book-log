"use client";

import { useState, useRef, useEffect } from "react";
import { Send, Bot, User, Loader2, Sparkles, AlertCircle } from "lucide-react";
import { useAiProvider } from "@/hooks/useAiProvider";
import { cn } from "@/lib/utils";

interface Message {
  id: string; role: string; content: string; createdAt: Date;
}

export default function AiChatTab({ bookId, initialChat }: { bookId: string; initialChat: Message[] }) {
  const [messages, setMessages] = useState(initialChat);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [summary, setSummary] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const { provider } = useAiProvider();

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
      {/* summary button */}
      {!summary && (
        <button
          onClick={handleSummary}
          disabled={summaryLoading}
          className="flex items-center justify-center gap-2 w-full border border-indigo-200 text-indigo-600 py-2.5 rounded-xl text-sm font-medium hover:bg-indigo-50 transition-colors disabled:opacity-50"
        >
          {summaryLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
          AIに要約・考察を作ってもらう
        </button>
      )}

      {error && (
        <div className="flex items-start gap-2.5 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
          <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="text-sm text-red-700">{error}</p>
            <button onClick={() => setError(null)} className="text-xs text-red-400 hover:text-red-600 mt-0.5">閉じる</button>
          </div>
        </div>
      )}

      {summary && (
        <div className="bg-indigo-50 rounded-xl p-4 border border-indigo-100">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="w-4 h-4 text-indigo-600" />
            <p className="text-sm font-semibold text-indigo-700">AI要約・考察</p>
          </div>
          <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">{summary}</p>
          <button onClick={() => setSummary(null)} className="mt-2 text-xs text-indigo-400 hover:text-indigo-600">閉じる</button>
        </div>
      )}

      {/* chat history */}
      <div className="space-y-3 min-h-[200px]">
        {messages.length === 0 && (
          <div className="text-center py-10">
            <Bot className="w-10 h-10 text-slate-200 mx-auto mb-2" />
            <p className="text-slate-400 text-sm">この本についてAIに聞いてみよう</p>
            <p className="text-xs text-slate-300 mt-1">感想・疑問・テーマなど何でも</p>
          </div>
        )}
        {messages.map((msg) => (
          <div key={msg.id} className={cn("flex gap-2.5", msg.role === "user" ? "justify-end" : "justify-start")}>
            {msg.role === "assistant" && (
              <div className="w-7 h-7 bg-indigo-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <Bot className="w-4 h-4 text-indigo-600" />
              </div>
            )}
            <div className={cn(
              "max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed",
              msg.role === "user"
                ? "bg-indigo-600 text-white rounded-br-sm"
                : "bg-white border border-slate-100 text-slate-800 rounded-bl-sm"
            )}>
              <p className="whitespace-pre-wrap">{msg.content}</p>
            </div>
            {msg.role === "user" && (
              <div className="w-7 h-7 bg-slate-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <User className="w-4 h-4 text-slate-500" />
              </div>
            )}
          </div>
        ))}
        {loading && (
          <div className="flex gap-2.5">
            <div className="w-7 h-7 bg-indigo-100 rounded-full flex items-center justify-center flex-shrink-0">
              <Bot className="w-4 h-4 text-indigo-600" />
            </div>
            <div className="bg-white border border-slate-100 rounded-2xl rounded-bl-sm px-4 py-3">
              <Loader2 className="w-4 h-4 text-indigo-400 animate-spin" />
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* input */}
      <form onSubmit={handleSend} className="flex gap-2 sticky bottom-20 sm:bottom-4 bg-slate-50 pt-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="この本について質問や感想を..."
          className="flex-1 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-indigo-400 bg-white"
        />
        <button
          type="submit"
          disabled={!input.trim() || loading}
          className="px-4 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 disabled:opacity-50 transition-colors"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
}
