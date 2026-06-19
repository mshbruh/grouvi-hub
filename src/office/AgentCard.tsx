import React from "react";
import type { Agent, FeedMessage } from "./types";

interface AgentCardProps {
  agent: Agent;
  lastActivity?: FeedMessage;
  onClick: () => void;
}

const TYPE_LABELS: Record<string, string> = {
  thinking: "думает...",
  message: "ответил",
  tool_call: "использует инструмент",
  tool_result: "получил результат",
  delegate: "делегировал",
  error: "ошибка",
  task_update: "обновление",
};

function statusDotClass(agent: Agent, lastActivity?: FeedMessage): string {
  // Use backend status if available
  if (agent.status === "error") return "bg-red-400";
  if (agent.status === "busy") return "bg-amber-400 animate-pulse";
  // Fallback to feed-based detection
  if (lastActivity && Date.now() - lastActivity.ts < 15000) {
    if (lastActivity.type === "error") return "bg-red-400";
    return "bg-amber-400 animate-pulse";
  }
  return "bg-emerald-400";
}

export default function AgentCard({ agent, lastActivity, onClick }: AgentCardProps) {
  return (
    <button
      onClick={onClick}
      className="group relative bg-g-bg2 rounded-2xl p-5 border border-g-border hover:border-g-accent/40 transition-all duration-200 text-left hover:shadow-lg hover:shadow-black/20 hover:-translate-y-0.5"
    >
      {/* Status dot */}
      <div className={`absolute top-4 right-4 w-2.5 h-2.5 rounded-full ${statusDotClass(agent, lastActivity)}`} />

      {/* Avatar */}
      <div
        className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl mb-3"
        style={{ backgroundColor: agent.color + "20" }}
      >
        {agent.emoji}
      </div>

      {/* Name & Role */}
      <div className="mb-2">
        <h3 className="text-base font-semibold text-g-text group-hover:text-g-accent transition-colors">
          {agent.name}
        </h3>
        <span className="text-xs font-medium" style={{ color: agent.color }}>
          {agent.role}
        </span>
      </div>

      {/* Description */}
      <p className="text-xs text-g-text3 leading-relaxed mb-3 line-clamp-2">
        {agent.description}
      </p>

      {/* Stats */}
      <div className="flex items-center gap-3 text-[11px] text-g-text3">
        <span className="flex items-center gap-1">
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z" />
          </svg>
          {agent.toolCount} tools
        </span>
        {agent.messageCount > 0 && (
          <span className="flex items-center gap-1">
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
            </svg>
            {agent.messageCount} msgs
          </span>
        )}
      </div>

      {/* Last activity */}
      {lastActivity && (
        <div className="mt-3 pt-3 border-t border-g-border">
          <div className="text-[10px] text-g-text3 truncate">
            <span className={`inline-block w-1.5 h-1.5 rounded-full mr-1 ${lastActivity.type === "error" ? "bg-red-400" : lastActivity.type === "thinking" ? "bg-amber-400" : "bg-emerald-400"}`} />
            {TYPE_LABELS[lastActivity.type] || lastActivity.type}: {lastActivity.content.slice(0, 60)}
          </div>
        </div>
      )}
    </button>
  );
}
