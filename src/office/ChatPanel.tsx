import React, { useState, useRef, useEffect, useCallback } from "react";
import type { Agent, ChatMessage, FeedMessage } from "./types";
import { chatWithAgent, clearAgentMemory } from "./api";

interface ChatPanelProps {
  agent: Agent;
  messages: ChatMessage[];
  onSendMessage: (agentId: string, msg: ChatMessage) => void;
  onClear: () => void;
  onBack: () => void;
  feed: FeedMessage[];
}

export default function ChatPanel({ agent, messages, onSendMessage, onClear, onBack, feed }: ChatPanelProps) {
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, feed]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSend = useCallback(async () => {
    const text = input.trim();
    if (!text || sending) return;

    setInput("");
    setSending(true);
    onSendMessage(agent.id, { role: "user", content: text });

    try {
      const result = await chatWithAgent(agent.id, text);
      onSendMessage(agent.id, { role: "assistant", content: result.content });
    } catch (err: any) {
      onSendMessage(agent.id, { role: "assistant", content: `⚠️ Ошибка: ${err.message}` });
    } finally {
      setSending(false);
      inputRef.current?.focus();
    }
  }, [input, sending, agent.id, onSendMessage]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleClear = async () => {
    onClear();
    await clearAgentMemory(agent.id).catch(() => {});
  };

  return (
    <div className="h-full flex flex-col">
      {/* Chat header */}
      <div className="shrink-0 flex items-center gap-3 px-5 py-3 border-b border-g-border bg-g-bg2/50">
        <button onClick={onBack} className="text-g-text3 hover:text-g-text transition-colors p-1">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
        </button>

        <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl" style={{ backgroundColor: agent.color + "20" }}>
          {agent.emoji}
        </div>

        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-g-text">{agent.name}</span>
            <span className="text-[11px] px-1.5 py-0.5 rounded-md font-medium" style={{ color: agent.color, backgroundColor: agent.color + "15" }}>
              {agent.role}
            </span>
          </div>
          <p className="text-[11px] text-g-text3 mt-0.5">{agent.goal}</p>
        </div>

        <button
          onClick={handleClear}
          className="text-xs text-g-text3 hover:text-red-400 transition-colors px-2 py-1 rounded-md border border-g-border2 hover:border-red-400/30"
        >
          Очистить
        </button>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="text-4xl mb-3">{agent.emoji}</div>
            <h3 className="text-base font-semibold text-g-text mb-1">Чат с {agent.name}</h3>
            <p className="text-xs text-g-text3 max-w-sm">{agent.description}</p>
            <div className="mt-4 flex flex-wrap gap-2 justify-center">
              {["Расскажи о себе", "Что ты умеешь?", "Помоги с задачей"].map((q) => (
                <button
                  key={q}
                  onClick={() => {
                    setInput(q);
                    inputRef.current?.focus();
                  }}
                  className="text-xs px-3 py-1.5 rounded-lg border border-g-border2 text-g-text3 hover:text-g-text hover:border-g-accent/30 transition-colors"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
            <div
              className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                msg.role === "user"
                  ? "bg-g-accent text-g-bg rounded-br-md"
                  : "bg-g-bg2 text-g-text border border-g-border rounded-bl-md"
              }`}
            >
              <div className="whitespace-pre-wrap break-words">{msg.content}</div>
            </div>
          </div>
        ))}

        {sending && (
          <div className="flex justify-start">
            <div className="bg-g-bg2 border border-g-border rounded-2xl rounded-bl-md px-4 py-3">
              <div className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-g-text3 animate-bounce" style={{ animationDelay: "0ms" }} />
                <div className="w-1.5 h-1.5 rounded-full bg-g-text3 animate-bounce" style={{ animationDelay: "150ms" }} />
                <div className="w-1.5 h-1.5 rounded-full bg-g-text3 animate-bounce" style={{ animationDelay: "300ms" }} />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Tool activity bar */}
      {feed.length > 0 && (
        <div className="shrink-0 px-5 py-1.5 border-t border-g-border bg-g-bg2/30">
          <div className="flex items-center gap-2 text-[10px] text-g-text3">
            <div className={`w-1.5 h-1.5 rounded-full ${sending ? "bg-amber-400 animate-pulse" : "bg-emerald-400"}`} />
            <span className="truncate">{feed[feed.length - 1]?.content?.slice(0, 80)}</span>
          </div>
        </div>
      )}

      {/* Input */}
      <div className="shrink-0 p-4 border-t border-g-border bg-g-bg2/50">
        <div className="flex items-end gap-2">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={`Написать ${agent.name}...`}
            rows={1}
            className="flex-1 bg-g-bg rounded-xl border border-g-border2 px-4 py-2.5 text-sm text-g-text placeholder:text-g-text3 focus:outline-none focus:border-g-accent/40 resize-none max-h-32"
            style={{ minHeight: "42px" }}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || sending}
            className="shrink-0 w-10 h-10 rounded-xl bg-g-accent hover:bg-g-accent/90 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center transition-all"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
              <line x1="22" y1="2" x2="11" y2="13" />
              <polygon points="22 2 15 22 11 13 2 9 22 2" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
