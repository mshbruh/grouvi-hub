"use client";

import React from "react";

interface TopBarProps {
  onAddWindow: () => void;
  windowCount: number;
}

export default function TopBar({ onAddWindow, windowCount }: TopBarProps) {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-5 h-11 bg-g-bg/80 backdrop-blur-xl border-b border-g-border">
      {/* Left */}
      <div className="flex items-center gap-6">
        <span className="flex items-center gap-2 text-sm font-semibold text-g-accent tracking-tight">
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className="text-g-accent"
          >
            <circle cx="12" cy="12" r="10" />
            <path d="M12 6v6l4 2" />
          </svg>
          Grouvi
        </span>
      </div>

      {/* Right */}
      <div className="flex items-center gap-3">
        {windowCount > 0 && (
          <span className="text-[11px] font-mono text-g-text3">
            {windowCount} {windowCount === 1 ? "окно" : windowCount < 5 ? "окна" : "окон"}
          </span>
        )}
        <button
          onClick={onAddWindow}
          className="flex items-center gap-1.5 text-[12px] font-medium text-g-text2 px-3 py-1.5 rounded-md border border-g-border2 hover:border-g-accent/30 hover:text-g-text hover:bg-white/[.03] transition-all"
        >
          <svg
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
          >
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Окно
        </button>

        <div className="w-px h-5 bg-g-border mx-1" />

        <span className="flex items-center gap-1.5 text-[11px] font-mono text-g-green">
          <span className="w-1.5 h-1.5 rounded-full bg-g-green" />
          online
        </span>

        <button className="text-[12px] text-g-text2 px-3 py-1.5 rounded-md hover:text-g-text hover:bg-white/[.03] transition-all">
          Войти
        </button>

        <button className="text-[12px] font-medium px-4 py-1.5 rounded-md bg-g-accent text-g-bg hover:bg-g-accent2 transition-colors">
          Начать
        </button>
      </div>
    </nav>
  );
}
