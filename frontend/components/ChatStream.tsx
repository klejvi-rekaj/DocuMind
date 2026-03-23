"use client";

import React, { useEffect, useRef, useState } from "react";
import { ArrowUp, Bookmark, Copy, Loader2, Sparkles, Square } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface ChatStreamProps {
  fileIds: string[];
  notebookId?: string;
}

export default function ChatStream({ fileIds, notebookId }: ChatStreamProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  useEffect(() => {
    const loadHistory = async () => {
      if (!notebookId) {
        setMessages([]);
        return;
      }

      const saved = localStorage.getItem(`chat_history_${notebookId}`);
      if (saved) {
        try {
          setMessages(JSON.parse(saved));
        } catch (e) {
          console.error("Failed to parse chat history", e);
        }
      }

      try {
        const response = await fetch(`${apiBaseUrl}/api/query/history/${notebookId}`);
        if (!response.ok) {
          throw new Error(`History request failed: ${response.status}`);
        }
        const data = await response.json();
        if (Array.isArray(data.messages)) {
          setMessages(data.messages);
          return;
        }
      } catch (error) {
        console.error("Failed to load chat history from backend", error);
      }
      if (!saved) {
        setMessages([]);
      }
    };

    loadHistory();
  }, [apiBaseUrl, notebookId]);

  useEffect(() => {
    if (notebookId && messages.length > 0) {
      localStorage.setItem(`chat_history_${notebookId}`, JSON.stringify(messages));
    }
  }, [messages, notebookId]);

  const handleStop = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMsg: Message = { role: "user", content: input };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsLoading(true);

    abortControllerRef.current = new AbortController();

    try {
      const timeoutId = setTimeout(() => abortControllerRef.current?.abort(), 30000);
      const response = await fetch(`${apiBaseUrl}/api/query`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: input,
          file_ids: fileIds,
          top_k: 8,
          notebook_id: notebookId,
        }),
        signal: abortControllerRef.current.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`Server returned ${response.status}`);
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error("No reader available");

      let assistantMsgContent = "";
      setMessages((prev) => [...prev, { role: "assistant", content: "" }]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = new TextDecoder().decode(value);
        const lines = chunk.split("\n");

        for (const line of lines) {
          if (line.trim().startsWith("data: ")) {
            const dataStr = line.replace("data: ", "").trim();
            if (dataStr === "[DONE]") break;

            try {
              const data = JSON.parse(dataStr);
              if (data.type === "message" && data.content) {
                assistantMsgContent += data.content;
                setMessages((prev) => {
                  const last = prev[prev.length - 1];
                  if (last && last.role === "assistant") {
                    return [...prev.slice(0, -1), { ...last, content: assistantMsgContent }];
                  }
                  return prev;
                });
              } else if (data.type === "error") {
                assistantMsgContent = `ERROR: ${data.content}`;
                setMessages((prev) => {
                  const last = prev[prev.length - 1];
                  if (last && last.role === "assistant") {
                    return [...prev.slice(0, -1), { ...last, content: assistantMsgContent }];
                  }
                  return prev;
                });
                break;
              }
            } catch {
              // Ignore partial JSON and keep-alives.
            }
          }
        }
      }
    } catch (err: any) {
      if (err.name === "AbortError") {
        setMessages((prev) => [...prev, { role: "assistant", content: "The request timed out. Please try again or check your backend." }]);
      } else {
        console.error("Chat error:", err);
        setMessages((prev) => [...prev, { role: "assistant", content: `Failed to connect: ${err.message}` }]);
      }
    } finally {
      setIsLoading(false);
      abortControllerRef.current = null;
    }
  };

  const formatContent = (content: string) => {
    return content.split(/(\[\d+\])/g).map((part, i) => {
      const match = part.match(/\[(\d+)\]/);
      if (match) {
        return (
          <sup key={i} className="text-white/55 font-semibold ml-0.5 cursor-pointer hover:text-white">
            {match[1]}
          </sup>
        );
      }
      return part;
    });
  };

  return (
    <div className="flex flex-col h-full min-h-0 bg-transparent text-white">
      <div className="h-[calc(100vh-220px)] min-h-0 overflow-y-auto overflow-x-hidden px-6 lg:px-8 py-8 space-y-6 scroll-smooth">
        {messages.length === 0 && (
          <div className="h-full flex flex-col items-start justify-center text-white/25 pointer-events-none">
            <div className="w-10 h-10 rounded-2xl bg-white/[0.04] border border-white/10 flex items-center justify-center mb-4">
              <Sparkles className="w-4 h-4 text-white/60" />
            </div>
            <h3 className="text-lg font-semibold tracking-tight text-white/70">Start a focused document chat</h3>
            <p className="text-sm text-white/35 mt-2 max-w-md">
              Ask for summaries, examples, explanations, or follow-up clarifications grounded in your uploaded sources.
            </p>
          </div>
        )}

        {messages.map((message, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className={cn("flex w-full", message.role === "user" ? "justify-end" : "justify-start")}
          >
            <div className={cn("max-w-3xl", message.role === "user" ? "items-end" : "items-start")}>
              {message.role === "assistant" && (
                <div className="flex items-center gap-3 mb-3 text-white/45">
                  <div className="w-8 h-8 rounded-2xl bg-white/[0.04] border border-white/10 flex items-center justify-center">
                    <Sparkles className="w-4 h-4 text-white/70" />
                  </div>
                  <span className="text-[11px] font-semibold uppercase tracking-[0.24em]">DocuMind AI</span>
                </div>
              )}

              <div
                className={cn(
                  "whitespace-pre-wrap text-[15px] leading-7 tracking-tight px-5 py-4 border",
                  message.role === "user"
                    ? "border-white/20 bg-transparent text-white rounded-[20px] rounded-tr-md"
                    : "border-white/10 bg-white/[0.05] text-white/90 rounded-[20px] rounded-tl-md",
                )}
              >
                {formatContent(message.content)}
              </div>

              {message.role === "assistant" && (
                <div className="flex items-center gap-2 pt-3">
                  <button className="shimmer-button rounded-xl px-3 py-2 text-[11px] font-semibold text-white/70 hover:text-white">
                    <span className="relative z-10 inline-flex items-center gap-2">
                      <Bookmark className="w-3.5 h-3.5" />
                      Save to note
                    </span>
                  </button>
                  <button className="shimmer-button rounded-xl p-2 text-white/55 hover:text-white">
                    <span className="relative z-10">
                      <Copy className="w-3.5 h-3.5" />
                    </span>
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        ))}

        {isLoading && (
          <div className="flex items-center gap-3 text-white/45">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span className="text-[11px] font-semibold uppercase tracking-[0.24em]">Thinking</span>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="sticky bottom-0 z-10 px-6 lg:px-8 pb-6 pt-2 bg-gradient-to-t from-[#0b0b0b] via-[#0b0b0b]/96 to-transparent">
        <form onSubmit={handleSubmit} className="max-w-4xl mx-auto">
          <div className="surface-card rounded-[28px] px-5 py-3">
            <div className="flex items-center gap-3">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask about this document..."
                className="flex-1 bg-transparent py-3 text-[15px] text-white placeholder:text-white/30 outline-none"
                disabled={isLoading}
              />

              <div className="flex items-center gap-3">
                <div className="px-3 py-1.5 border border-white/10 rounded-full text-[10px] font-semibold uppercase tracking-[0.22em] text-white/40">
                  {fileIds.length} source{fileIds.length !== 1 ? "s" : ""}
                </div>

                {isLoading ? (
                  <button
                    type="button"
                    onClick={handleStop}
                    className="shimmer-button rounded-2xl w-11 h-11 flex items-center justify-center text-white"
                  >
                    <span className="relative z-10">
                      <Square className="w-4 h-4 fill-white" />
                    </span>
                  </button>
                ) : (
                  <button
                    type="submit"
                    disabled={!input.trim()}
                    className="shimmer-button rounded-2xl w-11 h-11 flex items-center justify-center text-white disabled:opacity-35"
                  >
                    <span className="relative z-10">
                      <ArrowUp className="w-5 h-5" strokeWidth={3} />
                    </span>
                  </button>
                )}
              </div>
            </div>
          </div>
          <p className="mt-3 text-center text-[10px] uppercase tracking-[0.24em] text-white/30 font-medium">
            DocuMind may be imperfect. Double-check important details.
          </p>
        </form>
      </div>
    </div>
  );
}
