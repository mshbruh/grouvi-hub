import React, { useRef, useEffect } from "react";
import type { FeedMessage, Agent } from "./types";

interface FeedPanelProps {
  messages: FeedMessage[];
  agents: Agent[];
  onSelectAgent: (id: string) => void;
}

const TYPE_ICONS: Record<string, string> = {
  thinking: "💭",
  message: "💬",
  tool_call: "🔧",
  tool_result: "✅",
  delegate: "📨",
  error: "❌",
  task_update: "📋",
};

const TYPE_COLORS: Record<string, string> = {
  thinking: "text-amber-400",
  message: "text-g-text",
  tool_call: "text-blue-400",
  tool_result: "text-emerald-400",
  delegate: "text-purple-400",
  error: "text-red-400",
  task_update: "text-g-accent",
};

function timeAgo(ts: number): string {
  const diff = Math.floor((Date.now() - ts) / 1000);
  if (diff < 10) return "сейчас";
  if (diff < 60) return `${diff}с`;
  if (diff < 3600) return `${Math.floor(diff / 60)}м`;
  return `${Math.floor(diff / 3600)}ч`;
}

export default function FeedPanel({ messages, agents, onSelectAgent }: FeedPanelProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  return (
    <div className="h-full flex flex-col">
      <div className="shrink-0 px-4 py-3 border-b border-g-border">
        <h3 className="text-sm font-semibold text-g-text flex items-center gap-2">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
          </svg>
          Лента активности
        </h3>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-xs text-g-text3">
            Пока нет активности
          </div>
        ) : (
          <div className="py-2">
            {messages.map((msg, i) => (
              <div
                key={`${msg.ts}-${i}`}
                className="px-3 py-2 hover:bg-g-bg2/50 cursor-pointer transition-colors"
                onClick={() => onSelectAgent(msg.agentId)}
              >
                <div className="flex items-start gap-2">
                  <span className="text-xs mt-0.5 shrink-0">{msg.agentEmoji}</span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[11px] font-semibold text-g-text">{msg.agentName}</span>
                      <span className="text-[9px] text-g-text3">{timeAgo(msg.ts)}</span>
                    </div>
                    <div className={`text-[11px] mt-0.5 leading-relaxed truncate ${TYPE_COLORS[msg.type] || "text-g-text3"}`}>
                      {TYPE_ICONS[msg.type] || "•"} {msg.content.slice(0, 120)}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
