import React from "react";
import type { ViewMode } from "./types";

interface HeaderProps {
  view: ViewMode;
  onHome: () => void;
  onNewTask: () => void;
  agentCount: number;
  feedCount: number;
  onToggleFeed: () => void;
  onDuetKeys: () => void;
}

export default function Header({ view, onHome, onNewTask, agentCount, feedCount, onToggleFeed, onDuetKeys }: HeaderProps) {
  return (
    <nav className="h-12 bg-g-bg/90 backdrop-blur-xl border-b border-g-border flex items-center justify-between px-4 z-40 shrink-0">
      {/* Left */}
      <div className="flex items-center gap-3">
        <button onClick={onHome} className="flex items-center gap-2 hover:opacity-80 transition-opacity">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round">
              <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
              <polyline points="9 22 9 12 15 12 15 22" />
            </svg>
          </div>
          <span className="text-sm font-bold text-g-text tracking-tight">Grouvi Office</span>
        </button>

        {view !== "office" && (
          <button
            onClick={onHome}
            className="ml-2 text-xs text-g-text3 hover:text-g-text2 flex items-center gap-1 transition-colors"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
            Офис
          </button>
        )}
      </div>

      {/* Center */}
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-[11px] font-medium text-emerald-400">{agentCount} агентов онлайн</span>
        </div>
      </div>

      {/* Right */}
      <div className="flex items-center gap-2">
        <button
          onClick={onDuetKeys}
          className={`flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg transition-colors ${view === "duet-keys" ? "bg-amber-500/20 text-amber-400 border border-amber-500/30" : "text-g-text2 hover:text-g-text border border-g-border2 hover:border-amber-500/30"}`}
        >
          🔑 Ключи
        </button>
        <button
          onClick={onNewTask}
          className="flex items-center gap-1.5 text-xs font-medium text-g-bg bg-g-accent hover:bg-g-accent/90 px-3 py-1.5 rounded-lg transition-colors"
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Задача
        </button>

        <button
          onClick={onToggleFeed}
          className="relative flex items-center gap-1.5 text-xs font-medium text-g-text2 hover:text-g-text px-2.5 py-1.5 rounded-lg border border-g-border2 hover:border-g-accent/30 transition-colors"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
          </svg>
          Лента
          {feedCount > 0 && (
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-g-accent rounded-full text-[9px] text-g-bg flex items-center justify-center font-bold">
              {feedCount > 99 ? "99" : feedCount}
            </span>
          )}
        </button>
      </div>
    </nav>
  );
}
