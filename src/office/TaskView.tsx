import React, { useRef, useEffect } from "react";
import type { FeedMessage } from "./types";

interface TaskViewProps {
  feed: FeedMessage[];
}

const TYPE_STYLES: Record<string, { bg: string; border: string; text: string; icon: string }> = {
  thinking: { bg: "bg-amber-500/5", border: "border-amber-500/20", text: "text-amber-300", icon: "💭" },
  message: { bg: "bg-g-bg2", border: "border-g-border", text: "text-g-text", icon: "💬" },
  tool_call: { bg: "bg-blue-500/5", border: "border-blue-500/20", text: "text-blue-300", icon: "🔧" },
  tool_result: { bg: "bg-emerald-500/5", border: "border-emerald-500/20", text: "text-emerald-300", icon: "✅" },
  delegate: { bg: "bg-purple-500/5", border: "border-purple-500/20", text: "text-purple-300", icon: "📨" },
  error: { bg: "bg-red-500/5", border: "border-red-500/20", text: "text-red-300", icon: "❌" },
  task_update: { bg: "bg-g-accent/5", border: "border-g-accent/20", text: "text-g-accent", icon: "📋" },
};

export default function TaskView({ feed }: TaskViewProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [feed]);

  // Filter feed to show only task-related messages (recent)
  const taskFeed = feed.filter((m) => m.taskId || m.type === "task_update").slice(-100);
  const isWorking = taskFeed.some(
    (m) => m.type === "thinking" && Date.now() - m.ts < 30000
  );

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="shrink-0 px-6 py-4 border-b border-g-border">
        <div className="flex items-center gap-3">
          <div className={`w-3 h-3 rounded-full ${isWorking ? "bg-amber-400 animate-pulse" : "bg-emerald-400"}`} />
          <div>
            <h2 className="text-base font-semibold text-g-text">Выполнение задачи</h2>
            <p className="text-xs text-g-text3 mt-0.5">
              {isWorking ? "Команда работает над задачей..." : "Наблюдайте за работой команды в реальном времени"}
            </p>
          </div>
        </div>
      </div>

      {/* Task timeline */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-6 py-4">
        {taskFeed.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="text-4xl mb-3">📋</div>
            <p className="text-sm text-g-text3">Задача отправлена команде. Ожидайте...</p>
            <div className="mt-4 flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-g-accent animate-bounce" style={{ animationDelay: "0ms" }} />
              <div className="w-2 h-2 rounded-full bg-g-accent animate-bounce" style={{ animationDelay: "200ms" }} />
              <div className="w-2 h-2 rounded-full bg-g-accent animate-bounce" style={{ animationDelay: "400ms" }} />
            </div>
          </div>
        ) : (
          <div className="space-y-2 max-w-3xl mx-auto">
            {taskFeed.map((msg, i) => {
              const style = TYPE_STYLES[msg.type] || TYPE_STYLES.message;
              return (
                <div
                  key={`${msg.ts}-${i}`}
                  className={`rounded-xl px-4 py-3 border ${style.bg} ${style.border} animate-fade-in`}
                >
                  <div className="flex items-start gap-3">
                    <span className="text-lg shrink-0">{msg.agentEmoji}</span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-g-text">{msg.agentName}</span>
                        <span className="text-[10px] text-g-text3">{msg.agentRole}</span>
                        <span className="text-[10px] text-g-text3 ml-auto">
                          {new Date(msg.ts).toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                        </span>
                      </div>
                      <div className={`text-sm mt-1 leading-relaxed ${style.text}`}>
                        {style.icon} {msg.content}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
